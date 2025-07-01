<?php

namespace App\Listeners;

use App\Models\User;
use App\Notifications\JobFailedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\Events\JobFailed;
use Illuminate\Support\Facades\Log;

class JobFailedListener implements ShouldQueue
{
    /**
     * Handle the event.
     */
    public function handle(JobFailed $event): void
    {
        try {
            // Get job details
            $jobName = class_basename($event->job->resolveName());
            $errorMessage = $event->exception->getMessage();
            $jobData = [
                'job_id' => $event->job->getJobId(),
                'queue' => $event->job->getQueue(),
                'attempts' => $event->job->attempts(),
                'exception' => [
                    'message' => $event->exception->getMessage(),
                    'file' => $event->exception->getFile(),
                    'line' => $event->exception->getLine(),
                ],
            ];

            // Get the job payload to extract user information if available
            $payload = $event->job->payload();
            $userId = null;

            // Try to extract user ID from job data
            if (isset($payload['data']['command'])) {
                $command = unserialize($payload['data']['command']);
                if (method_exists($command, 'getUserId')) {
                    $userId = $command->getUserId();
                } elseif (property_exists($command, 'userId')) {
                    $userId = $command->userId;
                } elseif (property_exists($command, 'user_id')) {
                    $userId = $command->user_id;
                }
            }

            // If we have a user ID, notify that specific user
            if ($userId) {
                $user = User::find($userId);
                if ($user) {
                    $user->notify(new JobFailedNotification($jobName, $errorMessage, $jobData));
                }
            } else {
                // Notify all admin users
                $adminUsers = User::where('is_admin', true)->get();
                foreach ($adminUsers as $adminUser) {
                    $adminUser->notify(new JobFailedNotification($jobName, $errorMessage, $jobData));
                }
            }

            // Log the failure
            Log::error('Job failed', [
                'job_name' => $jobName,
                'error_message' => $errorMessage,
                'user_id' => $userId,
                'job_data' => $jobData,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to create job failure notification', [
                'original_error' => $event->exception->getMessage(),
                'notification_error' => $e->getMessage(),
            ]);
        }
    }
} 