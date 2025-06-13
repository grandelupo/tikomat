<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class UserList extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:list {--pro : Show only Pro users} {--free : Show only free users}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'List all users with their subscription status';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $query = User::with(['subscriptions' => function($q) {
            $q->where('stripe_status', 'active');
        }]);

        // Filter by subscription status if requested
        if ($this->option('pro')) {
            $query->whereHas('subscriptions', function($q) {
                $q->where('stripe_status', 'active');
            });
        } elseif ($this->option('free')) {
            $query->whereDoesntHave('subscriptions', function($q) {
                $q->where('stripe_status', 'active');
            });
        }

        $users = $query->get();

        if ($users->isEmpty()) {
            $this->info('No users found.');
            return 0;
        }

        $headers = ['ID', 'Name', 'Email', 'Status', 'Subscription ID', 'Created At'];
        $rows = [];

        foreach ($users as $user) {
            $activeSubscription = $user->subscriptions->where('stripe_status', 'active')->first();
            
            $rows[] = [
                $user->id,
                $user->name,
                $user->email,
                $activeSubscription ? 'Pro' : 'Free',
                $activeSubscription ? $activeSubscription->stripe_id : 'N/A',
                $user->created_at->format('Y-m-d H:i:s'),
            ];
        }

        $this->table($headers, $rows);
        $this->info("\nTotal users: " . count($rows));
        
        $proCount = collect($rows)->where(3, 'Pro')->count();
        $freeCount = collect($rows)->where(3, 'Free')->count();
        
        $this->info("Pro users: {$proCount}");
        $this->info("Free users: {$freeCount}");
        
        return 0;
    }
} 