<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Services\AISubtitleGeneratorService;

class ProcessSubtitleGeneration implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $generationId;
    public $videoPath;
    public $options;

    /**
     * The number of seconds the job can run before timing out.
     */
    public $timeout = 1800; // 30 minutes

    /**
     * Create a new job instance.
     */
    public function __construct(string $generationId, string $videoPath, array $options = [])
    {
        $this->generationId = $generationId;
        $this->videoPath = $videoPath;
        $this->options = $options;
    }

    /**
     * Execute the job.
     */
    public function handle(AISubtitleGeneratorService $subtitleService): void
    {
        try {
            Log::info('Starting background subtitle processing', [
                'generation_id' => $this->generationId,
                'video_path' => $this->videoPath
            ]);

            // This will run the actual processing logic
            $subtitleService->processSubtitlesInBackground($this->generationId, $this->videoPath, $this->options);

            Log::info('Background subtitle processing completed', [
                'generation_id' => $this->generationId
            ]);

        } catch (\Exception $e) {
            Log::error('Background subtitle processing failed', [
                'generation_id' => $this->generationId,
                'error' => $e->getMessage()
            ]);

            // Mark the generation as failed in the service
            $subtitleService->markGenerationAsFailed($this->generationId, $e->getMessage());
        }
    }

    /**
     * Handle a job failure.
     */
    public function failed(\Throwable $exception): void
    {
        Log::error('Subtitle generation job failed', [
            'generation_id' => $this->generationId,
            'video_path' => $this->videoPath,
            'error' => $exception->getMessage()
        ]);
    }
} 