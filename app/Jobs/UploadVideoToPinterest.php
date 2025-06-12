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

class UploadVideoToPinterest implements ShouldQueue
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
            Log::info('Starting Pinterest upload for video target: ' . $this->videoTarget->id);

            // Mark as processing
            $this->videoTarget->markAsProcessing();

            // Get user's Pinterest access token
            $socialAccount = SocialAccount::where('user_id', $this->videoTarget->video->user_id)
                ->where('channel_id', $this->videoTarget->video->channel_id)
                ->where('platform', 'pinterest')
                ->first();

            if (!$socialAccount) {
                throw new \Exception('Pinterest account not connected');
            }

            // Check if we're in development mode with fake tokens
            if ($socialAccount->access_token === 'fake_token_for_development') {
                Log::info('Development mode detected - simulating Pinterest upload success');
                sleep(3); // Simulate upload time
                
                Log::info('Pinterest upload completed successfully (simulated)', [
                    'video_target_id' => $this->videoTarget->id,
                    'pinterest_pin_id' => 'SIMULATED_PINTEREST_' . uniqid()
                ]);

                // Mark as success
                $this->videoTarget->markAsSuccess();
                return;
            }

            // Check if token is expired
            if ($socialAccount->token_expires_at && $socialAccount->token_expires_at->isPast()) {
                throw new \Exception('Pinterest access token has expired. Please reconnect your account.');
            }

            // Get video file - For Pinterest, we need a publicly accessible URL
            $videoUrl = $this->getPublicVideoUrl();

            // Step 1: Get or create a board
            $boardId = $this->getOrCreateBoard($socialAccount);

            // Step 2: Create video pin
            $this->createVideoPin($socialAccount, $boardId, $videoUrl);

            Log::info('Pinterest upload completed successfully', [
                'video_target_id' => $this->videoTarget->id,
            ]);

            // Mark as success
            $this->videoTarget->markAsSuccess();

        } catch (\Exception $e) {
            Log::error('Pinterest upload failed', [
                'video_target_id' => $this->videoTarget->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Mark as failed
            $this->videoTarget->markAsFailed($e->getMessage());
        }
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
     * Get or create a Pinterest board.
     */
    protected function getOrCreateBoard(SocialAccount $socialAccount): string
    {
        // First, try to get existing boards
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $socialAccount->access_token,
        ])->get('https://api.pinterest.com/v5/boards');

        if (!$response->successful()) {
            throw new \Exception('Failed to get Pinterest boards: ' . $response->body());
        }

        $data = $response->json();

        // If we have boards, use the first one
        if (!empty($data['items'])) {
            return $data['items'][0]['id'];
        }

        // Create a new board if none exist
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $socialAccount->access_token,
            'Content-Type' => 'application/json'
        ])->post('https://api.pinterest.com/v5/boards', [
            'name' => 'Tikomat Videos',
            'description' => 'Videos uploaded via Tikomat',
            'privacy' => 'PUBLIC'
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to create Pinterest board: ' . $response->body());
        }

        $boardData = $response->json();
        return $boardData['id'];
    }

    /**
     * Create video pin on Pinterest.
     */
    protected function createVideoPin(SocialAccount $socialAccount, string $boardId, string $videoUrl): void
    {
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $socialAccount->access_token,
            'Content-Type' => 'application/json'
        ])->post('https://api.pinterest.com/v5/pins', [
            'board_id' => $boardId,
            'title' => $this->videoTarget->video->title,
            'description' => $this->videoTarget->video->description,
            'media_source' => [
                'source_type' => 'video_url',
                'url' => $videoUrl
            ]
        ]);

        if (!$response->successful()) {
            throw new \Exception('Failed to create Pinterest video pin: ' . $response->body());
        }

        $data = $response->json();

        if (isset($data['error'])) {
            throw new \Exception('Pinterest API error: ' . $data['error']['message']);
        }

        Log::info('Pinterest video pin created successfully', [
            'pin_id' => $data['id'] ?? 'unknown',
            'video_target_id' => $this->videoTarget->id,
        ]);
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Pinterest upload job failed permanently', [
            'video_target_id' => $this->videoTarget->id,
            'error' => $exception->getMessage(),
            'trace' => $exception->getTraceAsString()
        ]);

        $this->videoTarget->markAsFailed('Job failed permanently: ' . $exception->getMessage());
    }
}
