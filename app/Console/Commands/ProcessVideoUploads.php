<?php

namespace App\Console\Commands;

use App\Services\VideoUploadService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessVideoUploads extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'videos:process-uploads {--dry-run : Run without actually dispatching jobs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process pending video uploads to social media platforms';

    protected VideoUploadService $uploadService;

    /**
     * Create a new command instance.
     */
    public function __construct(VideoUploadService $uploadService)
    {
        parent::__construct();
        $this->uploadService = $uploadService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🎥 Processing pending video uploads...');

        if ($this->option('dry-run')) {
            $this->warn('Running in dry-run mode - no jobs will be dispatched');
        }

        try {
            if (!$this->option('dry-run')) {
                $this->uploadService->processPendingUploads();
            } else {
                // Just show what would be processed
                $pendingCount = \App\Models\VideoTarget::where('status', 'pending')
                    ->where(function ($query) {
                        $query->whereNull('publish_at')
                            ->orWhere('publish_at', '<=', now());
                    })
                    ->count();
                
                $this->info("Would process {$pendingCount} pending video targets");
            }

            $this->info('✅ Video upload processing completed successfully');
            return self::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Error processing video uploads: ' . $e->getMessage());
            Log::error('ProcessVideoUploads command failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return self::FAILURE;
        }
    }
} 