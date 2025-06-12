<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class UserUpgradeToPro extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:upgrade-to-pro {email : The email of the user to upgrade}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Upgrade a user to Pro status';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        
        $user = User::where('email', $email)->first();
        
        if (!$user) {
            $this->error("User with email {$email} not found.");
            return 1;
        }

        try {
            // Update user's subscription status
            $user->forceFill([
                'stripe_id' => 'manual_upgrade_' . time(),
                'stripe_subscription_id' => 'manual_sub_' . time(),
                'stripe_subscription_status' => 'active',
                'trial_ends_at' => null,
                'subscription_ends_at' => null,
            ])->save();

            $this->info("Successfully upgraded {$email} to Pro status!");
            return 0;
        } catch (\Exception $e) {
            $this->error("Failed to upgrade user: " . $e->getMessage());
            return 1;
        }
    }
} 