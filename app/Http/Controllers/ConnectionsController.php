<?php

namespace App\Http\Controllers;

use App\Models\Channel;
use App\Models\SocialAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ConnectionsController extends Controller
{
    /**
     * Display the connections page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Get all user channels
        $channels = $user->channels()
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($channel) {
                return [
                    'id' => $channel->id,
                    'name' => $channel->name,
                    'description' => $channel->description,
                    'slug' => $channel->slug,
                    'is_default' => $channel->is_default,
                ];
            });

        // Get all social accounts across all channels
        $socialAccounts = SocialAccount::where('user_id', $user->id)
            ->with('channel:id,name')
            ->get()
            ->map(function ($account) {
                return [
                    'id' => $account->id,
                    'platform' => $account->platform,
                    'channel_id' => $account->channel_id,
                    'channel_name' => $account->channel->name ?? 'Unknown Channel',
                    'created_at' => $account->created_at,
                ];
            });

        // Available platforms based on subscription
        $allowedPlatforms = $user->getAllowedPlatforms();
        
        $availablePlatforms = collect(['youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'pinterest', 'x'])
            ->map(function ($platform) use ($allowedPlatforms, $socialAccounts) {
                $connectedCount = $socialAccounts->where('platform', $platform)->count();
                
                return [
                    'name' => $platform,
                    'label' => ucfirst($platform),
                    'allowed' => in_array($platform, $allowedPlatforms),
                    'connected' => $connectedCount > 0,
                    'connected_count' => $connectedCount,
                ];
            });

        return Inertia::render('Connections', [
            'channels' => $channels,
            'socialAccounts' => $socialAccounts,
            'availablePlatforms' => $availablePlatforms,
            'allowedPlatforms' => $allowedPlatforms,
        ]);
    }
} 