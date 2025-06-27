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
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class UploadVideoToInstagram implements ShouldQueue
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
            Log::info('Starting Instagram upload for video target: ' . $this->videoTarget->id);

            // Mark as processing
            $this->videoTarget->markAsProcessing();

            // Get user's Instagram access token
            $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                ->where('platform', 'instagram')
                ->first();

            if (!$socialAccount) {
                throw new \Exception('Instagram account not connected');
            }

            // Check if we're in development mode with fake tokens
            if ($socialAccount->access_token === 'fake_token_for_development') {
                Log::info('Development mode detected - simulating Instagram upload success');
                sleep(4); // Simulate upload time
                
                Log::info('Instagram upload completed successfully (simulated)', [
                    'video_target_id' => $this->videoTarget->id,
                    'instagram_media_id' => 'SIMULATED_INSTAGRAM_' . uniqid()
                ]);

                // Mark as success
                $this->videoTarget->markAsSuccess();
                return;
            }

            // Check if token is expired
            if ($socialAccount->token_expires_at && $socialAccount->token_expires_at->isPast()) {
                throw new \Exception('Instagram access token has expired. Please reconnect your account.');
            }

            // Get video file - For Instagram, we need a publicly accessible URL
            $videoUrl = $this->getPublicVideoUrl();

            // Step 1: Create media container
            $mediaId = $this->createMediaContainer($socialAccount, $videoUrl);

            // Step 2: Poll for upload completion
            $this->waitForUploadCompletion($socialAccount, $mediaId);

            // Step 3: Publish the media
            $this->publishMedia($socialAccount, $mediaId);

            Log::info('Instagram upload completed successfully', [
                'video_target_id' => $this->videoTarget->id,
                'media_id' => $mediaId
            ]);

            // Mark as success
            $this->videoTarget->markAsSuccess();

        } catch (\Exception $e) {
            Log::error('Instagram upload failed', [
                'video_target_id' => $this->videoTarget->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Mark as failed
            $this->videoTarget->markAsFailed($e->getMessage());
        }
    }

    /**
     * Get publicly accessible video URL for Instagram API.
     * Instagram requires a publicly accessible URL.
     */
    protected function getPublicVideoUrl(): string
    {
        // In production, you should upload the video to a public cloud storage (S3, etc.)
        // For now, we'll use the app URL if available
        $videoPath = $this->videoTarget->video->original_file_path;
        $appUrl = config('app.url');
        
        // Create a temporary public URL - in production use cloud storage
        return $appUrl . '/storage/' . $videoPath;
    }

    /**
     * Create media container on Instagram.
     */
    protected function createMediaContainer(SocialAccount $socialAccount, string $videoUrl): string
    {
        // Get user's Instagram business account ID
        $userResponse = Http::get('https://graph.facebook.com/v18.0/me', [
            'fields' => 'id',
            'access_token' => $socialAccount->access_token
        ]);

        if (!$userResponse->successful()) {
            throw new \Exception('Failed to get Instagram user info: ' . $userResponse->body());
        }

        $userId = $userResponse->json()['id'];

        // Get advanced options for this platform
        $options = $this->videoTarget->advanced_options ?? [];

        // Prepare caption with advanced options
        $caption = $options['caption'] ?? ($this->videoTarget->video->title . "\n\n" . $this->videoTarget->video->description);
        
        // Add hashtags if provided
        if (!empty($options['hashtags'])) {
            $hashtags = is_array($options['hashtags']) 
                ? implode(' ', $options['hashtags']) 
                : $options['hashtags'];
            $caption .= "\n\n" . $hashtags;
        }

        // Validate and filter hashtags in caption
        $validationResult = $this->hashtagValidator->validateAndFilterHashtags('instagram', $caption);
        $filteredCaption = $validationResult['filtered_content'];
        
        if ($validationResult['has_changes']) {
            Log::info('Instagram hashtags filtered', [
                'video_target_id' => $this->videoTarget->id,
                'removed_hashtags' => $validationResult['removed_hashtags'],
                'warnings' => $validationResult['warnings'],
                'original_length' => strlen($caption),
                'filtered_length' => strlen($filteredCaption),
            ]);
        }

        // Prepare media data
        $mediaData = [
            'media_type' => $options['videoType'] ?? 'REELS',
            'video_url' => $videoUrl,
            'caption' => $filteredCaption,
            'access_token' => $socialAccount->access_token
        ];

        // Add location if provided
        if (!empty($options['location'])) {
            $mediaData['location_id'] = $options['location'];
        }

        // Add alt text if provided
        if (!empty($options['altText'])) {
            $mediaData['custom_accessibility_caption'] = $options['altText'];
        }

        // Create media container
        $response = Http::post("https://graph.facebook.com/v18.0/{$userId}/media", $mediaData);

        if (!$response->successful()) {
            throw new \Exception('Failed to create Instagram media container: ' . $response->body());
        }

        $data = $response->json();

        if (isset($data['error'])) {
            throw new \Exception('Instagram API error: ' . $data['error']['message']);
        }

        return $data['id'];
    }

    /**
     * Wait for video upload to complete.
     */
    protected function waitForUploadCompletion(SocialAccount $socialAccount, string $mediaId): void
    {
        $maxAttempts = 30; // Maximum 5 minutes (30 * 10 seconds)
        $attempts = 0;

        while ($attempts < $maxAttempts) {
            $response = Http::get("https://graph.facebook.com/v18.0/{$mediaId}", [
                'fields' => 'status_code',
                'access_token' => $socialAccount->access_token
            ]);

            if (!$response->successful()) {
                throw new \Exception('Failed to check Instagram upload status: ' . $response->body());
            }

            $data = $response->json();
            $statusCode = $data['status_code'] ?? null;

            if ($statusCode === 'FINISHED') {
                Log::info('Instagram video upload completed', ['media_id' => $mediaId]);
                return;
            } elseif ($statusCode === 'ERROR') {
                throw new \Exception('Instagram video processing failed');
            }

            // Wait 10 seconds before checking again
            sleep(10);
            $attempts++;
        }

        throw new \Exception('Instagram video upload timed out after 5 minutes');
    }

    /**
     * Publish the media to Instagram.
     */
    protected function publishMedia(SocialAccount $socialAccount, string $mediaId): void
    {
        // Get user ID again
        $userResponse = Http::get('https://graph.facebook.com/v18.0/me', [
            'fields' => 'id',
            'access_token' => $socialAccount->access_token
        ]);

        if (!$userResponse->successful()) {
            throw new \Exception('Failed to get Instagram user info for publishing: ' . $userResponse->body());
        }

        $userId = $userResponse->json()['id'];

        // Publish the media
        $response = Http::post("https://graph.facebook.com/v18.0/{$userId}/media_publish", [
            'creation_id' => $mediaId,
            'access_token' => $socialAccount->access_token
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to publish Instagram media: ' . $response->body());
        }

        $data = $response->json();

        if (isset($data['error'])) {
            throw new \Exception('Instagram publish error: ' . $data['error']['message']);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Instagram upload job failed permanently', [
            'video_target_id' => $this->videoTarget->id,
            'error' => $exception->getMessage()
        ]);

        $this->videoTarget->markAsFailed('Job failed permanently: ' . $exception->getMessage());
        
        // Send notification to user about the upload failure
        if ($this->videoTarget->video && $this->videoTarget->video->user) {
            $this->videoTarget->video->user->addJobFailureNotification(
                'UploadVideoToInstagram',
                'Instagram Upload Failed',
                'Your video upload to Instagram has failed permanently. Please check your Instagram account connection and try again.',
                [
                    'video_id' => $this->videoTarget->video_id,
                    'video_title' => $this->videoTarget->video->title,
                    'channel_name' => $this->videoTarget->video->channel->name ?? 'Unknown',
                    'platform' => 'instagram',
                    'error_message' => $exception->getMessage(),
                ]
            );
        }
    }
} 