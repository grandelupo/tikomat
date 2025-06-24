<?php

namespace App\Jobs;

use App\Services\AIWatermarkRemoverService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessWatermarkRemoval implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $timeout = 3600; // 1 hour timeout
    public $tries = 3;

    protected string $removalId;
    protected string $videoPath;
    protected array $watermarks;
    protected array $options;

    /**
     * Create a new job instance.
     */
    public function __construct(string $removalId, string $videoPath, array $watermarks, array $options = [])
    {
        $this->removalId = $removalId;
        $this->videoPath = $videoPath;
        $this->watermarks = $watermarks;
        $this->options = $options;
    }

    /**
     * Execute the job.
     */
    public function handle(AIWatermarkRemoverService $watermarkService): void
    {
        try {
            Log::info('Starting background watermark removal job', [
                'removal_id' => $this->removalId,
                'video_path' => $this->videoPath,
                'watermarks_count' => count($this->watermarks)
            ]);

            // Use the service method that processes watermark removal
            $watermarkService->processWatermarkRemovalJob(
                $this->removalId,
                $this->videoPath,
                $this->watermarks,
                $this->options
            );

            Log::info('Watermark removal job completed successfully', [
                'removal_id' => $this->removalId
            ]);

        } catch (\Exception $e) {
            Log::error('Watermark removal job failed', [
                'removal_id' => $this->removalId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Update the cache with failure status
            $watermarkService->updateRemovalProgress($this->removalId, 'failed', 0, [
                'error' => $e->getMessage()
            ]);

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Watermark removal job failed permanently', [
            'removal_id' => $this->removalId,
            'error' => $exception->getMessage()
        ]);
    }
} 