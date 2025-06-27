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

class UploadVideoToSnapchat implements ShouldQueue
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
            Log::info('Starting Snapchat upload for video target: ' . $this->videoTarget->id);

            // Mark as processing
            $this->videoTarget->markAsProcessing();

            // Get user's Snapchat access token
            $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                ->where('channel_id', $this->videoTarget->video->channel_id)
                ->where('platform', 'snapchat')
                ->first();

            if (!$socialAccount) {
                throw new \Exception('Snapchat account not connected');
            }

            // Check if we're in development mode with fake tokens
            if ($socialAccount->access_token === 'fake_token_for_development') {
                Log::info('Development mode detected - simulating Snapchat upload success');
                sleep(4); // Simulate upload time
                
                Log::info('Snapchat upload completed successfully (simulated)', [
                    'video_target_id' => $this->videoTarget->id,
                    'snapchat_media_id' => 'SIMULATED_SNAPCHAT_' . uniqid()
                ]);

                // Mark as success
                $this->videoTarget->markAsSuccess();
                return;
            }

            // Check if token is expired
            if ($socialAccount->token_expires_at && $socialAccount->token_expires_at->isPast()) {
                throw new \Exception('Snapchat access token has expired. Please reconnect your account.');
            }

            // Get video file - For Snapchat, we need a publicly accessible URL
            $videoUrl = $this->getPublicVideoUrl();

            // Step 1: Upload media to Snapchat
            $mediaId = $this->uploadMediaToSnapchat($socialAccount, $videoUrl);

            // Step 2: Create and publish the snap
            $this->publishSnapchatStory($socialAccount, $mediaId);

            Log::info('Snapchat upload completed successfully', [
                'video_target_id' => $this->videoTarget->id,
            ]);

            // Mark as success
            $this->videoTarget->markAsSuccess();

        } catch (\Exception $e) {
            Log::error('Snapchat upload failed', [
                'video_target_id' => $this->videoTarget->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Mark as failed
            $this->videoTarget->markAsFailed($e->getMessage());
        }
    }

    /**
     * Get public URL for video file.
     */
    protected function getPublicVideoUrl(): string
    {
        $filename = basename($this->videoTarget->video->original_file_path);
        return url('storage/videos/' . $filename);
    }

    /**
     * Upload media to Snapchat.
     */
    protected function uploadMediaToSnapchat(SocialAccount $socialAccount, string $videoUrl): string
    {
        // Get advanced options for this platform
        $options = $this->videoTarget->advanced_options ?? [];

        // Prepare media data with advanced options
        $mediaData = [
            'media' => [
                [
                    'name' => $this->videoTarget->video->title,
                    'type' => 'VIDEO',
                    'file_url' => $videoUrl
                ]
            ]
        ];

        // Add caption if provided
        if (!empty($options['caption'])) {
            $mediaData['media'][0]['caption'] = $options['caption'];
        }

        // Add hashtags if provided
        if (!empty($options['hashtags'])) {
            $hashtags = is_array($options['hashtags']) 
                ? implode(' ', $options['hashtags']) 
                : $options['hashtags'];
            $mediaData['media'][0]['caption'] = ($mediaData['media'][0]['caption'] ?? '') . "\n\n" . $hashtags;
        } elseif (!empty($this->videoTarget->video->tags)) {
            // Use tags from video database field if no advanced options hashtags
            $videoTags = $this->videoTarget->video->tags;
            if (is_array($videoTags) && !empty($videoTags)) {
                $hashtags = implode(' ', array_map(function($tag) {
                    return '#' . str_replace('#', '', $tag);
                }, $videoTags));
                $mediaData['media'][0]['caption'] = ($mediaData['media'][0]['caption'] ?? '') . "\n\n" . $hashtags;
            }
        }

        // Validate and filter hashtags in caption
        if (!empty($mediaData['media'][0]['caption'])) {
            $validationResult = $this->hashtagValidator->validateAndFilterHashtags('snapchat', $mediaData['media'][0]['caption']);
            $filteredCaption = $validationResult['filtered_content'];
            
            if ($validationResult['has_changes']) {
                Log::info('Snapchat hashtags filtered', [
                    'video_target_id' => $this->videoTarget->id,
                    'removed_hashtags' => $validationResult['removed_hashtags'],
                    'warnings' => $validationResult['warnings'],
                    'original_length' => strlen($mediaData['media'][0]['caption']),
                    'filtered_length' => strlen($filteredCaption),
                ]);
            }
            
            $mediaData['media'][0]['caption'] = $filteredCaption;
        }

        // Step 1: Create media upload session
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $socialAccount->access_token,
            'Content-Type' => 'application/json'
        ])->post('https://adsapi.snapchat.com/v1/media', $mediaData);

        if (!$response->successful()) {
            throw new \Exception('Failed to create Snapchat media upload session: ' . $response->body());
        }

        $data = $response->json();

        if (isset($data['errors'])) {
            throw new \Exception('Snapchat API error: ' . json_encode($data['errors']));
        }

        return $data['media'][0]['id'];
    }

    /**
     * Publish Snapchat story.
     */
    protected function publishSnapchatStory(SocialAccount $socialAccount, string $mediaId): void
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $socialAccount->access_token,
            'Content-Type' => 'application/json'
        ])->post('https://adsapi.snapchat.com/v1/creatives', [
            'creatives' => [
                [
                    'name' => $this->videoTarget->video->title,
                    'type' => 'SNAP_AD',
                    'top_snap_media_id' => $mediaId,
                    'headline' => $this->videoTarget->video->title,
                    'brand_name' => 'Tikomat'
                ]
            ]
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to publish Snapchat story: ' . $response->body());
        }

        $data = $response->json();

        if (isset($data['errors'])) {
            throw new \Exception('Snapchat API error: ' . json_encode($data['errors']));
        }

        Log::info('Snapchat story published successfully', [
            'creative_id' => $data['creatives'][0]['id'] ?? 'unknown',
            'video_target_id' => $this->videoTarget->id,
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Snapchat upload job failed permanently', [
            'video_target_id' => $this->videoTarget->id,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);

        $this->videoTarget->markAsFailed('Job failed permanently: ' . $exception->getMessage());
    }
}
