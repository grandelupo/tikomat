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
        $query = User::query();

        // Filter by subscription status if requested
        if ($this->option('pro')) {
            $query->whereNotNull('stripe_subscription_id')
                  ->where('stripe_subscription_status', 'active');
        } elseif ($this->option('free')) {
            $query->where(function($q) {
                $q->whereNull('stripe_subscription_id')
                  ->orWhere('stripe_subscription_status', '!=', 'active');
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
            $rows[] = [
                $user->id,
                $user->name,
                $user->email,
                $user->stripe_subscription_status === 'active' ? 'Pro' : 'Free',
                $user->stripe_subscription_id ?? 'N/A',
                $user->created_at->format('Y-m-d H:i:s'),
            ];
        }

        $this->table($headers, $rows);
        $this->info("\nTotal users: " . count($rows));
        
        return 0;
    }
} 