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
use Google\Client as GoogleClient;
use Google\Service\YouTube;

class RemoveVideoFromYoutube implements ShouldQueue
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
            Log::info('Starting YouTube video removal for video target: ' . $this->videoTarget->id, [
                'platform_video_id' => $this->videoTarget->platform_video_id,
                'video_title' => $this->videoTarget->video->title,
            ]);

            // Verify we have a platform video ID
            if (!$this->videoTarget->platform_video_id) {
                throw new \Exception('No YouTube video ID found for this target');
            }

            // Get user's YouTube access token
            $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                ->where('platform', 'youtube')
                ->first();

            if (!$socialAccount) {
                throw new \Exception('YouTube account not connected');
            }

            // Check if we're in development mode with fake tokens
            if ($socialAccount->access_token === 'fake_token_for_development') {
                Log::info('Development mode detected - simulating YouTube video removal');
                sleep(2); // Simulate removal time
                
                Log::info('YouTube video removal completed successfully (simulated)', [
                    'video_target_id' => $this->videoTarget->id,
                    'youtube_video_id' => $this->videoTarget->platform_video_id,
                ]);
                return;
            }

            // Check if token is expired and refresh if needed
            if ($socialAccount->token_expires_at && $socialAccount->token_expires_at->isPast()) {
                Log::info('Token expired, attempting refresh for removal', [
                    'social_account_id' => $socialAccount->id,
                    'expires_at' => $socialAccount->token_expires_at,
                    'has_refresh_token' => !empty($socialAccount->refresh_token),
                ]);
                
                if (!$socialAccount->refresh_token) {
                    throw new \Exception('Access token expired and no refresh token available. Cannot remove video from YouTube.');
                }
                
                try {
                    $this->refreshToken($socialAccount);
                } catch (\Exception $e) {
                    Log::error('Token refresh failed during removal', [
                        'error' => $e->getMessage(),
                        'social_account_id' => $socialAccount->id,
                    ]);
                    throw new \Exception('Failed to refresh access token for video removal.');
                }
            }

            // Initialize Google Client
            $client = $this->getGoogleClient($socialAccount);
            
            // Initialize YouTube service
            $youtube = new YouTube($client);

            try {
                // Delete the video from YouTube
                $youtube->videos->delete($this->videoTarget->platform_video_id);

                Log::info('YouTube video removal completed successfully', [
                    'video_target_id' => $this->videoTarget->id,
                    'youtube_video_id' => $this->videoTarget->platform_video_id,
                    'video_title' => $this->videoTarget->video->title,
                ]);

            } catch (\Google\Service\Exception $e) {
                $errorData = json_decode($e->getMessage(), true);
                $errorCode = $e->getCode();
                
                Log::error('YouTube API error during video removal', [
                    'video_target_id' => $this->videoTarget->id,
                    'youtube_video_id' => $this->videoTarget->platform_video_id,
                    'error_code' => $errorCode,
                    'error_message' => $e->getMessage(),
                    'error_data' => $errorData,
                ]);

                // Handle specific YouTube API errors
                if ($errorCode === 404) {
                    Log::info('Video not found on YouTube (may have been already deleted)', [
                        'video_target_id' => $this->videoTarget->id,
                        'youtube_video_id' => $this->videoTarget->platform_video_id,
                    ]);
                    // Video doesn't exist, consider it successfully removed
                    return;
                } elseif ($errorCode === 403) {
                    throw new \Exception('Insufficient permissions to delete this video from YouTube. Please check your account permissions.');
                } elseif ($errorCode === 401) {
                    throw new \Exception('Authentication failed. Please reconnect your YouTube account.');
                } else {
                    throw new \Exception('YouTube API error: ' . ($errorData['error']['message'] ?? $e->getMessage()));
                }
            }

        } catch (\Exception $e) {
            Log::error('YouTube video removal failed', [
                'video_target_id' => $this->videoTarget->id,
                'youtube_video_id' => $this->videoTarget->platform_video_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'attempt' => $this->attempts(),
            ]);

            // Re-throw the exception to trigger job failure
            throw $e;
        }
    }

    /**
     * Get configured Google Client.
     */
    protected function getGoogleClient(SocialAccount $socialAccount): GoogleClient
    {
        $client = new GoogleClient();
        $client->setClientId(config('services.google.client_id'));
        $client->setClientSecret(config('services.google.client_secret'));
        $client->setAccessToken($socialAccount->access_token);
        
        return $client;
    }

    /**
     * Refresh the access token if needed.
     */
    protected function refreshToken(SocialAccount $socialAccount): void
    {
        if (!$socialAccount->refresh_token) {
            throw new \Exception('No refresh token available');
        }

        Log::info('Refreshing Google access token for video removal', [
            'social_account_id' => $socialAccount->id,
        ]);

        try {
            $client = new GoogleClient();
            $client->setClientId(config('services.google.client_id'));
            $client->setClientSecret(config('services.google.client_secret'));
            
            // Set the refresh token
            $client->setAccessToken([
                'refresh_token' => $socialAccount->refresh_token
            ]);
            
            // Refresh the token
            if ($client->isAccessTokenExpired()) {
                $newToken = $client->fetchAccessTokenWithRefreshToken($socialAccount->refresh_token);
                
                if (isset($newToken['error'])) {
                    throw new \Exception('Google API error: ' . $newToken['error_description'] ?? $newToken['error']);
                }
                
                // Update the social account with new token
                $socialAccount->update([
                    'access_token' => $newToken['access_token'],
                    'token_expires_at' => isset($newToken['expires_in']) ? 
                        now()->addSeconds($newToken['expires_in']) : null,
                ]);

                Log::info('Google access token refreshed successfully for video removal', [
                    'social_account_id' => $socialAccount->id,
                    'expires_at' => $socialAccount->token_expires_at,
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Failed to refresh Google access token for video removal', [
                'social_account_id' => $socialAccount->id,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('YouTube video removal job failed permanently', [
            'video_target_id' => $this->videoTarget->id,
            'youtube_video_id' => $this->videoTarget->platform_video_id,
            'error' => $exception->getMessage(),
            'attempts' => $this->attempts(),
        ]);

        // Note: We don't update the VideoTarget status here because the target
        // will be deleted from the database by the controller regardless of job success
    }
} 