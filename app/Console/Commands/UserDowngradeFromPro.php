<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class UserDowngradeFromPro extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:downgrade {email : The email of the user to downgrade}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Downgrade a user from Pro status to free tier';

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
            // Remove subscription status
            $user->forceFill([
                'stripe_id' => null,
                'stripe_subscription_id' => null,
                'stripe_subscription_status' => null,
                'trial_ends_at' => null,
                'subscription_ends_at' => now(),
            ])->save();

            $this->info("Successfully downgraded {$email} to free tier!");
            return 0;
        } catch (\Exception $e) {
            $this->error("Failed to downgrade user: " . $e->getMessage());
            return 1;
        }
    }
} 