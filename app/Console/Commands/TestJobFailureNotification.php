<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\JobFailedNotification;
use Illuminate\Console\Command;

class TestJobFailureNotification extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:job-failure-notification {user_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test the job failure notification system';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $userId = $this->argument('user_id');
        
        if ($userId) {
            $user = User::find($userId);
            if (!$user) {
                $this->error("User with ID {$userId} not found.");
                return 1;
            }
        } else {
            $user = User::first();
            if (!$user) {
                $this->error("No users found in the database.");
                return 1;
            }
        }

        $this->info("Sending test job failure notification to user: {$user->name} ({$user->email})");

        $user->notify(new JobFailedNotification(
            'TestVideoUploadJob',
            'This is a test error message for demonstration purposes.',
            [
                'video_id' => 123,
                'platform' => 'youtube',
                'test_data' => true,
            ]
        ));

        $this->info('Test notification sent successfully!');
        $this->info('Check the notifications dropdown in the UI to see the notification.');

        return 0;
    }
} 