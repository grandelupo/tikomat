<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Video;
use App\Services\VideoProcessingService;
use Illuminate\Support\Facades\Storage;

class UpdateVideoDimensions extends Command
{
    protected $signature = 'videos:update-dimensions {--dry-run : Show what would be updated without making changes}';
    protected $description = 'Update video dimensions for existing videos that have null width/height';

    private VideoProcessingService $videoService;

    public function __construct(VideoProcessingService $videoService)
    {
        parent::__construct();
        $this->videoService = $videoService;
    }

    public function handle()
    {
        $isDryRun = $this->option('dry-run');
        
        if ($isDryRun) {
            $this->info('Running in dry-run mode - no changes will be made');
        }

        // Find videos with null dimensions
        $videosWithoutDimensions = Video::whereNull('video_width')
            ->orWhereNull('video_height')
            ->orderBy('created_at', 'desc')
            ->get();

        if ($videosWithoutDimensions->isEmpty()) {
            $this->info('No videos found with missing dimensions.');
            return 0;
        }

        $this->info("Found {$videosWithoutDimensions->count()} videos with missing dimensions.");
        
        $updated = 0;
        $failed = 0;

        foreach ($videosWithoutDimensions as $video) {
            $this->line("Processing video: {$video->title} (ID: {$video->id})");

            try {
                if (!$video->original_file_path) {
                    $this->warn("  ⚠️ No file path available for video {$video->id}");
                    $failed++;
                    continue;
                }

                $videoPath = Storage::path($video->original_file_path);
                
                if (!file_exists($videoPath)) {
                    $this->warn("  ⚠️ Video file not found: {$videoPath}");
                    $failed++;
                    continue;
                }

                // Get video information
                $videoInfo = $this->videoService->getVideoInfo($videoPath);
                
                if ($videoInfo['width'] > 0 && $videoInfo['height'] > 0) {
                    if (!$isDryRun) {
                        $video->update([
                            'video_width' => $videoInfo['width'],
                            'video_height' => $videoInfo['height'],
                        ]);
                    }
                    
                    $this->info("  ✅ Updated dimensions: {$videoInfo['width']}x{$videoInfo['height']}");
                    $updated++;
                } else {
                    $this->warn("  ⚠️ Could not extract valid dimensions");
                    $failed++;
                }

            } catch (\Exception $e) {
                $this->error("  ❌ Error processing video {$video->id}: " . $e->getMessage());
                $failed++;
            }
        }

        $this->newLine();
        if ($isDryRun) {
            $this->info("Dry run completed:");
            $this->info("  - Videos that would be updated: {$updated}");
            $this->info("  - Videos that would fail: {$failed}");
            $this->info("Run without --dry-run to apply changes.");
        } else {
            $this->info("Update completed:");
            $this->info("  - Videos updated: {$updated}");
            $this->info("  - Videos failed: {$failed}");
        }

        return 0;
    }
} 