<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Services\VideoUploadService;
use App\Services\VideoRemovalErrorHandler;
use App\Models\VideoTarget;

class RetryFailedVideoRemovals extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'videos:retry-failed-removals 
                           {--platform= : Only retry removals for specific platform}
                           {--max-age=24 : Maximum age in hours for failed jobs to retry}
                           {--dry-run : Show what would be retried without actually doing it}';

    /**
     * The console command description.
     */
    protected $description = 'Retry failed video removal jobs with intelligent retry logic';

    protected VideoUploadService $uploadService;
    protected VideoRemovalErrorHandler $errorHandler;

    public function __construct(VideoUploadService $uploadService, VideoRemovalErrorHandler $errorHandler)
    {
        parent::__construct();
        $this->uploadService = $uploadService;
        $this->errorHandler = $errorHandler;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $platform = $this->option('platform');
        $maxAge = (int) $this->option('max-age');
        $dryRun = $this->option('dry-run');

        $this->info('Checking for failed video removal jobs...');

        // Get failed jobs from the failed_jobs table
        $failedJobs = $this->getFailedRemovalJobs($platform, $maxAge);

        if ($failedJobs->isEmpty()) {
            $this->info('No failed video removal jobs found to retry.');
            return 0;
        }

        $this->info("Found {$failedJobs->count()} failed video removal jobs.");

        $retried = 0;
        $skipped = 0;

        foreach ($failedJobs as $failedJob) {
            $payload = json_decode($failedJob->payload, true);
            $jobData = unserialize($payload['data']['command']);
            
            if (!isset($jobData->videoTarget)) {
                $this->warn("Skipping job {$failedJob->id}: No video target data found");
                $skipped++;
                continue;
            }

            $targetId = $jobData->videoTarget->id;
            $platform = $jobData->videoTarget->platform;

            // Check if the video target still exists
            $target = VideoTarget::find($targetId);
            if (!$target) {
                $this->info("Skipping job {$failedJob->id}: Video target {$targetId} no longer exists");
                $this->deleteFailedJob($failedJob->id, $dryRun);
                $skipped++;
                continue;
            }

            // Analyze the error to determine if it's retryable
            $exception = new \Exception($failedJob->exception);
            $errorInfo = $this->errorHandler->handleError($exception, $platform, $targetId);

            if (!$this->errorHandler->isRetryable($errorInfo['type'])) {
                $this->warn("Skipping job {$failedJob->id}: Error type '{$errorInfo['type']}' is not retryable");
                $skipped++;
                continue;
            }

            // Check if enough time has passed for retry
            $retryDelay = $this->errorHandler->getRetryDelay($errorInfo['type']);
            $failedAt = \Carbon\Carbon::parse($failedJob->failed_at);
            $canRetryAt = $failedAt->addSeconds($retryDelay);

            if (now()->isBefore($canRetryAt)) {
                $this->info("Skipping job {$failedJob->id}: Too early to retry (can retry at {$canRetryAt})");
                $skipped++;
                continue;
            }

            // Retry the job
            if ($dryRun) {
                $this->info("DRY RUN: Would retry removal job for target {$targetId} on {$platform}");
            } else {
                try {
                    $this->uploadService->dispatchRemovalJob($target);
                    $this->deleteFailedJob($failedJob->id, false);
                    $this->info("Retried removal job for target {$targetId} on {$platform}");
                    $retried++;
                } catch (\Exception $e) {
                    $this->error("Failed to retry job {$failedJob->id}: " . $e->getMessage());
                    $skipped++;
                }
            }
        }

        if ($dryRun) {
            $this->info("DRY RUN: Would retry {$retried} jobs, skip {$skipped} jobs");
        } else {
            $this->info("Retried {$retried} jobs, skipped {$skipped} jobs");
            
            if ($retried > 0) {
                Log::info('Video removal retry command completed', [
                    'retried' => $retried,
                    'skipped' => $skipped,
                    'platform_filter' => $platform,
                    'max_age_hours' => $maxAge,
                ]);
            }
        }

        return 0;
    }

    /**
     * Get failed video removal jobs.
     */
    protected function getFailedRemovalJobs(?string $platform, int $maxAge)
    {
        $query = DB::table('failed_jobs')
            ->where('payload', 'like', '%RemoveVideoFrom%')
            ->where('failed_at', '>=', now()->subHours($maxAge))
            ->orderBy('failed_at', 'asc');

        if ($platform) {
            $query->where('payload', 'like', "%RemoveVideoFrom" . ucfirst($platform) . "%");
        }

        return $query->get();
    }

    /**
     * Delete a failed job.
     */
    protected function deleteFailedJob(string $jobId, bool $dryRun): void
    {
        if (!$dryRun) {
            DB::table('failed_jobs')->where('id', $jobId)->delete();
        }
    }
} 