<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use App\Services\AISubtitleGeneratorService;
use App\Models\Video;

class RenderVideoWithSubtitlesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $generationId;
    public $videoId;
    public $timeout = 1800; // 30 minutes

    /**
     * Create a new job instance.
     */
    public function __construct(string $generationId, int $videoId)
    {
        $this->generationId = $generationId;
        $this->videoId = $videoId;
    }

    /**
     * Execute the job.
     */
    public function handle(AISubtitleGeneratorService $subtitleService)
    {
        try {
            Log::info('Starting background video rendering with subtitles', [
                'generation_id' => $this->generationId,
                'video_id' => $this->videoId
            ]);

            $video = Video::findOrFail($this->videoId);
            $result = $subtitleService->renderVideoWithSubtitles($this->generationId, $video);

            // Optionally, update the video record with the rendered video path/status
            $video->rendered_video_path = $result['rendered_video_path'] ?? null;
            $video->rendered_video_status = 'completed';
            $video->save();

            Log::info('Background video rendering completed', [
                'generation_id' => $this->generationId,
                'video_id' => $this->videoId
            ]);
        } catch (\Exception $e) {
            Log::error('Background video rendering failed', [
                'generation_id' => $this->generationId,
                'video_id' => $this->videoId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // Update the video record with failed status
            try {
                $video = Video::find($this->videoId);
                if ($video) {
                    $video->rendered_video_status = 'failed';
                    $video->save();
                }
            } catch (\Exception $updateException) {
                Log::error('Failed to update video status after render failure', [
                    'video_id' => $this->videoId,
                    'error' => $updateException->getMessage()
                ]);
            }
        }
    }
} 