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

class RemoveVideoFromSnapchat implements ShouldQueue
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
            Log::info('Starting Snapchat video removal for video target: ' . $this->videoTarget->id, [
                'platform_video_id' => $this->videoTarget->platform_video_id,
                'video_title' => $this->videoTarget->video->title,
            ]);

            // Verify we have a platform video ID
            if (!$this->videoTarget->platform_video_id) {
                throw new \Exception('No Snapchat story ID found for this target');
            }

            // Get user's Snapchat access token
            $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                ->where('platform', 'snapchat')
                ->first();

            if (!$socialAccount) {
                throw new \Exception('Snapchat account not connected');
            }

            // Check if we're in development mode with fake tokens
            if ($socialAccount->access_token === 'fake_token_for_development') {
                Log::info('Development mode detected - simulating Snapchat video removal');
                sleep(2); // Simulate removal time
                
                Log::info('Snapchat video removal completed successfully (simulated)', [
                    'video_target_id' => $this->videoTarget->id,
                    'snapchat_story_id' => $this->videoTarget->platform_video_id,
                ]);
                return;
            }

            // Check if token is expired
            if ($socialAccount->token_expires_at && $socialAccount->token_expires_at->isPast()) {
                throw new \Exception('Snapchat access token has expired. Cannot remove story from Snapchat.');
            }

            // Delete the story from Snapchat using their API
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $socialAccount->access_token,
                'Content-Type' => 'application/json',
            ])->delete("https://adsapi.snapchat.com/v1/stories/{$this->videoTarget->platform_video_id}");

            if ($response->successful()) {
                $data = $response->json();
                
                // Snapchat API typically returns 204 No Content for successful deletions
                if ($response->status() === 204) {
                    Log::info('Snapchat video removal completed successfully', [
                        'video_target_id' => $this->videoTarget->id,
                        'snapchat_story_id' => $this->videoTarget->platform_video_id,
                        'video_title' => $this->videoTarget->video->title,
                    ]);
                    return;
                }
            }

            // Handle API errors
            $errorData = $response->json();
            $errorCode = $response->status();

            Log::error('Snapchat API error during video removal', [
                'video_target_id' => $this->videoTarget->id,
                'snapchat_story_id' => $this->videoTarget->platform_video_id,
                'error_code' => $errorCode,
                'error_response' => $errorData,
            ]);

            // Handle specific Snapchat API errors
            if ($errorCode === 404) {
                Log::info('Story not found on Snapchat (may have been already deleted or expired)', [
                    'video_target_id' => $this->videoTarget->id,
                    'snapchat_story_id' => $this->videoTarget->platform_video_id,
                ]);
                // Story doesn't exist, consider it successfully removed
                return;
            } elseif ($errorCode === 403) {
                throw new \Exception('Insufficient permissions to delete this story from Snapchat. Please check your account permissions.');
            } elseif ($errorCode === 401) {
                throw new \Exception('Authentication failed. Please reconnect your Snapchat account.');
            } elseif (isset($errorData['request_status']) && $errorData['request_status'] === 'ERROR') {
                $errorMessage = $errorData['debug_message'] ?? 'Unknown Snapchat API error';
                throw new \Exception('Snapchat API error: ' . $errorMessage);
            } else {
                throw new \Exception('Failed to remove story from Snapchat. HTTP ' . $errorCode);
            }

        } catch (\Exception $e) {
            Log::error('Snapchat video removal failed', [
                'video_target_id' => $this->videoTarget->id,
                'snapchat_story_id' => $this->videoTarget->platform_video_id,
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
        Log::error('Snapchat video removal job failed permanently', [
            'video_target_id' => $this->videoTarget->id,
            'snapchat_story_id' => $this->videoTarget->platform_video_id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
        ]);

        // Note: We don't update the VideoTarget status here because the target
        // will be deleted from the database by the controller regardless of job success
    }
} 