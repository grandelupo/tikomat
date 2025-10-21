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
                $data = [
                    'id' => $account->id,
                    'platform' => $account->platform,
                    'channel_id' => $account->channel_id,
                    'channel_name' => $account->channel->name ?? 'Unknown Channel',
                    'created_at' => $account->created_at,
                ];

                // Add Facebook page information if available
                if ($account->platform === 'facebook' && !empty($account->facebook_page_name)) {
                    $data['facebook_page_name'] = $account->facebook_page_name;
                    $data['facebook_page_id'] = $account->facebook_page_id;
                }

                // Add profile information for all platforms
                if (!empty($account->profile_name)) {
                    $data['profile_name'] = $account->profile_name;
                }
                if (!empty($account->profile_avatar_url)) {
                    $data['profile_avatar_url'] = $account->profile_avatar_url;
                }
                if (!empty($account->profile_username)) {
                    $data['profile_username'] = $account->profile_username;
                }

                // Add platform-specific channel information
                if (!empty($account->platform_channel_name)) {
                    $data['platform_channel_name'] = $account->platform_channel_name;
                }
                if (!empty($account->platform_channel_handle)) {
                    $data['platform_channel_handle'] = $account->platform_channel_handle;
                }
                if (!empty($account->platform_channel_url)) {
                    $data['platform_channel_url'] = $account->platform_channel_url;
                }
                
                // Add YouTube channel thumbnail URL if available
                if ($account->platform === 'youtube' && !empty($account->platform_channel_data)) {
                    $channelData = is_array($account->platform_channel_data) ? $account->platform_channel_data : json_decode($account->platform_channel_data, true);
                    if (!empty($channelData['thumbnail_url'])) {
                        $data['platform_channel_thumbnail_url'] = $channelData['thumbnail_url'];
                    }
                }
                
                $data['platform_channel_specific'] = $account->is_platform_channel_specific ?? false;

                // Add Instagram compatibility information
                if ($account->platform === 'instagram') {
                    $data['instagram_upload_compatible'] = $account->isInstagramUploadCompatible();
                    $data['instagram_incompatibility_reason'] = $account->getInstagramIncompatibilityReason();
                }

                return $data;
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