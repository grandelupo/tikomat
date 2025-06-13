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
            // Cancel all active subscriptions
            $activeSubscriptions = $user->subscriptions()->where('stripe_status', 'active')->get();
            
            if ($activeSubscriptions->isEmpty()) {
                $this->info("User {$email} doesn't have any active subscriptions.");
                return 0;
            }

            foreach ($activeSubscriptions as $subscription) {
                $subscription->update([
                    'stripe_status' => 'canceled',
                    'ends_at' => now(),
                ]);
            }

            $this->info("Successfully downgraded {$email} to free tier!");
            $this->info("Canceled {$activeSubscriptions->count()} subscription(s).");
            return 0;
        } catch (\Exception $e) {
            $this->error("Failed to downgrade user: " . $e->getMessage());
            return 1;
        }
    }
}