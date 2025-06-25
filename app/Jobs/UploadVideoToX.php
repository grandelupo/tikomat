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

class UploadVideoToX implements ShouldQueue
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
            Log::info('Starting Twitter upload for video target: ' . $this->videoTarget->id);

            // Mark as processing
            $this->videoTarget->markAsProcessing();

            // Get user's Twitter access token
            $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                ->where('channel_id', $this->videoTarget->video->channel_id)
                ->where('platform', 'twitter')
                ->first();

            if (!$socialAccount) {
                throw new \Exception('Twitter account not connected');
            }

            // Check if we're in development mode with fake tokens
            if ($socialAccount->access_token === 'fake_token_for_development') {
                Log::info('Development mode detected - simulating Twitter upload success');
                sleep(2); // Simulate upload time
                
                Log::info('Twitter upload completed successfully (simulated)', [
                    'video_target_id' => $this->videoTarget->id,
                    'twitter_tweet_id' => 'SIMULATED_TWITTER_' . uniqid()
                ]);

                // Mark as success
                $this->videoTarget->markAsSuccess();
                return;
            }

            // Check if token is expired
            if ($socialAccount->token_expires_at && $socialAccount->token_expires_at->isPast()) {
                throw new \Exception('Twitter access token has expired. Please reconnect your account.');
            }

            // Get video file path
            $videoPath = Storage::path($this->videoTarget->video->original_file_path);
            
            if (!file_exists($videoPath)) {
                throw new \Exception('Video file not found: ' . $videoPath);
            }

            // Step 1: Upload media to Twitter
            $mediaId = $this->uploadMediaToTwitter($socialAccount, $videoPath);

            // Step 2: Wait for media processing
            $this->waitForMediaProcessing($socialAccount, $mediaId);

            // Step 3: Create tweet with video
            $this->createTweetWithVideo($socialAccount, $mediaId);

            Log::info('Twitter upload completed successfully', [
                'video_target_id' => $this->videoTarget->id,
            ]);

            // Mark as success
            $this->videoTarget->markAsSuccess();

        } catch (\Exception $e) {
            Log::error('Twitter upload failed', [
                'video_target_id' => $this->videoTarget->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Mark as failed
            $this->videoTarget->markAsFailed($e->getMessage());
        }
    }

    /**
     * Upload media to Twitter.
     */
    protected function uploadMediaToTwitter(SocialAccount $socialAccount, string $videoPath): string
    {
        $fileSize = filesize($videoPath);
        
        // Step 1: Initialize upload
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $socialAccount->access_token,
        ])->post('https://upload.twitter.com/1.1/media/upload.json', [
            'command' => 'INIT',
            'total_bytes' => $fileSize,
            'media_type' => 'video/mp4',
            'media_category' => 'tweet_video'
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to initialize Twitter media upload: ' . $response->body());
        }

        $initData = $response->json();
        $mediaId = $initData['media_id_string'];

        // Step 2: Upload video chunks
        $chunkSize = 5 * 1024 * 1024; // 5MB chunks
        $handle = fopen($videoPath, 'rb');
        $segmentIndex = 0;

        while (!feof($handle)) {
            $chunk = fread($handle, $chunkSize);
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $socialAccount->access_token,
            ])->attach('media', $chunk, 'video_chunk')
            ->post('https://upload.twitter.com/1.1/media/upload.json', [
                'command' => 'APPEND',
                'media_id' => $mediaId,
                'segment_index' => $segmentIndex
            ]);

            if (!$response->successful()) {
                fclose($handle);
                throw new \Exception('Failed to upload video chunk to Twitter: ' . $response->body());
            }

            $segmentIndex++;
        }

        fclose($handle);

        // Step 3: Finalize upload
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $socialAccount->access_token,
        ])->post('https://upload.twitter.com/1.1/media/upload.json', [
            'command' => 'FINALIZE',
            'media_id' => $mediaId
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to finalize Twitter media upload: ' . $response->body());
        }

        return $mediaId;
    }

    /**
     * Wait for media processing to complete.
     */
    protected function waitForMediaProcessing(SocialAccount $socialAccount, string $mediaId): void
    {
        $maxAttempts = 30;
        $attempt = 0;

        while ($attempt < $maxAttempts) {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $socialAccount->access_token,
            ])->get('https://upload.twitter.com/1.1/media/upload.json', [
                'command' => 'STATUS',
                'media_id' => $mediaId
            ]);

            if (!$response->successful()) {
                throw new \Exception('Failed to check Twitter media processing status: ' . $response->body());
            }

            $data = $response->json();
            
            if (isset($data['processing_info'])) {
                $state = $data['processing_info']['state'];
                
                if ($state === 'succeeded') {
                    return;
                } elseif ($state === 'failed') {
                    throw new \Exception('Twitter media processing failed');
                }
                
                // Still processing, wait and retry
                sleep(2);
            } else {
                // No processing info means it's ready
                return;
            }

            $attempt++;
        }

        throw new \Exception('Twitter media processing timed out');
    }

    /**
     * Create tweet with video.
     */
    protected function createTweetWithVideo(SocialAccount $socialAccount, string $mediaId): void
    {
        $tweetText = $this->videoTarget->video->title;
        if ($this->videoTarget->video->description) {
            $tweetText .= "\n\n" . $this->videoTarget->video->description;
        }

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $socialAccount->access_token,
            'Content-Type' => 'application/json'
        ])->post('https://api.twitter.com/2/tweets', [
            'text' => $tweetText,
            'media' => [
                'media_ids' => [$mediaId]
            ]
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to create Twitter tweet: ' . $response->body());
        }

        $data = $response->json();

        if (isset($data['errors'])) {
            throw new \Exception('Twitter API error: ' . json_encode($data['errors']));
        }

        Log::info('Twitter tweet created successfully', [
            'tweet_id' => $data['data']['id'] ?? 'unknown',
            'video_target_id' => $this->videoTarget->id,
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Twitter upload job failed permanently', [
            'video_target_id' => $this->videoTarget->id,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);

        $this->videoTarget->markAsFailed('Job failed permanently: ' . $exception->getMessage());
    }
}
