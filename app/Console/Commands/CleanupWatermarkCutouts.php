<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\AIWatermarkRemoverService;

class CleanupWatermarkCutouts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'watermark:cleanup-cutouts {--hours=24 : Maximum age in hours for cutout images}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up old watermark cutout images to save disk space';

    /**
     * Execute the console command.
     */
    public function handle(AIWatermarkRemoverService $watermarkService): int
    {
        $maxAgeHours = (int) $this->option('hours');
        
        $this->info("Cleaning up watermark cutout images older than {$maxAgeHours} hours...");
        
        $watermarkService->cleanupOldCutouts($maxAgeHours);
        
        $this->info('Cleanup completed successfully.');
        
        return Command::SUCCESS;
    }
} 