<?php

namespace App\Http\Controllers;

use App\Models\Video;
use App\Models\VideoTarget;
use App\Models\Channel;
use App\Services\VideoProcessingService;
use App\Services\VideoUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;

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
        $videos = Video::where('user_id', $request->user()->id)
            ->with(['targets'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Videos/Index', [
            'videos' => $videos,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Channel $channel, Request $request): Response
    {
        // Ensure user owns this channel
        if ($channel->user_id !== $request->user()->id) {
            abort(403);
        }

        // Get connected platforms for this channel
        $connectedPlatforms = $channel->socialAccounts->pluck('platform')->toArray();
        $allowedPlatforms = $request->user()->getAllowedPlatforms();
        
        // Filter connected platforms by what user is allowed to access
        $availablePlatforms = array_intersect($connectedPlatforms, $allowedPlatforms);

        return Inertia::render('Videos/Create', [
            'channel' => $channel,
            'availablePlatforms' => $availablePlatforms,
            'defaultPlatforms' => $channel->default_platforms_list,
            'connectedPlatforms' => $connectedPlatforms,
            'allowedPlatforms' => $allowedPlatforms,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Channel $channel, Request $request): RedirectResponse
    {
        // Ensure user owns this channel
        if ($channel->user_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'video' => 'required|file|mimes:mp4,mov,avi,wmv,webm|max:102400', // 100MB max
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'platforms' => 'required|array|min:1',
            'platforms.*' => 'in:youtube,instagram,tiktok',
            'publish_type' => 'required|in:now,scheduled',
            'publish_at' => 'required_if:publish_type,scheduled|nullable|date|after:now',
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

        try {
            // Validate and process video
            $this->videoService->validateVideo($request->file('video'));
            $videoInfo = $this->videoService->processVideo($request->file('video'));

            $video = null;
            DB::transaction(function () use ($request, $videoInfo, $channel, &$video) {
                // Create video record
                $video = Video::create([
                    'user_id' => $request->user()->id,
                    'channel_id' => $channel->id,
                    'title' => $request->title,
                    'description' => $request->description,
                    'original_file_path' => $videoInfo['path'],
                    'duration' => $videoInfo['duration'],
                    'thumbnail_path' => $videoInfo['thumbnail_path'] ?? null,
                ]);

                // Create video targets for each platform
                foreach ($request->platforms as $platform) {
                    VideoTarget::create([
                        'video_id' => $video->id,
                        'platform' => $platform,
                        'publish_at' => $request->publish_type === 'scheduled' ? $request->publish_at : null,
                        'status' => 'pending',
                    ]);
                }
            });

            // Update channel default platforms based on user selection
            $channel->updateDefaultPlatforms($request->platforms);

            // Dispatch upload jobs for immediate publishing
            if ($request->publish_type === 'now') {
                foreach ($video->targets as $target) {
                    $this->uploadService->dispatchUploadJob($target);
                }
            }

            return redirect()->route('channels.show', $channel->slug)
                ->with('success', 'Video uploaded successfully and queued for publishing!');

        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['video' => $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Video $video): Response
    {
        $this->authorize('view', $video);

        $video->load(['targets']);

        return Inertia::render('Videos/Show', [
            'video' => $video,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Video $video): Response
    {
        $this->authorize('update', $video);

        return Inertia::render('Videos/Edit', [
            'video' => $video,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Video $video): RedirectResponse
    {
        $this->authorize('update', $video);

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
        ]);

        $video->update([
            'title' => $request->title,
            'description' => $request->description,
        ]);

        return redirect()->route('videos.show', $video)
            ->with('success', 'Video updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Video $video): RedirectResponse
    {
        $this->authorize('delete', $video);

        $video->delete();

        return redirect()->route('dashboard')
            ->with('success', 'Video deleted successfully!');
    }

    /**
     * Retry failed video target.
     */
    public function retryTarget(VideoTarget $target): RedirectResponse
    {
        $this->authorize('update', $target->video);

        try {
            $this->uploadService->retryFailedTarget($target);

            return redirect()->back()
                ->with('success', 'Video target queued for retry!');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', $e->getMessage());
        }
    }
}
