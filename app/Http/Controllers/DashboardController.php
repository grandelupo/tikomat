<?php

namespace App\Http\Controllers;

use App\Models\Channel;
use App\Models\SocialAccount;
use App\Models\Video;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        
        // Get or create default channel for the user
        $defaultChannel = $user->channels()->where('is_default', true)->first();
        
        if (!$defaultChannel) {
            $defaultChannel = $user->channels()->create([
                'name' => $user->name . "'s Channel",
                'description' => 'Default channel for ' . $user->name,
                'is_default' => true,
                'default_platforms' => ['youtube']
            ]);
        }

        // Get all user channels
        $channels = $user->channels()
            ->withCount(['socialAccounts', 'videos'])
            ->with(['socialAccounts' => function ($query) {
                $query->select('id', 'channel_id', 'platform');
            }])
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
                    'social_accounts_count' => $channel->social_accounts_count,
                    'videos_count' => $channel->videos_count,
                    'connected_platforms' => $channel->socialAccounts->pluck('platform')->toArray(),
                    'default_platforms' => $channel->default_platforms_list,
                ];
            });

        // Get recent videos across all channels
        $recentVideos = Video::where('user_id', $user->id)
            ->with(['channel:id,name', 'videoTargets'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($video) {
                return [
                    'id' => $video->id,
                    'title' => $video->title,
                    'description' => $video->description,
                    'duration' => $video->duration,
                    'thumbnail_path' => $video->thumbnail_path,
                    'created_at' => $video->created_at,
                    'channel' => $video->channel,
                    'targets' => $video->videoTargets->map(function ($target) {
                        return [
                            'platform' => $target->platform,
                            'status' => $target->status,
                            'error_message' => $target->error_message,
                            'publish_at' => $target->publish_at,
                        ];
                    }),
                ];
            });

        // Get subscription info and allowed platforms
        $allowedPlatforms = $user->getAllowedPlatforms();
        $canCreateChannel = $user->canCreateChannel();

        return Inertia::render('Dashboard', [
            'channels' => $channels,
            'defaultChannel' => [
                'id' => $defaultChannel->id,
                'name' => $defaultChannel->name,
                'slug' => $defaultChannel->slug,
            ],
            'recentVideos' => $recentVideos,
            'subscription' => $user->hasActiveSubscription() ? [
                'status' => 'active',
                'is_active' => true,
                'max_channels' => $user->getMaxChannels(),
                'monthly_cost' => $user->getMonthlyCost(),
            ] : null,
            'allowedPlatforms' => $allowedPlatforms,
            'canCreateChannel' => $canCreateChannel,
            'stats' => [
                'totalChannels' => $channels->count(),
                'totalVideos' => $recentVideos->count(),
                'connectedPlatforms' => $channels->flatMap(function ($channel) {
                    return $channel['connected_platforms'];
                })->unique()->count(),
            ],
        ]);
    }

    public function channel(Request $request, Channel $channel)
    {
        // Ensure user owns this channel
        if ($channel->user_id !== $request->user()->id) {
            abort(403);
        }

        $user = $request->user();

        // Get social accounts for this channel
        $socialAccounts = $channel->socialAccounts()
            ->get()
            ->map(function ($account) {
                return [
                    'id' => $account->id,
                    'platform' => $account->platform,
                    'created_at' => $account->created_at,
                ];
            });

        // Get videos for this channel
        $videos = $channel->videos()
            ->with('videoTargets')
            ->orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(function ($video) {
                return [
                    'id' => $video->id,
                    'title' => $video->title,
                    'description' => $video->description,
                    'duration' => $video->duration,
                    'thumbnail_path' => $video->thumbnail_path,
                    'created_at' => $video->created_at,
                    'targets' => $video->videoTargets->map(function ($target) {
                        return [
                            'platform' => $target->platform,
                            'status' => $target->status,
                            'error_message' => $target->error_message,
                            'publish_at' => $target->publish_at,
                        ];
                    }),
                ];
            });

        // Available platforms based on subscription
        $allowedPlatforms = $user->getAllowedPlatforms();
        $connectedPlatforms = $socialAccounts->pluck('platform')->toArray();
        
        $availablePlatforms = collect(['youtube', 'instagram', 'tiktok'])
            ->map(function ($platform) use ($allowedPlatforms, $connectedPlatforms) {
                return [
                    'name' => $platform,
                    'label' => ucfirst($platform),
                    'allowed' => in_array($platform, $allowedPlatforms),
                    'connected' => in_array($platform, $connectedPlatforms),
                    'coming_soon' => !in_array($platform, $allowedPlatforms),
                ];
            });

        return Inertia::render('Channel/Show', [
            'channel' => [
                'id' => $channel->id,
                'name' => $channel->name,
                'description' => $channel->description,
                'slug' => $channel->slug,
                'is_default' => $channel->is_default,
                'default_platforms' => $channel->default_platforms_list,
            ],
            'socialAccounts' => $socialAccounts,
            'videos' => $videos,
            'availablePlatforms' => $availablePlatforms,
            'allowedPlatforms' => $allowedPlatforms,
        ]);
    }
}
