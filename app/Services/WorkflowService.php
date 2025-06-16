<?php

namespace App\Services;

use App\Models\Workflow;
use App\Models\Video;
use App\Models\VideoTarget;
use App\Models\User;
use App\Models\Channel;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class WorkflowService
{
    protected PlatformVideoDetectionService $detectionService;

    public function __construct(PlatformVideoDetectionService $detectionService)
    {
        $this->detectionService = $detectionService;
    }

    /**
     * Process all active workflows.
     */
    public function processAllWorkflows(bool $dryRun = false): array
    {
        $activeWorkflows = Workflow::where('is_active', true)
            ->with(['user', 'channel'])
            ->get();

        $results = [
            'total_workflows' => $activeWorkflows->count(),
            'processed_workflows' => 0,
            'total_new_targets' => 0,
            'errors' => [],
        ];

        foreach ($activeWorkflows as $workflow) {
            try {
                $result = $this->processWorkflow($workflow, $dryRun);
                $results['processed_workflows']++;
                $results['total_new_targets'] += $result['new_targets'];
            } catch (\Exception $e) {
                $results['errors'][] = [
                    'workflow_id' => $workflow->id,
                    'error' => $e->getMessage(),
                ];
                
                Log::error('Error processing workflow', [
                    'workflow_id' => $workflow->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $results;
    }

    /**
     * Process a single workflow.
     */
    public function processWorkflow(Workflow $workflow, bool $dryRun = false): array
    {
        Log::info('Processing workflow', [
            'workflow_id' => $workflow->id,
            'name' => $workflow->name,
            'source_platform' => $workflow->source_platform,
            'target_platforms' => $workflow->target_platforms,
        ]);

        // Detect new videos on the source platform
        $newVideos = $this->detectionService->detectNewVideos(
            $workflow->user,
            $workflow->channel,
            $workflow->source_platform,
            $workflow->last_run_at
        );

        $newTargets = 0;

        foreach ($newVideos as $videoData) {
            if (!$dryRun) {
                // Create or update video record
                $video = $this->createOrUpdateVideoFromWorkflow($workflow, $videoData);

                // Create video targets for each target platform
                foreach ($workflow->getTargetPlatforms() as $targetPlatform) {
                    if ($this->createVideoTarget($video, $targetPlatform)) {
                        $newTargets++;
                    }
                }
            } else {
                // Dry run - just count what would be created
                $newTargets += count($workflow->getTargetPlatforms());
            }
        }

        // Update workflow's last run time and increment processed count
        if (!$dryRun && count($newVideos) > 0) {
            $workflow->incrementVideosProcessed();
        }

        return [
            'new_videos' => count($newVideos),
            'new_targets' => $newTargets,
        ];
    }

    /**
     * Create or update video record from workflow detection.
     */
    protected function createOrUpdateVideoFromWorkflow(Workflow $workflow, array $videoData): Video
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
            Log::info('Video already exists, skipping creation', [
                'video_id' => $existingVideo->id,
                'platform_video_id' => $videoData['platform_video_id'],
            ]);
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

        Log::info('Created video from workflow', [
            'video_id' => $video->id,
            'workflow_id' => $workflow->id,
            'source_platform' => $workflow->source_platform,
            'platform_video_id' => $videoData['platform_video_id'],
        ]);

        return $video;
    }

    /**
     * Create a video target if it doesn't exist.
     */
    protected function createVideoTarget(Video $video, string $platform): bool
    {
        // Check if target already exists
        $existingTarget = VideoTarget::where('video_id', $video->id)
            ->where('platform', $platform)
            ->first();

        if ($existingTarget) {
            return false; // Target already exists
        }

        VideoTarget::create([
            'video_id' => $video->id,
            'platform' => $platform,
            'status' => 'pending',
            'publish_at' => now(), // Publish immediately
            'platform_video_id' => null,
            'platform_url' => null,
        ]);

        Log::info('Created video target from workflow', [
            'video_id' => $video->id,
            'platform' => $platform,
        ]);

        return true;
    }

    /**
     * Get workflow statistics.
     */
    public function getWorkflowStats(User $user): array
    {
        $workflows = Workflow::where('user_id', $user->id)->get();

        return [
            'total_workflows' => $workflows->count(),
            'active_workflows' => $workflows->where('is_active', true)->count(),
            'inactive_workflows' => $workflows->where('is_active', false)->count(),
            'total_videos_processed' => $workflows->sum('videos_processed'),
            'workflows_with_recent_activity' => $workflows->where('last_run_at', '>', now()->subDay())->count(),
        ];
    }

    /**
     * Validate workflow configuration.
     */
    public function validateWorkflow(array $workflowData): array
    {
        $errors = [];

        // Check if source platform is different from target platforms
        if (in_array($workflowData['source_platform'], $workflowData['target_platforms'] ?? [])) {
            $errors[] = 'Source platform cannot be the same as target platform';
        }

        // Check if user has connected accounts for all platforms
        if (isset($workflowData['channel_id'])) {
            $channel = Channel::find($workflowData['channel_id']);
            if ($channel) {
                $connectedPlatforms = $channel->socialAccounts->pluck('platform')->toArray();
                
                // Check source platform
                if (!in_array($workflowData['source_platform'], $connectedPlatforms)) {
                    $errors[] = "Source platform '{$workflowData['source_platform']}' is not connected";
                }

                // Check target platforms
                foreach ($workflowData['target_platforms'] ?? [] as $platform) {
                    if (!in_array($platform, $connectedPlatforms)) {
                        $errors[] = "Target platform '{$platform}' is not connected";
                    }
                }
            }
        }

        return $errors;
    }

    /**
     * Pause/Resume workflow.
     */
    public function toggleWorkflow(Workflow $workflow): bool
    {
        $workflow->update(['is_active' => !$workflow->is_active]);
        
        Log::info('Workflow toggled', [
            'workflow_id' => $workflow->id,
            'is_active' => $workflow->is_active,
        ]);

        return $workflow->is_active;
    }

    /**
     * Get workflow performance metrics.
     */
    public function getWorkflowMetrics(Workflow $workflow): array
    {
        $videos = Video::where('user_id', $workflow->user_id)
            ->where('channel_id', $workflow->channel_id)
            ->whereHas('targets', function ($query) use ($workflow) {
                $query->where('platform', $workflow->source_platform);
            })
            ->with('targets')
            ->get();

        $totalTargets = 0;
        $successfulTargets = 0;
        $failedTargets = 0;
        $pendingTargets = 0;

        foreach ($videos as $video) {
            foreach ($video->targets as $target) {
                if (in_array($target->platform, $workflow->getTargetPlatforms())) {
                    $totalTargets++;
                    switch ($target->status) {
                        case 'success':
                            $successfulTargets++;
                            break;
                        case 'failed':
                            $failedTargets++;
                            break;
                        case 'pending':
                        case 'processing':
                            $pendingTargets++;
                            break;
                    }
                }
            }
        }

        return [
            'total_videos' => $videos->count(),
            'total_targets' => $totalTargets,
            'successful_targets' => $successfulTargets,
            'failed_targets' => $failedTargets,
            'pending_targets' => $pendingTargets,
            'success_rate' => $totalTargets > 0 ? round(($successfulTargets / $totalTargets) * 100, 2) : 0,
        ];
    }
} 