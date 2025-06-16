<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Process workflows every 5 minutes to detect new videos
        $schedule->command('workflows:process')
                 ->everyFiveMinutes()
                 ->withoutOverlapping()
                 ->runInBackground();

        // Process pending video uploads every minute
        $schedule->command('videos:process-uploads')
                 ->everyMinute()
                 ->withoutOverlapping()
                 ->runInBackground();

        // Process the queue every minute
        $schedule->command('queue:work --stop-when-empty')
                 ->everyMinute()
                 ->withoutOverlapping()
                 ->runInBackground();

        // Clean up failed jobs weekly
        $schedule->command('queue:flush')
                 ->weekly()
                 ->sundays()
                 ->at('02:00');

        // Log scheduler activity for monitoring
        $schedule->call(function () {
            \Log::info('Laravel Scheduler heartbeat', [
                'timestamp' => now()->toISOString(),
                'memory_usage' => memory_get_usage(true),
            ]);
        })->everyFiveMinutes();

        // Optional: Clean up old logs monthly
        $schedule->command('log:clear')
                 ->monthly()
                 ->when(function () {
                     return config('app.env') === 'production';
                 });
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
} 