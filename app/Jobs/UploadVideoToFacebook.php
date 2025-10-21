<?php

namespace App\Jobs;

use App\Models\VideoTarget;
use App\Models\SocialAccount;
use App\Services\HashtagValidationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;

class UploadVideoToFacebook implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected VideoTarget $videoTarget;
    protected HashtagValidationService $hashtagValidator;

    /**
     * Create a new job instance.
     */
    public function __construct(VideoTarget $videoTarget)
    {
        $this->videoTarget = $videoTarget;
        $this->hashtagValidator = app(HashtagValidationService::class);
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Starting Facebook upload for video target', [
                'video_target_id' => $this->videoTarget->id,
                'video_id' => $this->videoTarget->video->id,
                'video_title' => $this->videoTarget->video->title,
                'user_id' => $this->videoTarget->video->user_id,
                'channel_id' => $this->videoTarget->video->channel_id,
                'channel_name' => $this->videoTarget->video->channel->name ?? 'Unknown',
                'platform' => 'facebook',
                'current_status' => $this->videoTarget->status,
            ]);

            // Mark as processing
            $this->videoTarget->markAsProcessing();
            Log::info('Facebook upload target marked as processing', [
                'video_target_id' => $this->videoTarget->id,
            ]);

            // Get user's Facebook access token
            Log::info('Looking for Facebook social account', [
                'user_id' => $this->videoTarget->video->user_id,
                'channel_id' => $this->videoTarget->video->channel_id,
                'platform' => 'facebook',
                'target_facebook_page_id' => $this->videoTarget->facebook_page_id ?? 'Not specified',
            ]);

            // If video target has a specific Facebook page ID, use that to find the right account
            if ($this->videoTarget->facebook_page_id) {
                Log::info('Using specific Facebook page ID from video target', [
                    'video_target_id' => $this->videoTarget->id,
                    'facebook_page_id' => $this->videoTarget->facebook_page_id,
                ]);
                
                $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                    ->where('platform', 'facebook')
                    ->where('facebook_page_id', $this->videoTarget->facebook_page_id)
                    ->first();
            } else {
                Log::info('Using channel-based Facebook account lookup (legacy)', [
                    'video_target_id' => $this->videoTarget->id,
                    'channel_id' => $this->videoTarget->video->channel_id,
                ]);
                
                // Fallback to the old method for backwards compatibility
                $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                    ->where('channel_id', $this->videoTarget->video->channel_id)
                    ->where('platform', 'facebook')
                    ->first();
            }

            if (!$socialAccount) {
                Log::error('Facebook social account not found', [
                    'video_target_id' => $this->videoTarget->id,
                    'user_id' => $this->videoTarget->video->user_id,
                    'channel_id' => $this->videoTarget->video->channel_id,
                    'available_accounts' => SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                        ->select('id', 'platform', 'channel_id', 'profile_name')
                        ->get()
                        ->toArray(),
                ]);
                throw new \Exception('Facebook account not connected to this channel');
            }

            Log::info('Facebook social account found', [
                'social_account_id' => $socialAccount->id,
                'profile_name' => $socialAccount->profile_name ?? 'Unknown',
                'facebook_page_name' => $socialAccount->facebook_page_name ?? 'Not set',
                'facebook_page_id' => $socialAccount->facebook_page_id ?? 'Not set',
                'token_expires_at' => $socialAccount->token_expires_at?->toISOString() ?? 'Never',
                'has_access_token' => !empty($socialAccount->access_token),
                'has_refresh_token' => !empty($socialAccount->refresh_token),
                'has_page_access_token' => !empty($socialAccount->facebook_page_access_token),
            ]);

            // Check if we're in development mode with fake tokens
            if ($socialAccount->access_token === 'fake_token_for_development') {
                Log::info('Development mode detected - simulating Facebook upload success');
                sleep(3); // Simulate upload time
                
                Log::info('Facebook upload completed successfully (simulated)', [
                    'video_target_id' => $this->videoTarget->id,
                    'facebook_video_id' => 'SIMULATED_FACEBOOK_' . uniqid()
                ]);

                // Mark as success
                $this->videoTarget->markAsSuccess();
                return;
            }

            // Check if token is expired
            if ($socialAccount->token_expires_at && $socialAccount->token_expires_at->isPast()) {
                Log::error('Facebook access token has expired', [
                    'video_target_id' => $this->videoTarget->id,
                    'social_account_id' => $socialAccount->id,
                    'token_expired_at' => $socialAccount->token_expires_at->toISOString(),
                    'expired_since' => $socialAccount->token_expires_at->diffForHumans(),
                ]);
                throw new \Exception('Facebook access token has expired. Please reconnect your account.');
            }

            // Get video file - For Facebook, we need a publicly accessible URL
            Log::info('Preparing video URL for Facebook upload', [
                'video_target_id' => $this->videoTarget->id,
                'original_file_path' => $this->videoTarget->video->original_file_path,
            ]);
            
            $videoUrl = $this->getPublicVideoUrl();
            
            Log::info('Video URL generated for Facebook upload', [
                'video_target_id' => $this->videoTarget->id,
                'video_url' => $videoUrl,
                'video_url_accessible' => $this->testVideoUrlAccessibility($videoUrl),
            ]);

            // Step 1: Get Facebook Page ID and access token
            Log::info('Getting Facebook Page ID and access token for posting', [
                'video_target_id' => $this->videoTarget->id,
                'social_account_id' => $socialAccount->id,
                'has_stored_page_id' => !empty($socialAccount->facebook_page_id),
                'has_page_access_token' => !empty($socialAccount->facebook_page_access_token),
            ]);
            
            $pageInfo = $this->getFacebookPageInfo($socialAccount);
            $pageId = $pageInfo['page_id'];
            $pageAccessToken = $pageInfo['page_access_token'];
            
            // Validate that video target's Facebook page ID matches social account's page ID if both are set
            if (!empty($this->videoTarget->facebook_page_id) && !empty($socialAccount->facebook_page_id)) {
                if ($this->videoTarget->facebook_page_id !== $socialAccount->facebook_page_id) {
                    Log::error('Facebook page ID mismatch between video target and social account', [
                        'video_target_id' => $this->videoTarget->id,
                        'video_target_facebook_page_id' => $this->videoTarget->facebook_page_id,
                        'social_account_facebook_page_id' => $socialAccount->facebook_page_id,
                        'social_account_id' => $socialAccount->id,
                    ]);
                    throw new \Exception('Facebook page ID mismatch. Please reconnect your Facebook account.');
                }
            }

            // Validate that page ID doesn't contain invalid characters
            if (str_contains(strtolower($pageId), 'instagram')) {
                Log::error('Facebook page ID contains invalid characters', [
                    'video_target_id' => $this->videoTarget->id,
                    'invalid_page_id' => $pageId,
                    'social_account_id' => $socialAccount->id,
                ]);
                throw new \Exception('Invalid Facebook page ID detected. Please reconnect your Facebook account.');
            }

            // Additional validation: ensure page ID is numeric and doesn't contain any non-numeric characters
            if (!is_numeric($pageId) || !ctype_digit($pageId)) {
                Log::error('Facebook page ID is not numeric', [
                    'video_target_id' => $this->videoTarget->id,
                    'invalid_page_id' => $pageId,
                    'page_id_type' => gettype($pageId),
                    'page_id_length' => strlen($pageId),
                    'social_account_id' => $socialAccount->id,
                ]);
                throw new \Exception('Invalid Facebook page ID format. Facebook page IDs must be numeric. Please reconnect your Facebook account.');
            }

            // Additional validation: check for common invalid patterns
            $invalidPatterns = ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'snapchat', 'pinterest'];
            foreach ($invalidPatterns as $pattern) {
                if (stripos($pageId, $pattern) !== false) {
                    Log::error('Facebook page ID contains invalid platform name', [
                        'video_target_id' => $this->videoTarget->id,
                        'invalid_page_id' => $pageId,
                        'detected_pattern' => $pattern,
                        'social_account_id' => $socialAccount->id,
                    ]);
                    throw new \Exception("Invalid Facebook page ID detected (contains '{$pattern}'). Please reconnect your Facebook account.");
                }
            }

            Log::info('Facebook page info retrieved for upload', [
                'video_target_id' => $this->videoTarget->id,
                'page_id' => $pageId,
                'page_id_type' => gettype($pageId),
                'page_id_length' => strlen($pageId),
                'page_id_is_numeric' => is_numeric($pageId),
                'has_page_access_token' => !empty($pageAccessToken),
                'page_access_token_length' => strlen($pageAccessToken),
                'social_account_id' => $socialAccount->id,
                'social_account_facebook_page_id' => $socialAccount->facebook_page_id,
                'video_target_facebook_page_id' => $this->videoTarget->facebook_page_id,
            ]);

            // Step 2: Upload video to Facebook
            Log::info('Starting video upload to Facebook', [
                'video_target_id' => $this->videoTarget->id,
                'page_id' => $pageId,
                'video_url' => $videoUrl,
                'video_title' => $this->videoTarget->video->title,
                'advanced_options' => $this->videoTarget->advanced_options ?? [],
            ]);
            
            $this->uploadVideoToFacebook($socialAccount, $pageId, $pageAccessToken, $videoUrl);

            Log::info('Facebook upload completed successfully', [
                'video_target_id' => $this->videoTarget->id,
                'page_id' => $pageId,
                'processing_time' => microtime(true) - LARAVEL_START,
            ]);

            // Clean up temporary public file
            $this->cleanupTemporaryFile($videoUrl);

            // Mark as success
            $this->videoTarget->markAsSuccess();
            
            Log::info('Facebook upload target marked as successful', [
                'video_target_id' => $this->videoTarget->id,
                'final_status' => $this->videoTarget->fresh()->status,
            ]);

        } catch (\Exception $e) {
            Log::error('Facebook upload failed with exception', [
                'video_target_id' => $this->videoTarget->id,
                'video_id' => $this->videoTarget->video_id,
                'video_title' => $this->videoTarget->video->title ?? 'Unknown',
                'channel_id' => $this->videoTarget->video->channel_id ?? 'Unknown',
                'channel_name' => $this->videoTarget->video->channel->name ?? 'Unknown',
                'user_id' => $this->videoTarget->video->user_id ?? 'Unknown',
                'error_message' => $e->getMessage(),
                'error_code' => $e->getCode(),
                'error_file' => $e->getFile(),
                'error_line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'job_attempts' => $this->attempts(),
                'job_max_tries' => $this->tries ?? 3,
            ]);

            // Clean up temporary public file if it was created
            if (isset($videoUrl)) {
                $this->cleanupTemporaryFile($videoUrl);
            }

            // Mark as failed
            $this->videoTarget->markAsFailed($e->getMessage());
            
            Log::info('Facebook upload target marked as failed', [
                'video_target_id' => $this->videoTarget->id,
                'final_status' => $this->videoTarget->fresh()->status,
                'error_message_stored' => $this->videoTarget->fresh()->error_message,
            ]);
        }
    }

    /**
     * Get public URL for video file.
     */
    protected function getPublicVideoUrl(): string
    {
        // For Facebook uploads, we need to temporarily copy the video to public storage
        // so Facebook can access it without authentication
        $originalPath = $this->videoTarget->video->original_file_path;
        $filename = basename($originalPath);
        
        // Create a temporary public path
        $publicPath = 'temp/facebook/' . uniqid() . '_' . $filename;
        
        try {
            // Copy from private storage to public storage temporarily
            if (Storage::disk('local')->exists($originalPath)) {
                $fileContents = Storage::disk('local')->get($originalPath);
                Storage::disk('public')->put($publicPath, $fileContents);
                
                Log::info('Video copied to public storage for Facebook upload', [
                    'video_target_id' => $this->videoTarget->id,
                    'original_path' => $originalPath,
                    'public_path' => $publicPath,
                    'file_size' => strlen($fileContents),
                ]);
                
                // Return the public URL
                return Storage::disk('public')->url($publicPath);
            } else {
                Log::error('Original video file not found in private storage', [
                    'video_target_id' => $this->videoTarget->id,
                    'original_path' => $originalPath,
                ]);
                throw new \Exception('Original video file not found');
            }
        } catch (\Exception $e) {
            Log::error('Failed to create public video URL for Facebook', [
                'video_target_id' => $this->videoTarget->id,
                'error' => $e->getMessage(),
                'original_path' => $originalPath,
            ]);
            throw $e;
        }
    }

    /**
     * Test if video URL is accessible.
     */
    protected function testVideoUrlAccessibility(string $url): bool
    {
        try {
            $response = Http::timeout(10)->head($url);
            return $response->successful();
        } catch (\Exception $e) {
            Log::warning('Video URL accessibility test failed', [
                'video_target_id' => $this->videoTarget->id,
                'url' => $url,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Clean up temporary public file after upload.
     */
    protected function cleanupTemporaryFile(string $videoUrl): void
    {
        try {
            // Extract the path from the URL
            $parsedUrl = parse_url($videoUrl);
            if (isset($parsedUrl['path'])) {
                // Remove the /storage prefix to get the actual file path
                $path = ltrim(str_replace('/storage', '', $parsedUrl['path']), '/');
                
                // Only delete if it's in the temp/facebook directory
                if (str_starts_with($path, 'temp/facebook/')) {
                    if (Storage::disk('public')->exists($path)) {
                        Storage::disk('public')->delete($path);
                        Log::info('Temporary Facebook video file cleaned up', [
                            'video_target_id' => $this->videoTarget->id,
                            'cleaned_path' => $path,
                        ]);
                    }
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to clean up temporary Facebook video file', [
                'video_target_id' => $this->videoTarget->id,
                'video_url' => $videoUrl,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get Facebook Page ID and access token for posting.
     */
    protected function getFacebookPageInfo(SocialAccount $socialAccount): array
    {
        // Use the stored Facebook page ID if available
        if (!empty($socialAccount->facebook_page_id)) {
            // Validate that the page ID is numeric (Facebook page IDs are numeric)
            if (!is_numeric($socialAccount->facebook_page_id) || !ctype_digit($socialAccount->facebook_page_id)) {
                Log::error('Invalid Facebook page ID stored in database', [
                    'video_target_id' => $this->videoTarget->id,
                    'social_account_id' => $socialAccount->id,
                    'invalid_page_id' => $socialAccount->facebook_page_id,
                    'page_id_type' => gettype($socialAccount->facebook_page_id),
                    'page_id_length' => strlen($socialAccount->facebook_page_id),
                ]);
                throw new \Exception('Invalid Facebook page ID stored in database. Please reconnect your Facebook account.');
            }

            // Check for invalid patterns in stored page ID
            $invalidPatterns = ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'snapchat', 'pinterest'];
            foreach ($invalidPatterns as $pattern) {
                if (stripos($socialAccount->facebook_page_id, $pattern) !== false) {
                    Log::error('Stored Facebook page ID contains invalid platform name', [
                        'video_target_id' => $this->videoTarget->id,
                        'social_account_id' => $socialAccount->id,
                        'invalid_page_id' => $socialAccount->facebook_page_id,
                        'detected_pattern' => $pattern,
                    ]);
                    throw new \Exception("Invalid Facebook page ID stored in database (contains '{$pattern}'). Please reconnect your Facebook account.");
                }
            }
            
            Log::info('Using stored Facebook page info', [
                'video_target_id' => $this->videoTarget->id,
                'social_account_id' => $socialAccount->id,
                'page_id' => $socialAccount->facebook_page_id,
                'page_name' => $socialAccount->facebook_page_name ?? 'Unknown',
                'has_page_access_token' => !empty($socialAccount->facebook_page_access_token),
            ]);
            
            return [
                'page_id' => $socialAccount->facebook_page_id,
                'page_access_token' => $socialAccount->facebook_page_access_token ?? $socialAccount->access_token,
            ];
        }

        Log::info('No stored Facebook page ID, fetching from API', [
            'video_target_id' => $this->videoTarget->id,
            'social_account_id' => $socialAccount->id,
        ]);

        // Fallback to the old method for backwards compatibility
        $response = Http::timeout(30)->get('https://graph.facebook.com/v18.0/me/accounts', [
            'access_token' => $socialAccount->access_token
        ]);

        Log::info('Facebook pages API response', [
            'video_target_id' => $this->videoTarget->id,
            'response_status' => $response->status(),
            'response_successful' => $response->successful(),
            'response_size' => strlen($response->body()),
        ]);

        if (!$response->successful()) {
            Log::error('Failed to get Facebook pages from API', [
                'video_target_id' => $this->videoTarget->id,
                'response_status' => $response->status(),
                'response_body' => $response->body(),
                'response_headers' => $response->headers(),
            ]);
            throw new \Exception('Failed to get Facebook pages: ' . $response->body());
        }

        $data = $response->json();

        Log::info('Facebook pages API data received', [
            'video_target_id' => $this->videoTarget->id,
            'pages_count' => count($data['data'] ?? []),
            'pages_data' => array_map(function($page) {
                return [
                    'id' => $page['id'] ?? 'unknown',
                    'name' => $page['name'] ?? 'unknown',
                    'category' => $page['category'] ?? 'unknown',
                ];
            }, $data['data'] ?? []),
        ]);

        if (empty($data['data'])) {
            Log::error('No Facebook pages found in API response', [
                'video_target_id' => $this->videoTarget->id,
                'full_response' => $data,
            ]);
            throw new \Exception('No Facebook pages found. Please ensure you have a Facebook page to post to.');
        }

        // Use the first page as fallback
        $firstPage = $data['data'][0];
        
        // Additional validation for the page ID from API
        if (!is_numeric($firstPage['id']) || !ctype_digit($firstPage['id'])) {
            Log::error('Invalid Facebook page ID received from API', [
                'video_target_id' => $this->videoTarget->id,
                'invalid_page_id' => $firstPage['id'],
                'page_id_type' => gettype($firstPage['id']),
                'page_id_length' => strlen($firstPage['id']),
            ]);
            throw new \Exception('Invalid Facebook page ID received from API. Please reconnect your Facebook account.');
        }

        // Check for invalid patterns in API response
        $invalidPatterns = ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'snapchat', 'pinterest'];
        foreach ($invalidPatterns as $pattern) {
            if (stripos($firstPage['id'], $pattern) !== false) {
                Log::error('Facebook page ID from API contains invalid platform name', [
                    'video_target_id' => $this->videoTarget->id,
                    'invalid_page_id' => $firstPage['id'],
                    'detected_pattern' => $pattern,
                ]);
                throw new \Exception("Invalid Facebook page ID received from API (contains '{$pattern}'). Please reconnect your Facebook account.");
            }
        }
        
        Log::info('Using first Facebook page as fallback', [
            'video_target_id' => $this->videoTarget->id,
            'page_id' => $firstPage['id'],
            'page_name' => $firstPage['name'] ?? 'Unknown',
            'has_page_access_token' => isset($firstPage['access_token']),
        ]);
        
        return [
            'page_id' => $firstPage['id'],
            'page_access_token' => $firstPage['access_token'] ?? $socialAccount->access_token,
        ];
    }

    /**
     * Upload video to Facebook.
     */
    protected function uploadVideoToFacebook(SocialAccount $socialAccount, string $pageId, string $pageAccessToken, string $videoUrl): void
    {
        // Validate page ID before making API call
        if (!is_numeric($pageId) || !ctype_digit($pageId)) {
            Log::error('Invalid Facebook page ID provided for upload', [
                'video_target_id' => $this->videoTarget->id,
                'invalid_page_id' => $pageId,
                'page_id_type' => gettype($pageId),
                'page_id_length' => strlen($pageId),
                'social_account_id' => $socialAccount->id,
            ]);
            throw new \Exception('Invalid Facebook page ID provided for upload. Please reconnect your Facebook account.');
        }

        // Check for invalid patterns in page ID
        $invalidPatterns = ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'snapchat', 'pinterest'];
        foreach ($invalidPatterns as $pattern) {
            if (stripos($pageId, $pattern) !== false) {
                Log::error('Facebook page ID contains invalid platform name for upload', [
                    'video_target_id' => $this->videoTarget->id,
                    'invalid_page_id' => $pageId,
                    'detected_pattern' => $pattern,
                    'social_account_id' => $socialAccount->id,
                ]);
                throw new \Exception("Invalid Facebook page ID for upload (contains '{$pattern}'). Please reconnect your Facebook account.");
            }
        }

        // Additional validation: ensure page ID is a reasonable length (Facebook page IDs are typically 10-20 digits)
        if (strlen($pageId) < 5 || strlen($pageId) > 25) {
            Log::error('Facebook page ID has unreasonable length', [
                'video_target_id' => $this->videoTarget->id,
                'page_id' => $pageId,
                'page_id_length' => strlen($pageId),
                'social_account_id' => $socialAccount->id,
            ]);
            throw new \Exception('Invalid Facebook page ID length. Please reconnect your Facebook account.');
        }

        // Get advanced options for this platform
        $options = $this->videoTarget->advanced_options ?? [];

        Log::info('Preparing Facebook video upload data', [
            'video_target_id' => $this->videoTarget->id,
            'page_id' => $pageId,
            'video_url' => $videoUrl,
            'advanced_options' => $options,
        ]);

        Log::info('Using provided Facebook page access token', [
            'video_target_id' => $this->videoTarget->id,
            'page_id' => $pageId,
            'has_page_access_token' => !empty($pageAccessToken),
            'page_access_token_length' => strlen($pageAccessToken),
        ]);

        // Prepare description (no hashtag validation for Facebook)
        $description = $options['message'] ?? $this->videoTarget->video->description;

        // Prepare video data with only title and description
        $videoData = [
            'file_url' => $videoUrl,
            'title' => $this->videoTarget->video->title,
            'description' => $description,
            'access_token' => $pageAccessToken
        ];

        // Add privacy settings if provided
        if (!empty($options['privacy'])) {
            $videoData['privacy'] = ['value' => $options['privacy']];
            Log::info('Facebook privacy setting applied', [
                'video_target_id' => $this->videoTarget->id,
                'privacy' => $options['privacy'],
            ]);
        }

        // Add location if provided
        if (!empty($options['place'])) {
            $videoData['place'] = $options['place'];
            Log::info('Facebook location setting applied', [
                'video_target_id' => $this->videoTarget->id,
                'place' => $options['place'],
            ]);
        }

        // Add branded content settings
        if ($options['brandedContent'] ?? false) {
            $videoData['is_branded_content'] = true;
            Log::info('Facebook branded content setting applied', [
                'video_target_id' => $this->videoTarget->id,
                'branded_content' => true,
            ]);
        }

        Log::info('Final Facebook video upload data prepared', [
            'video_target_id' => $this->videoTarget->id,
            'endpoint' => "https://graph.facebook.com/v18.0/{$pageId}/videos",
            'data_keys' => array_keys($videoData),
            'title' => $videoData['title'],
            'description_length' => strlen($videoData['description'] ?? ''),
            'has_privacy' => isset($videoData['privacy']),
            'has_place' => isset($videoData['place']),
            'is_branded_content' => isset($videoData['is_branded_content']),
        ]);

        // Make the API request with timeout and retry logic
        $startTime = microtime(true);
        $response = Http::timeout(300) // 5 minutes timeout for video uploads
            ->retry(2, 1000) // Retry twice with 1 second delay
            ->post("https://graph.facebook.com/v18.0/{$pageId}/videos", $videoData);
        $uploadTime = microtime(true) - $startTime;

        Log::info('Facebook API upload request completed', [
            'video_target_id' => $this->videoTarget->id,
            'upload_time_seconds' => round($uploadTime, 2),
            'response_status' => $response->status(),
            'response_successful' => $response->successful(),
            'response_size' => strlen($response->body()),
        ]);

        if (!$response->successful()) {
            $responseBody = $response->body();
            Log::error('Facebook API upload request failed', [
                'video_target_id' => $this->videoTarget->id,
                'response_status' => $response->status(),
                'response_body' => $responseBody,
                'response_headers' => $response->headers(),
                'upload_time_seconds' => round($uploadTime, 2),
            ]);
            throw new \Exception('Failed to upload video to Facebook: ' . $responseBody);
        }

        $data = $response->json();

        Log::info('Facebook API upload response data', [
            'video_target_id' => $this->videoTarget->id,
            'response_data' => $data,
            'has_video_id' => isset($data['id']),
            'has_error' => isset($data['error']),
        ]);

        if (isset($data['error'])) {
            Log::error('Facebook API returned error in response', [
                'video_target_id' => $this->videoTarget->id,
                'error_data' => $data['error'],
                'error_message' => $data['error']['message'] ?? 'Unknown error',
                'error_code' => $data['error']['code'] ?? 'Unknown code',
                'error_type' => $data['error']['type'] ?? 'Unknown type',
                'error_fbtrace_id' => $data['error']['fbtrace_id'] ?? 'No trace ID',
            ]);
            throw new \Exception('Facebook API error: ' . $data['error']['message']);
        }

        $videoId = $data['id'] ?? 'unknown';
        
        Log::info('Facebook video uploaded successfully', [
            'video_target_id' => $this->videoTarget->id,
            'facebook_video_id' => $videoId,
            'upload_time_seconds' => round($uploadTime, 2),
            'page_id' => $pageId,
        ]);

        // Store the platform video ID for future reference
        if ($videoId !== 'unknown') {
            $this->videoTarget->update(['platform_video_id' => $videoId]);
            Log::info('Facebook video ID stored in video target', [
                'video_target_id' => $this->videoTarget->id,
                'platform_video_id' => $videoId,
            ]);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Facebook upload job failed permanently', [
            'video_target_id' => $this->videoTarget->id,
            'video_id' => $this->videoTarget->video_id,
            'video_title' => $this->videoTarget->video->title ?? 'Unknown',
            'channel_id' => $this->videoTarget->video->channel_id ?? 'Unknown',
            'channel_name' => $this->videoTarget->video->channel->name ?? 'Unknown',
            'user_id' => $this->videoTarget->video->user_id ?? 'Unknown',
            'error_message' => $exception->getMessage(),
            'error_code' => $exception->getCode(),
            'error_file' => $exception->getFile(),
            'error_line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString(),
            'job_attempts' => $this->attempts(),
            'job_max_tries' => $this->tries ?? 3,
            'job_timeout' => $this->timeout ?? 'default',
            'job_queue' => $this->queue ?? 'default',
            'platform' => 'facebook',
            'final_status' => 'failed',
            'failure_timestamp' => now()->toISOString(),
        ]);

        // Attempt to get social account info for debugging
        try {
            $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                ->where('channel_id', $this->videoTarget->video->channel_id)
                ->where('platform', 'facebook')
                ->first();
                
            if ($socialAccount) {
                Log::info('Facebook social account info at job failure', [
                    'video_target_id' => $this->videoTarget->id,
                    'social_account_id' => $socialAccount->id,
                    'profile_name' => $socialAccount->profile_name ?? 'Unknown',
                    'facebook_page_name' => $socialAccount->facebook_page_name ?? 'Not set',
                    'facebook_page_id' => $socialAccount->facebook_page_id ?? 'Not set',
                    'token_expires_at' => $socialAccount->token_expires_at?->toISOString() ?? 'Never',
                    'token_expired' => $socialAccount->token_expires_at && $socialAccount->token_expires_at->isPast(),
                    'has_access_token' => !empty($socialAccount->access_token),
                    'has_refresh_token' => !empty($socialAccount->refresh_token),
                    'has_page_access_token' => !empty($socialAccount->facebook_page_access_token),
                ]);
            } else {
                Log::warning('No Facebook social account found at job failure', [
                    'video_target_id' => $this->videoTarget->id,
                    'user_id' => $this->videoTarget->video->user_id,
                    'channel_id' => $this->videoTarget->video->channel_id,
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to get social account info at job failure', [
                'video_target_id' => $this->videoTarget->id,
                'error' => $e->getMessage(),
            ]);
        }

        // Try to clean up any temporary files that might have been created
        try {
            $originalPath = $this->videoTarget->video->original_file_path ?? '';
            if ($originalPath) {
                $filename = basename($originalPath);
                // Look for temporary files that might match this video
                $tempFiles = Storage::disk('public')->files('temp/facebook');
                foreach ($tempFiles as $tempFile) {
                    if (str_contains($tempFile, $filename)) {
                        Storage::disk('public')->delete($tempFile);
                        Log::info('Cleaned up temporary file during job failure', [
                            'video_target_id' => $this->videoTarget->id,
                            'temp_file' => $tempFile,
                        ]);
                    }
                }
            }
        } catch (\Exception $cleanupException) {
            Log::warning('Failed to clean up temporary files during job failure', [
                'video_target_id' => $this->videoTarget->id,
                'cleanup_error' => $cleanupException->getMessage(),
            ]);
        }

        $this->videoTarget->markAsFailed('Job failed permanently: ' . $exception->getMessage());
        
        Log::info('Facebook upload video target marked as permanently failed', [
            'video_target_id' => $this->videoTarget->id,
            'final_status' => $this->videoTarget->fresh()->status,
            'error_message_stored' => $this->videoTarget->fresh()->error_message,
        ]);
    }
}
