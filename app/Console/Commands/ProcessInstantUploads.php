<?php

namespace App\Console\Commands;

use App\Models\Video;
use App\Jobs\ProcessInstantUploadWithAI;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessInstantUploads extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'videos:process-instant-uploads {--video-id= : Process specific video ID} {--dry-run : Show what would be processed without actually processing}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process instant upload videos that are pending AI processing';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $videoId = $this->option('video-id');
        $dryRun = $this->option('dry-run');

        if ($videoId) {
            return $this->processSpecificVideo($videoId, $dryRun);
        }

        return $this->processAllPendingVideos($dryRun);
    }

    /**
     * Process a specific video by ID.
     */
    private function processSpecificVideo(int $videoId, bool $dryRun): int
    {
        $video = Video::find($videoId);
        
        if (!$video) {
            $this->error("Video with ID {$videoId} not found.");
            return 1;
        }

        if ($video->title !== 'Processing...') {
            $this->info("Video '{$video->title}' doesn't appear to be pending processing.");
            return 0;
        }

        $this->info("Found video: {$video->title} (ID: {$video->id})");
        
        if ($dryRun) {
            $this->warn('DRY RUN: Would process this video');
            return 0;
        }

        return $this->processVideo($video);
    }

    /**
     * Process all videos that are pending AI processing.
     */
    private function processAllPendingVideos(bool $dryRun): int
    {
        $pendingVideos = Video::where('title', 'Processing...')
            ->where('description', 'AI is generating optimized content...')
            ->get();

        if ($pendingVideos->isEmpty()) {
            $this->info('No videos pending AI processing found.');
            return 0;
        }

        $this->info("Found {$pendingVideos->count()} videos pending AI processing:");

        foreach ($pendingVideos as $video) {
            $this->line("- Video ID: {$video->id}, Channel: {$video->channel->name}, Uploaded: {$video->created_at}");
        }

        if ($dryRun) {
            $this->warn('DRY RUN: Would process ' . $pendingVideos->count() . ' videos');
            return 0;
        }

        $this->newLine();
        $this->info('Processing videos...');

        $processed = 0;
        $failed = 0;

        foreach ($pendingVideos as $video) {
            $this->line("Processing video ID: {$video->id}...");
            
            if ($this->processVideo($video) === 0) {
                $processed++;
                $this->info("✓ Successfully processed video ID: {$video->id}");
            } else {
                $failed++;
                $this->error("✗ Failed to process video ID: {$video->id}");
            }
        }

        $this->newLine();
        $this->info("Processing complete! Processed: {$processed}, Failed: {$failed}");

        return $failed > 0 ? 1 : 0;
    }

    /**
     * Process a single video.
     */
    private function processVideo(Video $video): int
    {
        try {
            // Get connected platforms for the channel
            $channel = $video->channel;
            $connectedPlatforms = $channel->socialAccounts->pluck('platform')->toArray();
            $allowedPlatforms = $video->user->getAllowedPlatforms();
            
            // Filter platforms to only include those that are both connected and allowed
            $availablePlatforms = array_intersect($connectedPlatforms, $allowedPlatforms);

            if (empty($availablePlatforms)) {
                $this->warn("No platforms available for video ID: {$video->id}");
                $this->sendFailureNotification($video, 'No platforms available', 'No social media platforms are connected or available for this video.');
                return 1;
            }

            // Dispatch the job synchronously for immediate processing
            $job = new ProcessInstantUploadWithAI($video, $availablePlatforms);
            
            // Get the required services
            $videoAnalyzer = app(\App\Services\AIVideoAnalyzerService::class);
            $watermarkRemover = app(\App\Services\AIWatermarkRemoverService::class);
            $subtitleGenerator = app(\App\Services\AISubtitleGeneratorService::class);
            $uploadService = app(\App\Services\VideoUploadService::class);

            // Execute the job directly
            $job->handle($videoAnalyzer, $watermarkRemover, $subtitleGenerator, $uploadService);

            return 0;

        } catch (\Exception $e) {
            Log::error('Failed to process instant upload video', [
                'video_id' => $video->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $this->error("Error processing video: " . $e->getMessage());
            
            // Update video with error status
            $video->update([
                'title' => 'Processing Failed',
                'description' => 'AI processing failed: ' . $e->getMessage() . '. Please try uploading again or contact support.',
            ]);
            
            // Send notification to user about the failure
            $this->sendFailureNotification($video, 'AI Processing Failed', $e->getMessage());
            
            return 1;
        }
    }

    /**
     * Send failure notification to the video owner.
     */
    private function sendFailureNotification(Video $video, string $title, string $message): void
    {
        $user = $video->user;
        
        $user->addJobFailureNotification('ProcessInstantUploads', $title, $message, [
            'video_id' => $video->id,
            'video_title' => $video->title,
            'channel_name' => $video->channel->name,
            'error_details' => $message,
            'suggestion' => 'Please try uploading your video again. If the problem persists, contact our support team.',
        ]);
    }
} 