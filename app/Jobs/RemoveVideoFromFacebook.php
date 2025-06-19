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

class RemoveVideoFromFacebook implements ShouldQueue
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
            Log::info('Starting Facebook video removal for video target: ' . $this->videoTarget->id, [
                'platform_video_id' => $this->videoTarget->platform_video_id,
                'video_title' => $this->videoTarget->video->title,
            ]);

            // Verify we have a platform video ID
            if (!$this->videoTarget->platform_video_id) {
                throw new \Exception('No Facebook video ID found for this target');
            }

            // Get user's Facebook access token
            $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                ->where('platform', 'facebook')
                ->first();

            if (!$socialAccount) {
                throw new \Exception('Facebook account not connected');
            }

            // Check if we're in development mode with fake tokens
            if ($socialAccount->access_token === 'fake_token_for_development') {
                Log::info('Development mode detected - simulating Facebook video removal');
                sleep(2); // Simulate removal time
                
                Log::info('Facebook video removal completed successfully (simulated)', [
                    'video_target_id' => $this->videoTarget->id,
                    'facebook_video_id' => $this->videoTarget->platform_video_id,
                ]);
                return;
            }

            // Check if token is expired
            if ($socialAccount->token_expires_at && $socialAccount->token_expires_at->isPast()) {
                throw new \Exception('Facebook access token has expired. Cannot remove video from Facebook.');
            }

            // Delete the video from Facebook using Graph API
            $response = Http::delete("https://graph.facebook.com/v18.0/{$this->videoTarget->platform_video_id}", [
                'access_token' => $socialAccount->access_token
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['success']) && $data['success'] === true) {
                    Log::info('Facebook video removal completed successfully', [
                        'video_target_id' => $this->videoTarget->id,
                        'facebook_video_id' => $this->videoTarget->platform_video_id,
                        'video_title' => $this->videoTarget->video->title,
                    ]);
                    return;
                }
            }

            // Handle API errors
            $errorData = $response->json();
            $errorCode = $response->status();

            Log::error('Facebook API error during video removal', [
                'video_target_id' => $this->videoTarget->id,
                'facebook_video_id' => $this->videoTarget->platform_video_id,
                'error_code' => $errorCode,
                'error_response' => $errorData,
            ]);

            // Handle specific Facebook API errors
            if ($errorCode === 404) {
                Log::info('Video not found on Facebook (may have been already deleted)', [
                    'video_target_id' => $this->videoTarget->id,
                    'facebook_video_id' => $this->videoTarget->platform_video_id,
                ]);
                // Video doesn't exist, consider it successfully removed
                return;
            } elseif ($errorCode === 403) {
                throw new \Exception('Insufficient permissions to delete this video from Facebook. Please check your account permissions.');
            } elseif ($errorCode === 401) {
                throw new \Exception('Authentication failed. Please reconnect your Facebook account.');
            } elseif (isset($errorData['error']['message'])) {
                throw new \Exception('Facebook API error: ' . $errorData['error']['message']);
            } else {
                throw new \Exception('Failed to remove video from Facebook. HTTP ' . $errorCode);
            }

        } catch (\Exception $e) {
            Log::error('Facebook video removal failed', [
                'video_target_id' => $this->videoTarget->id,
                'facebook_video_id' => $this->videoTarget->platform_video_id,
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
        Log::error('Facebook video removal job failed permanently', [
            'video_target_id' => $this->videoTarget->id,
            'facebook_video_id' => $this->videoTarget->platform_video_id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
        ]);

        // Note: We don't update the VideoTarget status here because the target
        // will be deleted from the database by the controller regardless of job success
    }
} 