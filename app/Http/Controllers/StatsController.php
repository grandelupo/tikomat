<?php

namespace App\Http\Controllers;

use App\Models\Video;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * Display the stats dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        
        // Basic stats
        $totalChannels = $user->channels()->count();
        $totalVideos = $user->videos()->count();
        $connectedPlatforms = $user->channels()
            ->with('socialAccounts')
            ->get()
            ->flatMap(function ($channel) {
                return $channel->socialAccounts->pluck('platform');
            })
            ->unique()
            ->count();

        // Video status stats
        $videoStats = $user->videos()
            ->with('videoTargets')
            ->get()
            ->flatMap(function ($video) {
                return $video->videoTargets;
            })
            ->groupBy('status')
            ->map(function ($targets) {
                return $targets->count();
            });

        // Platform distribution
        $platformStats = $user->videos()
            ->with('videoTargets')
            ->get()
            ->flatMap(function ($video) {
                return $video->videoTargets;
            })
            ->groupBy('platform')
            ->map(function ($targets) {
                return [
                    'total' => $targets->count(),
                    'success' => $targets->where('status', 'success')->count(),
                    'failed' => $targets->where('status', 'failed')->count(),
                    'pending' => $targets->where('status', 'pending')->count(),
                    'processing' => $targets->where('status', 'processing')->count(),
                ];
            });

        // Recent activity (last 30 days)
        $recentActivity = $user->videos()
            ->where('created_at', '>=', now()->subDays(30))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(function ($item) {
                return [
                    'date' => $item->date,
                    'count' => $item->count,
                ];
            });

        // Channel performance
        $channelStats = $user->channels()
            ->withCount(['videos', 'socialAccounts'])
            ->with(['videos' => function ($query) {
                $query->with('videoTargets');
            }])
            ->get()
            ->map(function ($channel) {
                $totalUploads = $channel->videos->flatMap(function ($video) {
                    return $video->videoTargets;
                })->count();

                $successfulUploads = $channel->videos->flatMap(function ($video) {
                    return $video->videoTargets->where('status', 'success');
                })->count();

                return [
                    'id' => $channel->id,
                    'name' => $channel->name,
                    'videos_count' => $channel->videos_count,
                    'social_accounts_count' => $channel->social_accounts_count,
                    'total_uploads' => $totalUploads,
                    'successful_uploads' => $successfulUploads,
                    'success_rate' => $totalUploads > 0 ? round(($successfulUploads / $totalUploads) * 100, 1) : 0,
                ];
            });

        return Inertia::render('Stats', [
            'stats' => [
                'overview' => [
                    'totalChannels' => $totalChannels,
                    'totalVideos' => $totalVideos,
                    'connectedPlatforms' => $connectedPlatforms,
                    'totalUploads' => $videoStats->sum(),
                ],
                'videoStatus' => [
                    'success' => $videoStats->get('success', 0),
                    'failed' => $videoStats->get('failed', 0),
                    'pending' => $videoStats->get('pending', 0),
                    'processing' => $videoStats->get('processing', 0),
                ],
                'platforms' => $platformStats,
                'recentActivity' => $recentActivity,
                'channels' => $channelStats,
            ],
            'subscription' => $user->hasActiveSubscription() ? [
                'status' => 'active',
                'is_active' => true,
                'max_channels' => $user->getMaxChannels(),
                'monthly_cost' => $user->getMonthlyCost(),
            ] : null,
            'allowedPlatforms' => $user->getAllowedPlatforms(),
        ]);
    }
}
