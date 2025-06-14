<?php

namespace App\Jobs;

use App\Models\VideoTarget;
use App\Models\SocialAccount;
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

    /**
     * Create a new job instance.
     */
    public function __construct(VideoTarget $videoTarget)
    {
        $this->videoTarget = $videoTarget;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Starting Facebook upload for video target: ' . $this->videoTarget->id);

            // Mark as processing
            $this->videoTarget->markAsProcessing();

            // Get user's Facebook access token
            $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                ->where('channel_id', $this->videoTarget->video->channel_id)
                ->where('platform', 'facebook')
                ->first();

            if (!$socialAccount) {
                throw new \Exception('Facebook account not connected');
            }

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
                throw new \Exception('Facebook access token has expired. Please reconnect your account.');
            }

            // Get video file - For Facebook, we need a publicly accessible URL
            $videoUrl = $this->getPublicVideoUrl();

            // Step 1: Get Facebook Page ID (required for posting)
            $pageId = $this->getFacebookPageId($socialAccount);

            // Step 2: Upload video to Facebook
            $this->uploadVideoToFacebook($socialAccount, $pageId, $videoUrl);

            Log::info('Facebook upload completed successfully', [
                'video_target_id' => $this->videoTarget->id,
            ]);

            // Mark as success
            $this->videoTarget->markAsSuccess();

        } catch (\Exception $e) {
            Log::error('Facebook upload failed', [
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
     * Get Facebook Page ID for posting.
     */
    protected function getFacebookPageId(SocialAccount $socialAccount): string
    {
        $response = Http::get('https://graph.facebook.com/v18.0/me/accounts', [
            'access_token' => $socialAccount->access_token
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to get Facebook pages: ' . $response->body());
        }

        $data = $response->json();

        if (empty($data['data'])) {
            throw new \Exception('No Facebook pages found. Please ensure you have a Facebook page to post to.');
        }

        // Use the first page
        return $data['data'][0]['id'];
    }

    /**
     * Upload video to Facebook.
     */
    protected function uploadVideoToFacebook(SocialAccount $socialAccount, string $pageId, string $videoUrl): void
    {
        $response = Http::post("https://graph.facebook.com/v18.0/{$pageId}/videos", [
            'file_url' => $videoUrl,
            'title' => $this->videoTarget->video->title,
            'description' => $this->videoTarget->video->description,
            'access_token' => $socialAccount->access_token
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to upload video to Facebook: ' . $response->body());
        }

        $data = $response->json();

        if (isset($data['error'])) {
            throw new \Exception('Facebook API error: ' . $data['error']['message']);
        }

        Log::info('Facebook video uploaded successfully', [
            'video_id' => $data['id'] ?? 'unknown',
            'video_target_id' => $this->videoTarget->id,
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Facebook upload job failed permanently', [
            'video_target_id' => $this->videoTarget->id,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);

        $this->videoTarget->markAsFailed('Job failed permanently: ' . $exception->getMessage());
    }
}
