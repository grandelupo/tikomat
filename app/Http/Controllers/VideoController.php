<?php

namespace App\Http\Controllers;

use App\Models\Video;
use App\Models\VideoTarget;
use App\Models\VideoVersion;
use App\Models\Channel;
use App\Models\SocialAccount;
use App\Services\VideoProcessingService;
use App\Services\VideoUploadService;
use App\Jobs\UpdateVideoMetadataJob;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class VideoController extends Controller
{
    use AuthorizesRequests;

    protected VideoProcessingService $videoService;
    protected VideoUploadService $uploadService;

    public function __construct(VideoProcessingService $videoService, VideoUploadService $uploadService)
    {
        $this->videoService = $videoService;
        $this->uploadService = $uploadService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Video::where('user_id', $request->user()->id)
            ->whereHas('channel') // Only include videos with valid channels
            ->with(['targets', 'channel']);

        // Apply filters
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('channel') && $request->channel !== 'all') {
            $query->whereHas('channel', function ($q) use ($request) {
                $q->where('slug', $request->channel);
            });
        }

        if ($request->filled('platform') && $request->platform !== 'all') {
            $query->whereHas('targets', function ($q) use ($request) {
                $q->where('platform', $request->platform);
            });
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->whereHas('targets', function ($q) use ($request) {
                $q->where('status', $request->status);
            });
        }

        $videos = $query->orderBy('created_at', 'desc')->paginate(15);

        // Get user's channels for filter dropdown
        $channels = $request->user()->channels()->select('id', 'name', 'slug')->get();

        return Inertia::render('Videos/Index', [
            'videos' => $videos,
            'channels' => $channels,
            'filters' => $request->only(['search', 'channel', 'platform', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Channel $channel, Request $request): Response
    {
        // Channel ownership is already ensured by route model binding

        // Get connected platforms for this channel
        $connectedPlatforms = $channel->socialAccounts->pluck('platform')->toArray();
        $allowedPlatforms = $request->user()->getAllowedPlatforms();
        
        // Filter connected platforms by what user is allowed to access
        $availablePlatforms = array_intersect($connectedPlatforms, $allowedPlatforms);
        
        // Filter default platforms to only include connected ones
        $defaultPlatforms = array_intersect($channel->default_platforms_list, $connectedPlatforms);

        // Get all Facebook pages for the user (across all channels they own)
        $facebookPages = [];
        if (in_array('facebook', $availablePlatforms)) {
            $facebookAccounts = $request->user()->socialAccounts()
                ->where('platform', 'facebook')
                ->whereNotNull('facebook_page_id')
                ->get(['id', 'facebook_page_id', 'facebook_page_name', 'channel_id']);
            
            foreach ($facebookAccounts as $account) {
                $facebookPages[] = [
                    'social_account_id' => $account->id,
                    'page_id' => $account->facebook_page_id,
                    'page_name' => $account->facebook_page_name,
                    'channel_id' => $account->channel_id,
                    'is_current_channel' => $account->channel_id === $channel->id,
                ];
            }
        }

        return Inertia::render('Videos/Create', [
            'channel' => $channel,
            'availablePlatforms' => $availablePlatforms,
            'defaultPlatforms' => $defaultPlatforms,
            'connectedPlatforms' => $connectedPlatforms,
            'allowedPlatforms' => $allowedPlatforms,
            'facebookPages' => $facebookPages,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Channel $channel): RedirectResponse
    {
        // Channel ownership is already ensured by route model binding

        $request->validate([
            'video' => 'required|file|mimes:mp4,mov,avi,wmv,webm|max:102400', // 100MB max
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'platforms' => 'required|array|min:1',
            'platforms.*' => 'in:youtube,instagram,tiktok,facebook,snapchat,pinterest,x',
            'publish_type' => 'required|in:now,scheduled',
            'publish_at' => 'required_if:publish_type,scheduled|nullable|date|after:now',
            'cloud_providers' => 'nullable|array',
            'cloud_providers.*' => 'in:google_drive,dropbox',
            'cloud_folders' => 'nullable|array',
            'cloud_folders.*' => 'nullable|string',
            'advanced_options' => 'nullable|array',
            'facebook_page_id' => 'nullable|string|exists:social_accounts,facebook_page_id',
        ]);

        // Validate that user can access selected platforms
        $allowedPlatforms = $request->user()->getAllowedPlatforms();
        $connectedPlatforms = $channel->socialAccounts->pluck('platform')->toArray();
        
        foreach ($request->platforms as $platform) {
            if (!in_array($platform, $allowedPlatforms)) {
                return redirect()->back()
                    ->withErrors(['platforms' => "Platform '{$platform}' is not available with your current plan."])
                    ->withInput();
            }
            
            if (!in_array($platform, $connectedPlatforms)) {
                return redirect()->back()
                    ->withErrors(['platforms' => "Platform '{$platform}' is not connected to this channel."])
                    ->withInput();
            }
        }

        // Validate Facebook page selection if Facebook is selected
        if (in_array('facebook', $request->platforms)) {
            if (empty($request->facebook_page_id)) {
                return redirect()->back()
                    ->withErrors(['facebook_page_id' => 'Please select a Facebook page to publish to.'])
                    ->withInput();
            }
            
            // Verify user owns this Facebook page
            $facebookAccount = SocialAccount::where('user_id', $request->user()->id)
                ->where('platform', 'facebook')
                ->where('facebook_page_id', $request->facebook_page_id)
                ->first();
                
            if (!$facebookAccount) {
                return redirect()->back()
                    ->withErrors(['facebook_page_id' => 'Invalid Facebook page selection.'])
                    ->withInput();
            }
        }

        try {
            Log::info('Starting video upload process', [
                'user_id' => $request->user()->id,
                'channel_id' => $channel->id,
                'title' => $request->title,
                'platforms' => $request->platforms,
                'publish_type' => $request->publish_type,
                'file_name' => $request->file('video')->getClientOriginalName(),
                'file_size' => $request->file('video')->getSize(),
                'mime_type' => $request->file('video')->getMimeType(),
            ]);

            // Validate and process video
            $this->videoService->validateVideo($request->file('video'));
            Log::info('Video validation passed');

            // Process video normally (cloud upload will happen in background)
            $videoInfo = $this->videoService->processVideo($request->file('video'));
            
            Log::info('Video processing completed', [
                'duration' => $videoInfo['duration'],
                'thumbnail_path' => $videoInfo['thumbnail_path'] ?? 'none',
                'file_path' => $videoInfo['path'],
            ]);

            $video = null;
            DB::transaction(function () use ($request, $videoInfo, $channel, &$video) {
                // Prepare cloud upload data
                $cloudProviders = $request->cloud_providers ?? [];
                $cloudFolders = $request->cloud_folders ?? [];
                $cloudUploadStatus = [];
                $cloudUploadFolders = [];

                foreach ($cloudProviders as $provider) {
                    $cloudUploadStatus[$provider] = 'pending';
                    $cloudUploadFolders[$provider] = $cloudFolders[$provider] ?? null;
                }

                // Create video record
                $video = Video::create([
                    'user_id' => $request->user()->id,
                    'channel_id' => $channel->id,
                    'title' => $request->title,
                    'description' => $request->description,
                    'tags' => $request->tags ?? [],
                    'original_file_path' => $videoInfo['path'],
                    'duration' => $videoInfo['duration'],
                    'thumbnail_path' => $videoInfo['thumbnail_path'] ?? null,
                    'video_width' => $videoInfo['width'] ?? null,
                    'video_height' => $videoInfo['height'] ?? null,
                    'cloud_upload_providers' => !empty($cloudProviders) ? $cloudProviders : null,
                    'cloud_upload_status' => !empty($cloudUploadStatus) ? $cloudUploadStatus : null,
                    'cloud_upload_folders' => !empty($cloudUploadFolders) ? $cloudUploadFolders : null,
                ]);

                Log::info('Video record created', [
                    'video_id' => $video->id,
                    'duration' => $video->duration,
                    'thumbnail_path' => $video->thumbnail_path,
                    'cloud_providers' => $cloudProviders,
                ]);

                // Create video targets for each platform
                foreach ($request->platforms as $platform) {
                    $advancedOptions = $request->advanced_options[$platform] ?? null;
                    
                    // For Facebook, store the selected page ID
                    $targetData = [
                        'video_id' => $video->id,
                        'platform' => $platform,
                        'publish_at' => $request->publish_type === 'scheduled' ? $request->publish_at : null,
                        'status' => 'pending',
                        'advanced_options' => $advancedOptions,
                    ];
                    
                    if ($platform === 'facebook' && $request->facebook_page_id) {
                        $targetData['facebook_page_id'] = $request->facebook_page_id;
                    }
                    
                    $target = VideoTarget::create($targetData);

                    Log::info('Video target created', [
                        'target_id' => $target->id,
                        'platform' => $platform,
                        'status' => $target->status,
                        'publish_at' => $target->publish_at,
                        'advanced_options' => $advancedOptions ? 'present' : 'none',
                        'facebook_page_id' => $platform === 'facebook' ? $request->facebook_page_id : null,
                    ]);
                }
            });

            // Update channel default platforms based on user selection
            $channel->updateDefaultPlatforms($request->platforms);

            // Dispatch upload jobs for immediate publishing
            if ($request->publish_type === 'now') {
                Log::info('Dispatching immediate upload jobs for video', ['video_id' => $video->id]);
                foreach ($video->targets as $target) {
                    Log::info('Dispatching job for target', [
                        'target_id' => $target->id,
                        'platform' => $target->platform,
                    ]);
                    $this->uploadService->dispatchUploadJob($target);
                }
            } else {
                Log::info('Video scheduled for later publishing', [
                    'video_id' => $video->id,
                    'publish_at' => $request->publish_at,
                ]);
            }

            // Dispatch cloud upload jobs if cloud providers are selected
            $cloudProviders = $request->cloud_providers ?? [];
            if (!empty($cloudProviders)) {
                $cloudFolders = $request->cloud_folders ?? [];
                Log::info('Dispatching cloud upload jobs', [
                    'video_id' => $video->id,
                    'providers' => $cloudProviders,
                ]);
                
                foreach ($cloudProviders as $provider) {
                    $folderPath = $cloudFolders[$provider] ?? null;
                    
                    try {
                        \App\Jobs\UploadVideoToCloudStorage::dispatch($video, $provider, $folderPath);
                        Log::info('Dispatched cloud upload job', [
                            'video_id' => $video->id,
                            'provider' => $provider,
                            'folder_path' => $folderPath,
                        ]);
                    } catch (\Exception $e) {
                        Log::error('Failed to dispatch cloud upload job', [
                            'video_id' => $video->id,
                            'provider' => $provider,
                            'error' => $e->getMessage(),
                        ]);
                        
                        // Mark as failed immediately
                        $video->updateCloudUploadStatus($provider, 'failed', [
                            'error' => 'Failed to dispatch upload job: ' . $e->getMessage(),
                            'failed_at' => now()->toISOString(),
                        ]);
                    }
                }
            }

            Log::info('Video upload process completed successfully', ['video_id' => $video->id]);

            return redirect()->route('channels.show', $channel->slug)
                ->with('success', 'Video uploaded successfully and queued for publishing!');

        } catch (\Exception $e) {
            Log::error('Video upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $request->user()->id,
                'file_name' => $request->file('video')->getClientOriginalName() ?? 'unknown',
            ]);

            return redirect()->back()
                ->withErrors(['video' => $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Video $video): Response
    {
        // Video ownership is already ensured by route model binding

        $video->load(['targets']);

        return Inertia::render('Videos/Edit', [
            'video' => $video,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Video $video): RedirectResponse
    {
        // Video ownership is already ensured by route model binding

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        // Check if title or description has changed
        $titleChanged = $video->title !== $request->title;
        $descriptionChanged = $video->description !== $request->description;
        
        $video->update([
            'title' => $request->title,
            'description' => $request->description,
        ]);

        // If title or description changed, automatically update published videos
        if ($titleChanged || $descriptionChanged) {
            Log::info('Video metadata changed, re-publishing to platforms', [
                'video_id' => $video->id,
                'title_changed' => $titleChanged,
                'description_changed' => $descriptionChanged,
            ]);

            // Get all successful targets and mark them for re-publishing
            $successfulTargets = $video->targets()->where('status', 'success')->get();
            
            foreach ($successfulTargets as $target) {
                // Reset status to pending for re-publishing
                $target->update([
                    'status' => 'pending',
                    'error_message' => null,
                ]);

                // Dispatch update job to platforms that support metadata updates
                try {
                    $this->uploadService->dispatchUpdateJob($target);
                    Log::info('Dispatched metadata update job', [
                        'target_id' => $target->id,
                        'platform' => $target->platform,
                    ]);
                } catch (\Exception $e) {
                    Log::error('Failed to dispatch metadata update job', [
                        'target_id' => $target->id,
                        'platform' => $target->platform,
                        'error' => $e->getMessage(),
                    ]);
                    
                    $target->update([
                        'status' => 'failed',
                        'error_message' => 'Failed to update video metadata: ' . $e->getMessage(),
                    ]);
                }
            }

            return redirect()->route('videos.edit', $video)
                ->with('success', 'Video updated successfully! Video metadata is being updated on all published platforms.');
        }

        return redirect()->route('videos.edit', $video)
            ->with('success', 'Video updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Video $video): RedirectResponse
    {
        // Video ownership is already ensured by route model binding

        $video->delete();

        return redirect()->route('dashboard')
            ->with('success', 'Video deleted successfully!');
    }

    /**
     * Retry failed video target.
     */
    public function retryTarget($targetId): RedirectResponse
    {
        \Log::info('retryTarget method called', [
            'target_id' => $targetId,
            'current_user_id' => auth()->id(),
            'request_method' => request()->method(),
            'request_url' => request()->fullUrl(),
            'user_agent' => request()->userAgent(),
            'ip' => request()->ip(),
        ]);

        // Manual lookup and authorization check
        $target = \App\Models\VideoTarget::with('video')->find($targetId);
        
        if (!$target) {
            \Log::warning('VideoTarget not found', ['target_id' => $targetId]);
            abort(404, 'Video target not found');
        }

        \Log::info('VideoTarget authorization check details', [
            'target_id' => $targetId,
            'target_exists' => $target ? true : false,
            'target_video_id' => $target?->video_id,
            'target_video_exists' => $target?->video ? true : false,
            'target_video_user_id' => $target?->video?->user_id,
            'current_user_id' => auth()->id(),
            'user_authenticated' => auth()->check(),
            'authorization_will_pass' => $target?->video?->user_id === auth()->id(),
        ]);

        $videoUserId = $target->video->user_id;
        $currentUserId = auth()->id();
        $comparison = $videoUserId !== $currentUserId;
        
        // Temporary: Show detailed debugging info
        $debugInfo = [
            'target_id' => $targetId,
            'video_user_id' => $videoUserId,
            'video_user_id_type' => gettype($videoUserId),
            'current_user_id' => $currentUserId,
            'current_user_id_type' => gettype($currentUserId),
            'comparison_result' => $comparison,
            'strict_equal' => $videoUserId === $currentUserId,
            'loose_equal' => $videoUserId == $currentUserId,
        ];
        
        if ($comparison) {
            \Log::warning('VideoTarget unauthorized access', $debugInfo);
            
            $errorDetails = json_encode($debugInfo, JSON_PRETTY_PRINT);
            abort(403, "Unauthorized access to video target. Debug: {$errorDetails}");
        }

        \Log::info('retryTarget authorization passed', [
            'target_id' => $target->id,
            'target_platform' => $target->platform,
            'target_status' => $target->status,
            'video_id' => $target->video_id,
        ]);

        try {
            $this->uploadService->retryFailedTarget($target);

            return redirect()->back()
                ->with('success', 'Video target queued for retry!');
        } catch (\Exception $e) {
            \Log::error('retryTarget failed', [
                'target_id' => $target->id,
                'error' => $e->getMessage(),
            ]);
            return redirect()->back()
                ->with('error', $e->getMessage());
        }
    }

    /**
     * Remove video from a specific platform.
     */
    public function deleteTarget(VideoTarget $target): RedirectResponse
    {
        // Video ownership is already ensured by route model binding

        $platform = ucfirst($target->platform);
        
        try {
            Log::info('Removing video from platform', [
                'target_id' => $target->id,
                'video_id' => $target->video_id,
                'platform' => $target->platform,
                'status' => $target->status,
                'has_platform_video_id' => !empty($target->platform_video_id),
                'user_id' => auth()->id(),
            ]);

            $jobDispatched = false;
            $jobDispatchError = null;

            // If the video was successfully published, try to remove it from the platform
            if ($target->status === 'success' && $target->platform_video_id) {
                try {
                    // Dispatch a job to remove the video from the platform
                    $this->uploadService->dispatchRemovalJob($target);
                    $jobDispatched = true;
                    
                    Log::info('Dispatched video removal job', [
                        'target_id' => $target->id,
                        'platform' => $target->platform,
                        'platform_video_id' => $target->platform_video_id,
                    ]);
                } catch (\Exception $e) {
                    $jobDispatchError = $e->getMessage();
                    Log::warning('Failed to dispatch removal job, proceeding with local deletion', [
                        'target_id' => $target->id,
                        'platform' => $target->platform,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Store platform info before deletion
            $platformInfo = [
                'platform' => $target->platform,
                'platform_video_id' => $target->platform_video_id,
                'status' => $target->status,
            ];

            // Remove the target record from our database
            $target->delete();

            Log::info('Video target deleted successfully', [
                'target_id' => $target->id,
                'platform' => $platformInfo['platform'],
                'job_dispatched' => $jobDispatched,
            ]);

            // Provide appropriate user feedback based on what happened
            if ($platformInfo['status'] !== 'success') {
                return redirect()->back()
                    ->with('success', "Video target removed from {$platform}. (Video was not successfully published, so no platform removal was needed.)");
            } elseif (!$platformInfo['platform_video_id']) {
                return redirect()->back()
                    ->with('success', "Video target removed from {$platform}. (No platform video ID found, so no platform removal was needed.)");
            } elseif ($jobDispatched) {
                return redirect()->back()
                    ->with('success', "Video removal from {$platform} has been queued. The video will be removed from the platform shortly.");
            } else {
                return redirect()->back()
                    ->with('warning', "Video removed from Filmate, but could not queue removal from {$platform}: {$jobDispatchError}");
            }

        } catch (\Exception $e) {
            Log::error('Failed to remove video from platform', [
                'target_id' => $target->id,
                'platform' => $target->platform,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()
                ->with('error', "Failed to remove video from {$platform}: " . $e->getMessage());
        }
    }

    /**
     * Serve video file for authenticated users.
     */
    public function serveVideo(string $filename)
    {
        // Find the video that belongs to the authenticated user
        $video = Video::where('user_id', auth()->id())
            ->where('original_file_path', 'like', '%' . $filename)
            ->first();

        if (!$video) {
            abort(404, 'Video not found or unauthorized access');
        }

        $path = Storage::path($video->original_file_path);
        
        if (!file_exists($path)) {
            abort(404, 'Video file not found on disk');
        }

        // Get the MIME type based on file extension
        $mimeType = match (strtolower(pathinfo($filename, PATHINFO_EXTENSION))) {
            'mp4' => 'video/mp4',
            'webm' => 'video/webm',
            'ogg' => 'video/ogg',
            'avi' => 'video/x-msvideo',
            'mov' => 'video/quicktime',
            default => 'video/mp4',
        };

        return response()->file($path, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'private, max-age=3600',
        ]);
    }

    /**
     * Update video metadata on all connected platforms.
     */
    public function updateAllPlatforms(Request $request, Video $video): JsonResponse
    {
        // Video ownership is already ensured by route model binding

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);

        try {
            // Check if any metadata has changed
            $titleChanged = $video->title !== $request->title;
            $descriptionChanged = $video->description !== $request->description;
            $tagsChanged = json_encode($video->tags ?? []) !== json_encode($request->tags ?? []);
            
            if (!$titleChanged && !$descriptionChanged && !$tagsChanged) {
                return response()->json([
                    'success' => true,
                    'message' => 'No changes detected',
                ]);
            }

            // Update the video record
            $video->update([
                'title' => $request->title,
                'description' => $request->description,
                'tags' => $request->tags ?? [],
            ]);

            Log::info('Video metadata updated, dispatching platform updates', [
                'video_id' => $video->id,
                'title_changed' => $titleChanged,
                'description_changed' => $descriptionChanged,
                'tags_changed' => $tagsChanged,
            ]);

            // Get all successful targets and dispatch update jobs
            $successfulTargets = $video->targets()->where('status', 'success')->get();
            $updatedPlatforms = [];
            $failedPlatforms = [];
            
            foreach ($successfulTargets as $target) {
                try {
                    // Mark target as processing update
                    $target->update([
                        'status' => 'processing',
                        'error_message' => null,
                    ]);

                    // Dispatch update job
                    $this->uploadService->dispatchUpdateJob($target);
                    $updatedPlatforms[] = ucfirst($target->platform);
                    
                    Log::info('Dispatched platform update job', [
                        'target_id' => $target->id,
                        'platform' => $target->platform,
                    ]);
                } catch (\Exception $e) {
                    $failedPlatforms[] = ucfirst($target->platform);
                    Log::error('Failed to dispatch platform update job', [
                        'target_id' => $target->id,
                        'platform' => $target->platform,
                        'error' => $e->getMessage(),
                    ]);
                    
                    $target->update([
                        'status' => 'failed',
                        'error_message' => 'Failed to update video metadata: ' . $e->getMessage(),
                    ]);
                }
            }

            // Prepare response message
            $message = 'Video updated successfully!';
            if (!empty($updatedPlatforms)) {
                $message .= ' Updates dispatched to: ' . implode(', ', $updatedPlatforms);
            }
            if (!empty($failedPlatforms)) {
                $message .= ' Failed to update: ' . implode(', ', $failedPlatforms);
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'updated_platforms' => $updatedPlatforms,
                    'failed_platforms' => $failedPlatforms,
                    'total_platforms' => count($successfulTargets),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update video on all platforms', [
                'video_id' => $video->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update video on platforms: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Instant upload with AI-powered metadata generation.
     */
    public function instantUpload(Request $request, Channel $channel): JsonResponse
    {
        // Channel ownership is already ensured by route model binding

        try {
            $request->validate([
                'video' => 'required|file|mimes:mp4,mov,avi,wmv,webm|max:102400', // 100MB max
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        }

        try {
            Log::info('Starting instant upload process', [
                'user_id' => $request->user()->id,
                'channel_id' => $channel->id,
                'file_name' => $request->file('video')->getClientOriginalName(),
                'file_size' => $request->file('video')->getSize(),
                'mime_type' => $request->file('video')->getMimeType(),
            ]);

            // Validate and process video
            $this->videoService->validateVideo($request->file('video'));
            Log::info('Video validation passed for instant upload');

            // Process video
            $videoInfo = $this->videoService->processVideo($request->file('video'));
            
            Log::info('Video processing completed for instant upload', [
                'duration' => $videoInfo['duration'],
                'thumbnail_path' => $videoInfo['thumbnail_path'] ?? 'none',
                'file_path' => $videoInfo['path'],
            ]);

            $video = null;
            DB::transaction(function () use ($request, $videoInfo, $channel, &$video) {
                // Create video record with placeholder data
                $video = Video::create([
                    'user_id' => $request->user()->id,
                    'channel_id' => $channel->id,
                    'title' => 'Processing...',
                    'description' => 'AI is generating optimized content...',
                    'original_file_path' => $videoInfo['path'],
                    'duration' => $videoInfo['duration'],
                    'thumbnail_path' => $videoInfo['thumbnail_path'] ?? null,
                    'video_width' => $videoInfo['width'] ?? null,
                    'video_height' => $videoInfo['height'] ?? null,
                ]);

                Log::info('Video record created for instant upload', [
                    'video_id' => $video->id,
                    'duration' => $video->duration,
                    'thumbnail_path' => $video->thumbnail_path,
                ]);
            });

            // Get connected platforms for the channel
            $connectedPlatforms = $channel->socialAccounts->pluck('platform')->toArray();
            $allowedPlatforms = $request->user()->getAllowedPlatforms();
            
            // Filter platforms to only include those that are both connected and allowed
            $availablePlatforms = array_intersect($connectedPlatforms, $allowedPlatforms);

            if (empty($availablePlatforms)) {
                Log::warning('No platforms available for instant upload', [
                    'user_id' => $request->user()->id,
                    'channel_id' => $channel->id,
                    'connected_platforms' => $connectedPlatforms,
                    'allowed_platforms' => $allowedPlatforms,
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'No platforms available for instant upload. Please connect platforms first.'
                ], 400);
            }

            // Dispatch AI processing job
            \App\Jobs\ProcessInstantUploadWithAI::dispatch($video, $availablePlatforms);

            Log::info('Instant upload AI processing job dispatched', [
                'video_id' => $video->id,
                'platforms' => $availablePlatforms,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Video uploaded successfully! AI is processing your content and will publish automatically.',
                'data' => [
                    'video_id' => $video->id,
                    'platforms' => $availablePlatforms,
                    'file_name' => $request->file('video')->getClientOriginalName(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Instant upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => $request->user()->id,
                'file_name' => $request->file('video')->getClientOriginalName() ?? 'unknown',
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check if video has unsaved changes.
     */
    public function checkUnsavedChanges(Request $request, Video $video): JsonResponse
    {
        // Video ownership is already ensured by route model binding

        try {
            $hasUnsavedChanges = $video->hasUnsavedChanges();
            $currentVersion = $video->currentVersion();
            $changes = [];

            if ($hasUnsavedChanges && $currentVersion) {
                $backupVersion = $video->backupVersion();
                
                if ($backupVersion) {
                    $differences = $currentVersion->getDifferences($backupVersion);
                    
                    foreach ($differences as $field => $diff) {
                        $changes[] = [
                            'type' => $field,
                            'field' => $field,
                            'oldValue' => $diff['old'],
                            'newValue' => $diff['new'],
                            'timestamp' => $currentVersion->created_at,
                        ];
                    }

                    if ($currentVersion->has_subtitle_changes) {
                        $changes[] = [
                            'type' => 'subtitles',
                            'field' => 'subtitles',
                            'oldValue' => false,
                            'newValue' => true,
                            'timestamp' => $currentVersion->created_at,
                        ];
                    }

                    if ($currentVersion->has_watermark_removal) {
                        $changes[] = [
                            'type' => 'watermark_removal',
                            'field' => 'watermark_removal',
                            'oldValue' => false,
                            'newValue' => true,
                            'timestamp' => $currentVersion->created_at,
                        ];
                    }
                }
            }

            return response()->json([
                'has_unsaved_changes' => $hasUnsavedChanges,
                'changes' => $changes,
                'latest_data' => $currentVersion ? [
                    'title' => $currentVersion->title,
                    'description' => $currentVersion->description,
                    'tags' => $currentVersion->tags,
                    'thumbnail' => $currentVersion->thumbnail_path,
                ] : null,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to check unsaved changes', [
                'video_id' => $video->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'has_unsaved_changes' => false,
                'changes' => [],
                'latest_data' => null,
            ]);
        }
    }

    /**
     * Auto-save video changes.
     */
    public function autoSave(Request $request, Video $video): JsonResponse
    {
        // Video ownership is already ensured by route model binding

        try {
            $request->validate([
                'type' => 'required|string',
                'field' => 'required|string',
                'value' => 'nullable',
                'title' => 'nullable|string|max:255',
                'description' => 'nullable|string|max:1000',
                'tags' => 'nullable|array',
                'tags.*' => 'string|max:50',
                'thumbnail' => 'nullable|string',
                'has_subtitle_changes' => 'nullable|boolean',
                'has_watermark_removal' => 'nullable|boolean',
            ]);

            // Create backup version if it doesn't exist
            if (!$video->backupVersion()) {
                VideoVersion::createBackup($video);
                Log::info('Created backup version for video', ['video_id' => $video->id]);
            }

            // Get or create current version
            $currentVersion = $video->currentVersion();
            
            $changes = [
                'title' => $request->title ?? $video->title,
                'description' => $request->description ?? $video->description,
                'tags' => $request->tags ?? $video->tags,
                'thumbnail' => $request->thumbnail ?? $video->thumbnail_path,
                'has_subtitle_changes' => $request->has_subtitle_changes ?? false,
                'has_watermark_removal' => $request->has_watermark_removal ?? false,
            ];

            $changesSummary = [
                'type' => $request->type,
                'field' => $request->field,
                'timestamp' => now(),
                'change_description' => $this->getChangeDescription($request->type, $request->field),
            ];

            if ($currentVersion) {
                // Update existing current version
                $currentVersion->update([
                    'title' => $changes['title'],
                    'description' => $changes['description'],
                    'tags' => $changes['tags'],
                    'thumbnail_path' => $changes['thumbnail'],
                    'has_subtitle_changes' => $changes['has_subtitle_changes'],
                    'has_watermark_removal' => $changes['has_watermark_removal'],
                    'changes_summary' => array_merge(
                        $currentVersion->changes_summary ?? [],
                        [$changesSummary]
                    ),
                ]);
            } else {
                // Create new current version
                VideoVersion::createCurrent($video, $changes, [$changesSummary]);
            }

            // Update the actual video record for immediate UI consistency
            $video->update([
                'title' => $changes['title'],
                'description' => $changes['description'],
                'tags' => $changes['tags'],
                'thumbnail_path' => $changes['thumbnail'],
            ]);

            Log::info('Auto-saved video changes', [
                'video_id' => $video->id,
                'type' => $request->type,
                'field' => $request->field,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Changes auto-saved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Auto-save failed', [
                'video_id' => $video->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to auto-save changes: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Publish changes to all platforms.
     */
    public function publishChanges(Request $request, Video $video): JsonResponse
    {
        // Video ownership is already ensured by route model binding

        try {
            if (!$video->hasUnsavedChanges()) {
                return response()->json([
                    'success' => true,
                    'message' => 'No changes to publish',
                    'jobs_created' => 0,
                ]);
            }

            $currentVersion = $video->currentVersion();
            
            if (!$currentVersion) {
                return response()->json([
                    'success' => false,
                    'message' => 'No current version found',
                ], 400);
            }

            // Apply current version to the main video record
            $currentVersion->applyToVideo();

            // Get all successful targets for platform updates
            $successfulTargets = $video->targets()->where('status', 'success')->get();
            $jobsCreated = 0;
            $failedPlatforms = [];

            foreach ($successfulTargets as $target) {
                try {
                    // Dispatch update job
                    UpdateVideoMetadataJob::dispatch($target, $currentVersion->changes_summary ?? []);
                    $jobsCreated++;
                    
                    Log::info('Dispatched metadata update job', [
                        'video_id' => $video->id,
                        'target_id' => $target->id,
                        'platform' => $target->platform,
                    ]);
                } catch (\Exception $e) {
                    $failedPlatforms[] = ucfirst($target->platform);
                    Log::error('Failed to dispatch update job', [
                        'video_id' => $video->id,
                        'target_id' => $target->id,
                        'platform' => $target->platform,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Clean up versions after successful publishing
            $video->versions()->delete();

            $message = 'Changes published successfully!';
            if (!empty($failedPlatforms)) {
                $message .= ' (Failed to update: ' . implode(', ', $failedPlatforms) . ')';
            }

            Log::info('Video changes published', [
                'video_id' => $video->id,
                'jobs_created' => $jobsCreated,
                'failed_platforms' => $failedPlatforms,
            ]);

            return response()->json([
                'success' => true,
                'message' => $message,
                'jobs_created' => $jobsCreated,
                'failed_platforms' => $failedPlatforms,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to publish changes', [
                'video_id' => $video->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to publish changes: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Discard all changes and restore backup.
     */
    public function discardChanges(Request $request, Video $video): JsonResponse
    {
        // Video ownership is already ensured by route model binding

        try {
            $backupVersion = $video->backupVersion();
            
            if (!$backupVersion) {
                return response()->json([
                    'success' => false,
                    'message' => 'No backup version found to restore',
                ], 400);
            }

            // Restore the backup version to the main video record
            $backupVersion->applyToVideo();

            $originalData = [
                'title' => $backupVersion->title,
                'description' => $backupVersion->description,
                'tags' => $backupVersion->tags,
                'thumbnail' => $backupVersion->thumbnail_path,
            ];

            // Delete all versions (both backup and current)
            $video->versions()->delete();

            Log::info('Video changes discarded and backup restored', [
                'video_id' => $video->id,
                'restored_title' => $backupVersion->title,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'All changes discarded and original version restored',
                'original_data' => $originalData,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to discard changes', [
                'video_id' => $video->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to discard changes: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get a user-friendly description of the change.
     */
    private function getChangeDescription(string $type, string $field): string
    {
        return match ($type) {
            'title' => 'Title updated',
            'description' => 'Description updated',
            'tags' => 'Tags updated',
            'thumbnail' => 'Custom thumbnail uploaded',
            'subtitles' => 'Subtitles generated',
            'watermark_removal' => 'Watermarks removed',
            default => ucfirst($field) . ' updated',
        };
    }
}
