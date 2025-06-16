<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule workflow processing to run every 5 minutes
Schedule::command('workflows:process')->everyFiveMinutes();

// Schedule video processing to run every minute
Schedule::command('videos:process-uploads')->everyMinute();

// Schedule queue worker to process jobs (if using database queue)
Schedule::command('queue:work --stop-when-empty')->everyMinute();

// Optional: Clean up old failed jobs (weekly)
Schedule::command('queue:flush')->weekly();

// Optional: Log that scheduler is running (for debugging)
Schedule::call(function () {
    \Log::info('Laravel Scheduler is running at ' . now());
})->everyFiveMinutes();
