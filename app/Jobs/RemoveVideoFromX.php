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

class RemoveVideoFromX implements ShouldQueue
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
            Log::info('Starting Twitter video removal for video target: ' . $this->videoTarget->id, [
                'platform_video_id' => $this->videoTarget->platform_video_id,
                'video_title' => $this->videoTarget->video->title,
            ]);

            // Verify we have a platform video ID (tweet ID)
            if (!$this->videoTarget->platform_video_id) {
                throw new \Exception('No Twitter tweet ID found for this target');
            }

            // Get user's Twitter access token
            $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                ->where('platform', 'x')
                ->first();

            if (!$socialAccount) {
                throw new \Exception('Twitter account not connected');
            }

            // Check if we're in development mode with fake tokens
            if ($socialAccount->access_token === 'fake_token_for_development') {
                Log::info('Development mode detected - simulating Twitter video removal');
                sleep(2); // Simulate removal time
                
                Log::info('Twitter video removal completed successfully (simulated)', [
                    'video_target_id' => $this->videoTarget->id,
                    'x_tweet_id' => $this->videoTarget->platform_video_id,
                ]);
                return;
            }

            // Check if token is expired
            if ($socialAccount->token_expires_at && $socialAccount->token_expires_at->isPast()) {
                throw new \Exception('Twitter access token has expired. Cannot remove tweet from Twitter.');
            }

            // Delete the tweet from Twitter using their API v2
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $socialAccount->access_token,
                'Content-Type' => 'application/json',
            ])->delete("https://api.twitter.com/2/tweets/{$this->videoTarget->platform_video_id}");

            if ($response->successful()) {
                $data = $response->json();
                
                if (isset($data['data']['deleted']) && $data['data']['deleted'] === true) {
                    Log::info('Twitter video removal completed successfully', [
                        'video_target_id' => $this->videoTarget->id,
                        'x_tweet_id' => $this->videoTarget->platform_video_id,
                        'video_title' => $this->videoTarget->video->title,
                    ]);
                    return;
                }
            }

            // Handle API errors
            $errorData = $response->json();
            $errorCode = $response->status();

            Log::error('Twitter API error during video removal', [
                'video_target_id' => $this->videoTarget->id,
                'x_tweet_id' => $this->videoTarget->platform_video_id,
                'error_code' => $errorCode,
                'error_response' => $errorData,
            ]);

            // Handle specific Twitter API errors
            if ($errorCode === 404) {
                Log::info('Tweet not found on Twitter (may have been already deleted)', [
                    'video_target_id' => $this->videoTarget->id,
                    'x_tweet_id' => $this->videoTarget->platform_video_id,
                ]);
                // Tweet doesn't exist, consider it successfully removed
                return;
            } elseif ($errorCode === 403) {
                throw new \Exception('Insufficient permissions to delete this tweet from Twitter. Please check your account permissions.');
            } elseif ($errorCode === 401) {
                throw new \Exception('Authentication failed. Please reconnect your Twitter account.');
            } elseif (isset($errorData['errors'][0]['message'])) {
                throw new \Exception('Twitter API error: ' . $errorData['errors'][0]['message']);
            } else {
                throw new \Exception('Failed to remove tweet from Twitter. HTTP ' . $errorCode);
            }

        } catch (\Exception $e) {
            Log::error('Twitter video removal failed', [
                'video_target_id' => $this->videoTarget->id,
                'x_tweet_id' => $this->videoTarget->platform_video_id,
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
        Log::error('Twitter video removal job failed permanently', [
            'video_target_id' => $this->videoTarget->id,
            'x_tweet_id' => $this->videoTarget->platform_video_id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
        ]);

        // Note: We don't update the VideoTarget status here because the target
        // will be deleted from the database by the controller regardless of job success
    }
} 