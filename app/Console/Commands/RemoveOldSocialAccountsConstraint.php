<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class RemoveOldSocialAccountsConstraint extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'social:remove-old-constraint {--dry-run : Show what would be done without actually doing it}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Remove the old unique constraint on social_accounts table that only includes user_id and platform';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔧 Checking for old unique constraint on social_accounts table...');
        
        $isDryRun = $this->option('dry-run');
        
        if ($isDryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
        }
        
        try {
            // Check if the constraint exists
            $constraints = DB::select("
                SELECT CONSTRAINT_NAME 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'social_accounts' 
                AND CONSTRAINT_TYPE = 'UNIQUE'
                AND CONSTRAINT_NAME = 'social_accounts_user_id_platform_unique'
            ");
            
            if (empty($constraints)) {
                $this->info('✅ Old unique constraint does not exist or has already been removed');
                return self::SUCCESS;
            }
            
            $this->warn('Found old unique constraint: social_accounts_user_id_platform_unique');
            
            if (!$isDryRun) {
                $this->info('Removing old unique constraint...');
                
                // Remove the constraint using raw SQL
                DB::statement('ALTER TABLE social_accounts DROP INDEX social_accounts_user_id_platform_unique');
                
                $this->info('✅ Old unique constraint removed successfully');
            } else {
                $this->info('Would remove constraint: social_accounts_user_id_platform_unique');
            }
            
            // Verify the constraint is gone
            $remainingConstraints = DB::select("
                SELECT CONSTRAINT_NAME 
                FROM information_schema.TABLE_CONSTRAINTS 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME = 'social_accounts' 
                AND CONSTRAINT_TYPE = 'UNIQUE'
                AND CONSTRAINT_NAME = 'social_accounts_user_id_platform_unique'
            ");
            
            if (empty($remainingConstraints)) {
                $this->info('✅ Verification: Old constraint has been successfully removed');
            } else {
                $this->error('❌ Verification failed: Old constraint still exists');
                return self::FAILURE;
            }
            
            return self::SUCCESS;
            
        } catch (\Exception $e) {
            $this->error('❌ Error removing constraint: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
} 