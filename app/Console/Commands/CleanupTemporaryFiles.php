<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CleanupTemporaryFiles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cleanup:temp-files {--hours=24 : Hours after which to delete temporary files}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up temporary files created for social media uploads';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $hours = (int) $this->option('hours');
        $cutoffTime = Carbon::now()->subHours($hours);
        
        $this->info("Cleaning up temporary files older than {$hours} hours...");
        
        $deletedCount = 0;
        
        // Clean up Facebook temporary files
        $facebookTempPath = 'temp/facebook';
        if (Storage::disk('public')->exists($facebookTempPath)) {
            $files = Storage::disk('public')->files($facebookTempPath);
            
            foreach ($files as $file) {
                try {
                    $lastModified = Carbon::createFromTimestamp(Storage::disk('public')->lastModified($file));
                    
                    if ($lastModified->lt($cutoffTime)) {
                        Storage::disk('public')->delete($file);
                        $deletedCount++;
                        $this->line("Deleted: {$file}");
                        
                        Log::info('Temporary file cleaned up by scheduled task', [
                            'file' => $file,
                            'last_modified' => $lastModified->toISOString(),
                            'cutoff_time' => $cutoffTime->toISOString(),
                        ]);
                    }
                } catch (\Exception $e) {
                    $this->error("Failed to process file {$file}: " . $e->getMessage());
                    Log::error('Failed to clean up temporary file', [
                        'file' => $file,
                        'error' => $e->getMessage(),
                    ]);
                }
            }
        }
        
        // Clean up other temporary directories as needed
        $otherTempPaths = ['temp/instagram', 'temp/youtube', 'temp/tiktok'];
        foreach ($otherTempPaths as $tempPath) {
            if (Storage::disk('public')->exists($tempPath)) {
                $files = Storage::disk('public')->files($tempPath);
                
                foreach ($files as $file) {
                    try {
                        $lastModified = Carbon::createFromTimestamp(Storage::disk('public')->lastModified($file));
                        
                        if ($lastModified->lt($cutoffTime)) {
                            Storage::disk('public')->delete($file);
                            $deletedCount++;
                            $this->line("Deleted: {$file}");
                            
                            Log::info('Temporary file cleaned up by scheduled task', [
                                'file' => $file,
                                'last_modified' => $lastModified->toISOString(),
                                'cutoff_time' => $cutoffTime->toISOString(),
                            ]);
                        }
                    } catch (\Exception $e) {
                        $this->error("Failed to process file {$file}: " . $e->getMessage());
                        Log::error('Failed to clean up temporary file', [
                            'file' => $file,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }
            }
        }
        
        $this->info("Cleanup completed. Deleted {$deletedCount} temporary files.");
        
        Log::info('Temporary files cleanup completed', [
            'deleted_count' => $deletedCount,
            'hours_threshold' => $hours,
            'cutoff_time' => $cutoffTime->toISOString(),
        ]);
        
        return 0;
    }
}
