<?php

namespace App\Console\Commands;

use App\Models\Workflow;
use App\Models\Video;
use App\Models\VideoTarget;
use App\Services\PlatformVideoDetectionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessWorkflows extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'workflows:process {--dry-run : Run without actually creating video targets}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process active workflows to detect new videos and create sync targets';

    protected PlatformVideoDetectionService $detectionService;

    /**
     * Create a new command instance.
     */
    public function __construct(PlatformVideoDetectionService $detectionService)
    {
        parent::__construct();
        $this->detectionService = $detectionService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔄 Processing active workflows...');

        if ($this->option('dry-run')) {
            $this->warn('Running in dry-run mode - no video targets will be created');
        }

        try {
            $activeWorkflows = Workflow::where('is_active', true)
                ->with(['user', 'channel'])
                ->get();

            $this->info("Found {$activeWorkflows->count()} active workflows");

            $totalProcessed = 0;
            $totalNewTargets = 0;

            foreach ($activeWorkflows as $workflow) {
                $this->line("Processing workflow: {$workflow->name} (ID: {$workflow->id})");
                
                $result = $this->processWorkflow($workflow);
                $totalProcessed++;
                $totalNewTargets += $result['new_targets'];

                if ($result['new_targets'] > 0) {
                    $this->info("  ✅ Created {$result['new_targets']} new video targets");
                } else {
                    $this->line("  ℹ️  No new videos found");
                }
            }

            $this->info("✅ Workflow processing completed");
            $this->info("📊 Summary: Processed {$totalProcessed} workflows, created {$totalNewTargets} new video targets");

            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Error processing workflows: ' . $e->getMessage());
            Log::error('ProcessWorkflows command failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return self::FAILURE;
        }
    }

    /**
     * Process a single workflow.
     */
    protected function processWorkflow(Workflow $workflow): array
    {
        $newTargets = 0;

        try {
            // Detect new videos on the source platform
            $newVideos = $this->detectionService->detectNewVideos(
                $workflow->user,
                $workflow->channel,
                $workflow->source_platform,
                $workflow->last_run_at
            );

            foreach ($newVideos as $videoData) {
                if (!$this->option('dry-run')) {
                    // Create or update video record
                    $video = $this->createOrUpdateVideo($workflow, $videoData);

                    // Create video targets for each target platform
                    foreach ($workflow->getTargetPlatforms() as $targetPlatform) {
                        // Check if target already exists
                        $existingTarget = VideoTarget::where('video_id', $video->id)
                            ->where('platform', $targetPlatform)
                            ->first();

                        if (!$existingTarget) {
                            VideoTarget::create([
                                'video_id' => $video->id,
                                'platform' => $targetPlatform,
                                'status' => 'pending',
                                'publish_at' => now(), // Publish immediately
                                'platform_video_id' => null,
                                'platform_url' => null,
                            ]);
                            $newTargets++;

                            Log::info('Created video target for workflow', [
                                'workflow_id' => $workflow->id,
                                'video_id' => $video->id,
                                'platform' => $targetPlatform,
                                'source_platform' => $workflow->source_platform,
                            ]);
                        }
                    }
                } else {
                    // Dry run - just count what would be created
                    $newTargets += count($workflow->getTargetPlatforms());
                }
            }

            // Update workflow's last run time and increment processed count
            if (!$this->option('dry-run') && $newTargets > 0) {
                $workflow->update([
                    'last_run_at' => now(),
                    'videos_processed' => $workflow->videos_processed + count($newVideos),
                ]);
            }

        } catch (\Exception $e) {
            Log::error('Error processing workflow', [
                'workflow_id' => $workflow->id,
                'error' => $e->getMessage(),
            ]);
            
            $this->error("  ❌ Error processing workflow {$workflow->id}: " . $e->getMessage());
        }

        return ['new_targets' => $newTargets];
    }

    /**
     * Create or update video record from platform data.
     */
    protected function createOrUpdateVideo(Workflow $workflow, array $videoData): Video
    {
        // Check if video already exists (by platform video ID)
        $existingVideo = Video::where('user_id', $workflow->user_id)
            ->where('channel_id', $workflow->channel_id)
            ->whereHas('targets', function ($query) use ($workflow, $videoData) {
                $query->where('platform', $workflow->source_platform)
                      ->where('platform_video_id', $videoData['platform_video_id']);
            })
            ->first();

        if ($existingVideo) {
            return $existingVideo;
        }

        // Create new video record
        $video = Video::create([
            'user_id' => $workflow->user_id,
            'channel_id' => $workflow->channel_id,
            'title' => $videoData['title'],
            'description' => $videoData['description'] ?? null,
            'original_file_path' => null, // We don't have the original file for external videos
            'duration' => $videoData['duration'] ?? null,
            'thumbnail_path' => null,
            'video_width' => $videoData['width'] ?? null,
            'video_height' => $videoData['height'] ?? null,
        ]);

        // Create a video target for the source platform to track it
        VideoTarget::create([
            'video_id' => $video->id,
            'platform' => $workflow->source_platform,
            'status' => 'success', // Already published on source platform
            'platform_video_id' => $videoData['platform_video_id'],
            'platform_url' => $videoData['platform_url'] ?? null,
            'published_at' => $videoData['published_at'] ?? now(),
        ]);

        return $video;
    }
} 