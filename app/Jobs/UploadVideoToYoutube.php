<?php

namespace App\Jobs;

use App\Models\VideoTarget;
use App\Models\SocialAccount;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Google\Client as GoogleClient;
use Google\Service\YouTube;

class UploadVideoToYoutube implements ShouldQueue
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
            Log::info('Starting YouTube upload for video target: ' . $this->videoTarget->id);

            // Mark as processing
            $this->videoTarget->markAsProcessing();

            // Get user's YouTube access token
            $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                ->where('platform', 'youtube')
                ->first();

            if (!$socialAccount) {
                throw new \Exception('YouTube account not connected');
            }

            // Check if we're in development mode with fake tokens
            if ($socialAccount->access_token === 'fake_token_for_development') {
                Log::info('Development mode detected - simulating YouTube upload success');
                sleep(2); // Simulate upload time
                
                Log::info('YouTube upload completed successfully (simulated)', [
                    'video_target_id' => $this->videoTarget->id,
                    'youtube_video_id' => 'SIMULATED_' . uniqid()
                ]);

                // Mark as success
                $this->videoTarget->markAsSuccess();
                return;
            }

            // Check if token is expired and refresh if needed
            if ($socialAccount->token_expires_at && $socialAccount->token_expires_at->isPast()) {
                Log::info('Token expired, attempting refresh', [
                    'social_account_id' => $socialAccount->id,
                    'expires_at' => $socialAccount->token_expires_at,
                    'has_refresh_token' => !empty($socialAccount->refresh_token),
                ]);
                
                if (!$socialAccount->refresh_token) {
                    throw new \Exception('Access token expired and no refresh token available. Please reconnect your YouTube account.');
                }
                
                try {
                    $this->refreshToken($socialAccount);
                } catch (\Exception $e) {
                    Log::error('Token refresh failed', [
                        'error' => $e->getMessage(),
                        'social_account_id' => $socialAccount->id,
                    ]);
                    throw new \Exception('Failed to refresh access token. Please reconnect your YouTube account.');
                }
            }

            // Initialize Google Client
            $client = $this->getGoogleClient($socialAccount);
            
            // Initialize YouTube service
            $youtube = new YouTube($client);

            // Get video file path
            $videoPath = Storage::path($this->videoTarget->video->original_file_path);
            
            if (!file_exists($videoPath)) {
                throw new \Exception('Video file not found: ' . $videoPath);
            }

            // Create video snippet
            $snippet = new YouTube\VideoSnippet();
            $snippet->setTitle($this->videoTarget->video->title);
            $snippet->setDescription($this->videoTarget->video->description);
            $snippet->setTags(['social media', 'video']);
            $snippet->setCategoryId('22'); // People & Blogs category

            // Create video status (private by default for safety)
            $status = new YouTube\VideoStatus();
            $status->setPrivacyStatus('private');

            // Create video resource
            $video = new YouTube\Video();
            $video->setSnippet($snippet);
            $video->setStatus($status);

            // Upload the video
            $response = $youtube->videos->insert('snippet,status', $video, [
                'data' => file_get_contents($videoPath),
                'mimeType' => 'video/*',
                'uploadType' => 'multipart'
            ]);

            $videoId = $response->getId();
            $videoUrl = "https://youtube.com/watch?v={$videoId}";

            Log::info('YouTube upload completed successfully', [
                'video_target_id' => $this->videoTarget->id,
                'youtube_video_id' => $videoId,
                'video_url' => $videoUrl
            ]);

            // Update video target with platform video ID and URL
            $this->videoTarget->update([
                'platform_video_id' => $videoId,
                'platform_url' => $videoUrl,
                'status' => 'success',
                'error_message' => null
            ]);

        } catch (\Exception $e) {
            Log::error('YouTube upload failed', [
                'video_target_id' => $this->videoTarget->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Mark as failed
            $this->videoTarget->markAsFailed($e->getMessage());
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

        Log::info('Refreshing Google access token', [
            'social_account_id' => $socialAccount->id,
            'client_id_set' => !empty(config('services.google.client_id')),
            'client_secret_set' => !empty(config('services.google.client_secret')),
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
                $updateData = [
                    'access_token' => $newToken['access_token'],
                ];
                
                // Update expiration if provided
                if (isset($newToken['expires_in'])) {
                    $updateData['token_expires_at'] = now()->addSeconds($newToken['expires_in']);
                }
                
                // Update refresh token if a new one was provided
                if (isset($newToken['refresh_token'])) {
                    $updateData['refresh_token'] = $newToken['refresh_token'];
                }
                
                $socialAccount->update($updateData);
                
                Log::info('Access token refreshed successfully', [
                    'social_account_id' => $socialAccount->id,
                    'new_expires_at' => $updateData['token_expires_at'] ?? 'not_set',
                ]);
            }
            
        } catch (\Exception $e) {
            Log::error('Token refresh failed', [
                'error' => $e->getMessage(),
                'social_account_id' => $socialAccount->id,
            ]);
            throw new \Exception('Failed to refresh token: ' . $e->getMessage());
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('YouTube upload job failed permanently', [
            'video_target_id' => $this->videoTarget->id,
            'error' => $exception->getMessage()
        ]);

        $this->videoTarget->markAsFailed('Job failed permanently: ' . $exception->getMessage());
    }
} 