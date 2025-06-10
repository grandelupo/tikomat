<?php

namespace App\Console\Commands;

use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Console\Command;

class CheckSocialAccounts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'social:check-accounts {--user= : Check accounts for specific user ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check the status of social media accounts and their tokens';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔍 Checking social media accounts...');
        
        // Get users to check
        $users = $this->option('user') 
            ? User::where('id', $this->option('user'))->get()
            : User::all();
            
        if ($users->isEmpty()) {
            $this->error('No users found');
            return self::FAILURE;
        }
        
        foreach ($users as $user) {
            $this->info('');
            $this->info("👤 User: {$user->name} (ID: {$user->id})");
            
            $socialAccounts = SocialAccount::where('user_id', $user->id)->get();
            
            if ($socialAccounts->isEmpty()) {
                $this->warn('   No social accounts connected');
                continue;
            }
            
            foreach ($socialAccounts as $account) {
                $this->checkSocialAccount($account);
            }
        }
        
        return self::SUCCESS;
    }
    
    /**
     * Check a specific social account.
     */
    private function checkSocialAccount(SocialAccount $account): void
    {
        $platform = ucfirst($account->platform);
        $this->line("   📱 {$platform}:");
        
        // Check if tokens exist
        $hasAccessToken = !empty($account->access_token);
        $hasRefreshToken = !empty($account->refresh_token);
        
        $this->line("      Access Token: " . ($hasAccessToken ? '✅ Present' : '❌ Missing'));
        $this->line("      Refresh Token: " . ($hasRefreshToken ? '✅ Present' : '❌ Missing'));
        
        // Check token expiration
        if ($account->token_expires_at) {
            $isExpired = $account->token_expires_at->isPast();
            $expiresIn = $account->token_expires_at->diffForHumans();
            
            if ($isExpired) {
                $this->line("      Status: ❌ Expired ({$expiresIn})");
            } else {
                $this->line("      Status: ✅ Valid (expires {$expiresIn})");
            }
        } else {
            $this->line("      Status: ⚠️  No expiration set");
        }
        
        // Check if it's a development token
        if ($account->access_token === 'fake_token_for_development') {
            $this->line("      Type: 🧪 Development/Fake token");
        } else {
            $this->line("      Type: 🔑 Real OAuth token");
        }
        
        // Show recommendations
        if (!$hasAccessToken) {
            $this->warn("      ⚠️  Recommendation: Reconnect {$platform} account");
        } elseif (!$hasRefreshToken && $account->token_expires_at && $account->token_expires_at->isPast()) {
            $this->warn("      ⚠️  Recommendation: Reconnect {$platform} account (expired, no refresh token)");
        } elseif ($account->isTokenExpired() && !$hasRefreshToken) {
            $this->warn("      ⚠️  Recommendation: Reconnect {$platform} account (no refresh token available)");
        }
    }
} 