<?php

namespace App\Console\Commands;

use App\Models\SocialAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupDuplicateSocialAccounts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'social:cleanup-duplicates {--dry-run : Show what would be deleted without actually deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up duplicate social accounts that might exist due to inconsistent deletion patterns';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔍 Checking for duplicate social accounts...');
        
        $isDryRun = $this->option('dry-run');
        
        if ($isDryRun) {
            $this->warn('DRY RUN MODE - No records will be deleted');
        }
        
        // Find duplicates based on user_id and platform (old constraint)
        $duplicates = DB::table('social_accounts')
            ->select('user_id', 'platform', DB::raw('COUNT(*) as count'))
            ->groupBy('user_id', 'platform')
            ->having('count', '>', 1)
            ->get();
            
        if ($duplicates->isEmpty()) {
            $this->info('✅ No duplicate social accounts found');
            return self::SUCCESS;
        }
        
        $this->warn("Found {$duplicates->count()} user+platform combinations with duplicates:");
        
        $totalDeleted = 0;
        
        foreach ($duplicates as $duplicate) {
            $this->line("User ID: {$duplicate->user_id}, Platform: {$duplicate->platform}, Count: {$duplicate->count}");
            
            // Get all records for this user+platform combination
            $accounts = SocialAccount::where('user_id', $duplicate->user_id)
                ->where('platform', $duplicate->platform)
                ->orderBy('created_at', 'desc') // Keep the most recent
                ->get();
                
            // Keep the first (most recent) one, delete the rest
            $toDelete = $accounts->skip(1);
            
            foreach ($toDelete as $account) {
                $this->line("  - Would delete: ID {$account->id}, Channel ID: {$account->channel_id}, Created: {$account->created_at}");
                
                if (!$isDryRun) {
                    $account->delete();
                    $totalDeleted++;
                }
            }
        }
        
        if ($isDryRun) {
            $this->info("Would delete {$totalDeleted} duplicate records");
        } else {
            $this->info("✅ Deleted {$totalDeleted} duplicate records");
        }
        
        return self::SUCCESS;
    }
} 