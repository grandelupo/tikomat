<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Channel;
use App\Models\SocialAccount;
use App\Models\Video;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CreateDefaultChannelsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default channels for existing users
        $users = User::whereDoesntHave('channels')->get();
        
        foreach ($users as $user) {
            $channel = $user->channels()->create([
                'name' => $user->name . "'s Channel",
                'description' => 'Default channel for ' . $user->name,
                'is_default' => true,
                'default_platforms' => ['youtube']
            ]);

            // Move existing social accounts to the default channel
            SocialAccount::where('user_id', $user->id)
                ->whereNull('channel_id')
                ->update(['channel_id' => $channel->id]);

            // Move existing videos to the default channel
            Video::where('user_id', $user->id)
                ->whereNull('channel_id')
                ->update(['channel_id' => $channel->id]);
        }

        // Set allowed platforms for existing users (YouTube only for free users)
        User::whereNull('allowed_platforms')->update([
            'allowed_platforms' => ['youtube'],
            'has_subscription' => false
        ]);
    }
}
