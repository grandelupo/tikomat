<?php

namespace App\Jobs;

use App\Models\VideoTarget;
use App\Models\SocialAccount;
use App\Services\HashtagValidationService;
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
    protected HashtagValidationService $hashtagValidator;

    /**
     * Create a new job instance.
     */
    public function __construct(VideoTarget $videoTarget)
    {
        $this->videoTarget = $videoTarget;
        $this->hashtagValidator = app(HashtagValidationService::class);
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
            $publishId = $this->initializeTikTokUpload($socialAccount);

            // Step 2: Upload video file
            $this->uploadVideoFile($publishId, $videoPath);

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
     * Initialize TikTok upload.
     */
    protected function initializeTikTokUpload(SocialAccount $socialAccount): string
    {
        // Get advanced options for this platform
        $options = $this->videoTarget->advanced_options ?? [];
        
        // Prepare post info with advanced options
        $postInfo = [
            'title' => $this->videoTarget->video->title,
            'description' => $this->videoTarget->video->description,
            'privacy_level' => $options['privacy'] ?? 'SELF_ONLY', // Private by default for safety
            'disable_duet' => !($options['allowDuet'] ?? true),
            'disable_comment' => !($options['allowComments'] ?? true),
            'disable_stitch' => !($options['allowStitch'] ?? true),
            'video_cover_timestamp_ms' => ($options['coverTimestamp'] ?? 1) * 1000
        ];

        // Add hashtags if provided
        if (!empty($options['hashtags'])) {
            $hashtags = is_array($options['hashtags']) 
                ? implode(' ', $options['hashtags']) 
                : $options['hashtags'];
            $postInfo['description'] .= "\n\n" . $hashtags;
        } elseif (!empty($this->videoTarget->video->tags)) {
            // Use tags from video database field if no advanced options hashtags
            $videoTags = $this->videoTarget->video->tags;
            if (is_array($videoTags) && !empty($videoTags)) {
                $hashtags = implode(' ', array_map(function($tag) {
                    return '#' . str_replace('#', '', $tag);
                }, $videoTags));
                $postInfo['description'] .= "\n\n" . $hashtags;
            }
        }

        // Validate and filter hashtags in description
        $validationResult = $this->hashtagValidator->validateAndFilterHashtags('tiktok', $postInfo['description']);
        $filteredDescription = $validationResult['filtered_content'];
        
        if ($validationResult['has_changes']) {
            Log::info('TikTok hashtags filtered', [
                'video_target_id' => $this->videoTarget->id,
                'removed_hashtags' => $validationResult['removed_hashtags'],
                'warnings' => $validationResult['warnings'],
                'original_length' => strlen($postInfo['description']),
                'filtered_length' => strlen($filteredDescription),
            ]);
        }

        $postInfo['description'] = $filteredDescription;

        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $socialAccount->access_token,
            'Content-Type' => 'application/json'
        ])->post('https://open.tiktokapis.com/v2/post/publish/inbox/video/init/', [
            'post_info' => $postInfo,
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

        return $data['data']['publish_id'];
    }

    /**
     * Upload video file to TikTok.
     */
    protected function uploadVideoFile(string $publishId, string $videoPath): void
    {
        $response = Http::withHeaders([
            'Content-Range' => 'bytes 0-' . (filesize($videoPath) - 1) . '/' . filesize($videoPath),
            'Content-Length' => (string) filesize($videoPath)
        ])->attach('video', file_get_contents($videoPath), 'video.mp4')
          ->put('https://open.tiktokapis.com/v2/post/publish/video/init/' . $publishId);

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
        ])->post('https://open.tiktokapis.com/v2/post/publish/video/init/' . $publishId);

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