<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Subscription;
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
            // Check if user already has an active subscription
            $existingSubscription = $user->subscriptions()->where('stripe_status', 'active')->first();
            
            if ($existingSubscription) {
                $this->info("User {$email} already has an active Pro subscription!");
                return 0;
            }

            // Create or update subscription with indefinite timeframe
            $subscription = $user->subscriptions()->updateOrCreate(
                ['name' => 'default'],
                [
                    'stripe_id' => 'manual_upgrade_' . time(),
                    'stripe_status' => 'active',
                    'stripe_price' => 'price_pro_monthly',
                    'quantity' => 1,
                    'trial_ends_at' => null,
                    'ends_at' => null, // null means indefinite
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );

            // Update user's stripe_id if not set
            if (!$user->stripe_id) {
                $user->update(['stripe_id' => 'cus_manual_' . time()]);
            }

            $this->info("Successfully upgraded {$email} to Pro status with indefinite subscription!");
            return 0;
        } catch (\Exception $e) {
            $this->error("Failed to upgrade user: " . $e->getMessage());
            return 1;
        }
    }
} 