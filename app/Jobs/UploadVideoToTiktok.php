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

class UploadVideoToTiktok implements ShouldQueue
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
            Log::info('Starting TikTok upload for video target: ' . $this->videoTarget->id);

            // Mark as processing
            $this->videoTarget->markAsProcessing();

            // Get user's TikTok access token
            $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                ->where('platform', 'tiktok')
                ->first();

            if (!$socialAccount) {
                throw new \Exception('TikTok account not connected');
            }

            // Check if we're in development mode with fake tokens
            if ($socialAccount->access_token === 'fake_token_for_development') {
                Log::info('Development mode detected - simulating TikTok upload success');
                sleep(3); // Simulate upload time
                
                Log::info('TikTok upload completed successfully (simulated)', [
                    'video_target_id' => $this->videoTarget->id,
                    'tiktok_video_id' => 'SIMULATED_TIKTOK_' . uniqid()
                ]);

                // Mark as success
                $this->videoTarget->markAsSuccess();
                return;
            }

            // Check if token is expired
            if ($socialAccount->token_expires_at && $socialAccount->token_expires_at->isPast()) {
                throw new \Exception('TikTok access token has expired. Please reconnect your account.');
            }

            // Get video file path
            $videoPath = Storage::path($this->videoTarget->video->original_file_path);
            
            if (!file_exists($videoPath)) {
                throw new \Exception('Video file not found: ' . $videoPath);
            }

            // Step 1: Initialize video upload
            $initResponse = $this->initializeVideoUpload($socialAccount);
            $uploadUrl = $initResponse['upload_url'];
            $publishId = $initResponse['publish_id'];

            // Step 2: Upload video file
            $this->uploadVideoFile($uploadUrl, $videoPath);

            // Step 3: Publish the video
            $this->publishVideo($socialAccount, $publishId);

            Log::info('TikTok upload completed successfully', [
                'video_target_id' => $this->videoTarget->id,
                'publish_id' => $publishId
            ]);

            // Mark as success
            $this->videoTarget->markAsSuccess();

        } catch (\Exception $e) {
            Log::error('TikTok upload failed', [
                'video_target_id' => $this->videoTarget->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Mark as failed
            $this->videoTarget->markAsFailed($e->getMessage());
        }
    }

    /**
     * Initialize video upload with TikTok API.
     */
    protected function initializeVideoUpload(SocialAccount $socialAccount): array
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $socialAccount->access_token,
            'Content-Type' => 'application/json'
        ])->post('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', [
            'post_info' => [
                'title' => $this->videoTarget->video->title,
                'description' => $this->videoTarget->video->description,
                'privacy_level' => 'SELF_ONLY', // Private by default for safety
                'disable_duet' => false,
                'disable_comment' => false,
                'disable_stitch' => false,
                'video_cover_timestamp_ms' => 1000
            ],
            'source_info' => [
                'source' => 'FILE_UPLOAD',
                'video_size' => filesize(Storage::path($this->videoTarget->video->original_file_path)),
                'chunk_size' => 10000000, // 10MB chunks
                'total_chunk_count' => 1
            ]
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to initialize TikTok upload: ' . $response->body());
        }

        $data = $response->json();
        
        if ($data['error']['code'] !== 'ok') {
            throw new \Exception('TikTok API error: ' . $data['error']['message']);
        }

        return [
            'upload_url' => $data['data']['upload_url'],
            'publish_id' => $data['data']['publish_id']
        ];
    }

    /**
     * Upload video file to TikTok.
     */
    protected function uploadVideoFile(string $uploadUrl, string $videoPath): void
    {
        $response = Http::withHeaders([
            'Content-Range' => 'bytes 0-' . (filesize($videoPath) - 1) . '/' . filesize($videoPath),
            'Content-Length' => (string) filesize($videoPath)
        ])->attach('video', file_get_contents($videoPath), 'video.mp4')
          ->put($uploadUrl);

        if (!$response->successful()) {
            throw new \Exception('Failed to upload video to TikTok: ' . $response->body());
        }
    }

    /**
     * Publish the uploaded video.
     */
    protected function publishVideo(SocialAccount $socialAccount, string $publishId): void
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $socialAccount->access_token,
            'Content-Type' => 'application/json'
        ])->post('https://open.tiktokapis.com/v2/post/publish/video/init/', [
            'publish_id' => $publishId
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to publish video on TikTok: ' . $response->body());
        }

        $data = $response->json();
        
        if ($data['error']['code'] !== 'ok') {
            throw new \Exception('TikTok publish error: ' . $data['error']['message']);
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('TikTok upload job failed permanently', [
            'video_target_id' => $this->videoTarget->id,
            'error' => $exception->getMessage()
        ]);

        $this->videoTarget->markAsFailed('Job failed permanently: ' . $exception->getMessage());
    }
} 