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

class RemoveVideoFromInstagram implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected VideoTarget $videoTarget;

    /**
     * The number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * The maximum number of seconds the job can run.
     */
    public int $timeout = 120;

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
            Log::info('Starting Instagram video removal for video target: ' . $this->videoTarget->id, [
                'platform_video_id' => $this->videoTarget->platform_video_id,
                'video_title' => $this->videoTarget->video->title,
            ]);

            // Verify we have a platform video ID
            if (!$this->videoTarget->platform_video_id) {
                throw new \Exception('No Instagram media ID found for this target');
            }

            // Get user's Instagram access token
            $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                ->where('platform', 'instagram')
                ->first();

            if (!$socialAccount) {
                throw new \Exception('Instagram account not connected');
            }

            // Check if we're in development mode with fake tokens
            if ($socialAccount->access_token === 'fake_token_for_development') {
                Log::info('Development mode detected - simulating Instagram video removal');
                sleep(2); // Simulate removal time
                
                Log::info('Instagram video removal completed successfully (simulated)', [
                    'video_target_id' => $this->videoTarget->id,
                    'instagram_media_id' => $this->videoTarget->platform_video_id,
                ]);
                return;
            }

            // Check if token is expired
            if ($socialAccount->token_expires_at && $socialAccount->token_expires_at->isPast()) {
                throw new \Exception('Instagram access token has expired. Cannot remove video from Instagram.');
            }

            // Delete the media from Instagram using Graph API
            $response = Http::delete("https://graph.facebook.com/v18.0/{$this->videoTarget->platform_video_id}", [
                'access_token' => $socialAccount->access_token
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['success']) && $data['success'] === true) {
                    Log::info('Instagram video removal completed successfully', [
                        'video_target_id' => $this->videoTarget->id,
                        'instagram_media_id' => $this->videoTarget->platform_video_id,
                        'video_title' => $this->videoTarget->video->title,
                    ]);
                    return;
                }
            }

            // Handle API errors
            $errorData = $response->json();
            $errorCode = $response->status();

            Log::error('Instagram API error during video removal', [
                'video_target_id' => $this->videoTarget->id,
                'instagram_media_id' => $this->videoTarget->platform_video_id,
                'error_code' => $errorCode,
                'error_response' => $errorData,
            ]);

            // Handle specific Instagram API errors
            if ($errorCode === 404) {
                Log::info('Media not found on Instagram (may have been already deleted)', [
                    'video_target_id' => $this->videoTarget->id,
                    'instagram_media_id' => $this->videoTarget->platform_video_id,
                ]);
                // Media doesn't exist, consider it successfully removed
                return;
            } elseif ($errorCode === 403) {
                throw new \Exception('Insufficient permissions to delete this media from Instagram. Please check your account permissions.');
            } elseif ($errorCode === 401) {
                throw new \Exception('Authentication failed. Please reconnect your Instagram account.');
            } elseif (isset($errorData['error']['message'])) {
                throw new \Exception('Instagram API error: ' . $errorData['error']['message']);
            } else {
                throw new \Exception('Failed to remove video from Instagram. HTTP ' . $errorCode);
            }

        } catch (\Exception $e) {
            Log::error('Instagram video removal failed', [
                'video_target_id' => $this->videoTarget->id,
                'instagram_media_id' => $this->videoTarget->platform_video_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'attempt' => $this->attempts(),
            ]);

            // Re-throw the exception to trigger job failure
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Instagram video removal job failed permanently', [
            'video_target_id' => $this->videoTarget->id,
            'instagram_media_id' => $this->videoTarget->platform_video_id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
        ]);

        // Note: We don't update the VideoTarget status here because the target
        // will be deleted from the database by the controller regardless of job success
    }
} 