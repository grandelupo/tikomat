<?php

namespace App\Jobs;

use App\Models\VideoTarget;
use App\Services\VideoUploadService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class UpdateVideoMetadataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected VideoTarget $videoTarget;
    protected array $changes;

    /**
     * Create a new job instance.
     */
    public function __construct(VideoTarget $videoTarget, array $changes = [])
    {
        $this->videoTarget = $videoTarget;
        $this->changes = $changes;
    }

    /**
     * Execute the job.
     */
    public function handle(VideoUploadService $uploadService): void
    {
        try {
            Log::info('Starting video metadata update job', [
                'video_target_id' => $this->videoTarget->id,
                'video_id' => $this->videoTarget->video->id,
                'platform' => $this->videoTarget->platform,
                'changes' => array_keys($this->changes),
            ]);

            // Mark target as processing
            $this->videoTarget->update(['status' => 'processing']);

            // Use the existing upload service to dispatch the appropriate update job
            $uploadService->dispatchUpdateJob($this->videoTarget);

            Log::info('Video metadata update job completed successfully', [
                'video_target_id' => $this->videoTarget->id,
                'platform' => $this->videoTarget->platform,
            ]);

        } catch (\Exception $e) {
            Log::error('Video metadata update job failed', [
                'video_target_id' => $this->videoTarget->id,
                'platform' => $this->videoTarget->platform,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Mark target as failed
            $this->videoTarget->update([
                'status' => 'failed',
                'error_message' => 'Metadata update failed: ' . $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('UpdateVideoMetadataJob failed permanently', [
            'video_target_id' => $this->videoTarget->id,
            'platform' => $this->videoTarget->platform,
            'error' => $exception->getMessage(),
        ]);

        $this->videoTarget->update([
            'status' => 'failed',
            'error_message' => 'Metadata update failed permanently: ' . $exception->getMessage(),
        ]);
    }
} 