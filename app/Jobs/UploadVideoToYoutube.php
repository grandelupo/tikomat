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
use Illuminate\Support\Facades\Http;
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
            Log::info('Starting YouTube upload for video target', [
                'video_target_id' => $this->videoTarget->id,
                'video_id' => $this->videoTarget->video->id,
                'video_title' => $this->videoTarget->video->title,
                'user_id' => $this->videoTarget->video->user_id,
                'channel_id' => $this->videoTarget->video->channel_id,
                'channel_name' => $this->videoTarget->video->channel->name ?? 'Unknown',
                'platform' => 'youtube',
                'current_status' => $this->videoTarget->status,
            ]);

            // Mark as processing
            $this->videoTarget->markAsProcessing();

            // Get user's YouTube access token for this specific channel
            $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                ->where('channel_id', $this->videoTarget->video->channel_id)
                ->where('platform', 'youtube')
                ->first();

            Log::info('Social account lookup result', [
                'video_target_id' => $this->videoTarget->id,
                'user_id' => $this->videoTarget->video->user_id,
                'channel_id' => $this->videoTarget->video->channel_id,
                'found_account' => $socialAccount ? true : false,
                'social_account_id' => $socialAccount ? $socialAccount->id : null,
                'platform_channel_name' => $socialAccount->platform_channel_name ?? null,
                'has_access_token' => $socialAccount ? !empty($socialAccount->access_token) : false,
                'has_refresh_token' => $socialAccount ? !empty($socialAccount->refresh_token) : false,
                'token_expires_at' => $socialAccount ? $socialAccount->token_expires_at?->toISOString() : null,
            ]);

            if (!$socialAccount) {
                // Log all available social accounts for debugging
                $allAccounts = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                    ->where('platform', 'youtube')
                    ->get();
                
                Log::warning('No YouTube social account found for this channel', [
                    'video_target_id' => $this->videoTarget->id,
                    'looking_for_user_id' => $this->videoTarget->video->user_id,
                    'looking_for_channel_id' => $this->videoTarget->video->channel_id,
                    'available_youtube_accounts' => $allAccounts->map(function($account) {
                        return [
                            'id' => $account->id,
                            'channel_id' => $account->channel_id,
                            'platform_channel_name' => $account->platform_channel_name,
                            'created_at' => $account->created_at,
                        ];
                    })->toArray(),
                ]);
                
                throw new \Exception('YouTube account not connected to this channel. Please connect YouTube to this channel first.');
            }

            // Check if we're in development mode with fake tokens
            if ($socialAccount->access_token === 'fake_token_for_development') {
                Log::info('Development mode detected - simulating YouTube upload success', [
                    'video_target_id' => $this->videoTarget->id,
                    'social_account_id' => $socialAccount->id,
                    'platform_channel_name' => $socialAccount->platform_channel_name,
                ]);
                sleep(2); // Simulate upload time
                
                $simulatedVideoId = 'SIMULATED_' . uniqid();
                Log::info('YouTube upload completed successfully (simulated)', [
                    'video_target_id' => $this->videoTarget->id,
                    'youtube_video_id' => $simulatedVideoId,
                    'platform_channel_name' => $socialAccount->platform_channel_name,
                ]);

                // Update video target with simulated data
                $this->videoTarget->update([
                    'platform_video_id' => $simulatedVideoId,
                    'platform_url' => "https://youtube.com/watch?v={$simulatedVideoId}",
                    'status' => 'success',
                    'error_message' => null
                ]);
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

            // Get video file path first to fail early if missing
            $videoPath = Storage::path($this->videoTarget->video->original_file_path);
            $videoUrl = $this->getPublicVideoUrl();
            
            Log::info('Video file validation', [
                'video_target_id' => $this->videoTarget->id,
                'original_file_path' => $this->videoTarget->video->original_file_path,
                'video_path' => $videoPath,
                'video_url' => $videoUrl,
                'file_exists' => file_exists($videoPath),
                'file_size' => file_exists($videoPath) ? filesize($videoPath) : 0,
            ]);
            
            if (!file_exists($videoPath)) {
                throw new \Exception('Video file not found: ' . $videoPath);
            }

            // Test video URL accessibility
            $urlAccessible = $this->testVideoUrlAccessibility($videoUrl);
            Log::info('Video URL accessibility test', [
                'video_target_id' => $this->videoTarget->id,
                'video_url' => $videoUrl,
                'accessible' => $urlAccessible,
            ]);

            // Initialize Google Client
            Log::info('Initializing Google Client for YouTube upload', [
                'video_target_id' => $this->videoTarget->id,
                'social_account_id' => $socialAccount->id,
                'platform_channel_name' => $socialAccount->platform_channel_name,
                'platform_channel_id' => $socialAccount->platform_channel_id,
                'has_client_id' => !empty(config('services.google.client_id')),
                'has_client_secret' => !empty(config('services.google.client_secret')),
            ]);
            
            $client = $this->getGoogleClient($socialAccount);
            
            // Initialize YouTube service
            $youtube = new YouTube($client);

            // Create video snippet with detailed logging
            Log::info('Preparing YouTube video metadata', [
                'video_target_id' => $this->videoTarget->id,
                'title' => $this->videoTarget->video->title,
                'description_length' => strlen($this->videoTarget->video->description ?? ''),
                'platform_channel_name' => $socialAccount->platform_channel_name,
                'platform_channel_id' => $socialAccount->platform_channel_id,
            ]);

            $snippet = new YouTube\VideoSnippet();
            $snippet->setTitle($this->videoTarget->video->title);
            $snippet->setDescription($this->videoTarget->video->description);
            $snippet->setTags(['social media', 'video']);
            $snippet->setCategoryId('22'); // People & Blogs category

            // Add advanced options if available
            $options = $this->videoTarget->advanced_options ?? [];
            if (!empty($options['youtube_privacy_status'])) {
                $privacyStatus = $options['youtube_privacy_status'];
            } else {
                $privacyStatus = 'private'; // Default to private for safety
            }

            // Create video status
            $status = new YouTube\VideoStatus();
            $status->setPrivacyStatus($privacyStatus);

            // Create video resource
            $video = new YouTube\Video();
            $video->setSnippet($snippet);
            $video->setStatus($status);

            Log::info('Starting YouTube video upload', [
                'video_target_id' => $this->videoTarget->id,
                'file_size_mb' => round(filesize($videoPath) / 1024 / 1024, 2),
                'privacy_status' => $privacyStatus,
                'platform_channel_name' => $socialAccount->platform_channel_name,
                'upload_type' => 'multipart',
            ]);

            $startTime = microtime(true);
            
            // Upload the video
            try {
                $response = $youtube->videos->insert('snippet,status', $video, [
                    'data' => file_get_contents($videoPath),
                    'mimeType' => 'video/*',
                    'uploadType' => 'multipart'
                ]);
                
                $uploadTime = microtime(true) - $startTime;
                
                $videoId = $response->getId();
                $videoUrl = "https://youtube.com/watch?v={$videoId}";

                Log::info('YouTube upload completed successfully', [
                    'video_target_id' => $this->videoTarget->id,
                    'youtube_video_id' => $videoId,
                    'video_url' => $videoUrl,
                    'upload_time_seconds' => round($uploadTime, 2),
                    'platform_channel_name' => $socialAccount->platform_channel_name,
                    'platform_channel_id' => $socialAccount->platform_channel_id,
                ]);
                
            } catch (\Google_Service_Exception $e) {
                Log::error('YouTube API service exception', [
                    'video_target_id' => $this->videoTarget->id,
                    'error_code' => $e->getCode(),
                    'error_message' => $e->getMessage(),
                    'errors' => $e->getErrors(),
                    'platform_channel_name' => $socialAccount->platform_channel_name,
                ]);
                throw new \Exception('YouTube API error: ' . $e->getMessage());
            } catch (\Exception $e) {
                Log::error('YouTube upload failed during API call', [
                    'video_target_id' => $this->videoTarget->id,
                    'error_message' => $e->getMessage(),
                    'upload_time_seconds' => round(microtime(true) - $startTime, 2),
                ]);
                throw $e;
            }

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
        ]);

        $this->videoTarget->markAsFailed('Job failed permanently: ' . $exception->getMessage());
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
} 