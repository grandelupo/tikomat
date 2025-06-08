<?php

namespace App\Http\Controllers;

use App\Models\Video;
use App\Models\SocialAccount;
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

        // Get user's videos with their targets
        $videos = Video::where('user_id', $user->id)
            ->with(['targets'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Get user's connected social accounts
        $socialAccounts = SocialAccount::where('user_id', $user->id)
            ->get()
            ->keyBy('platform');

        // Get platform connection status
        $platforms = [
            'youtube' => [
                'name' => 'YouTube',
                'connected' => isset($socialAccounts['youtube']),
                'icon' => 'youtube',
            ],
            'instagram' => [
                'name' => 'Instagram',
                'connected' => isset($socialAccounts['instagram']),
                'icon' => 'instagram',
            ],
            'tiktok' => [
                'name' => 'TikTok',
                'connected' => isset($socialAccounts['tiktok']),
                'icon' => 'tiktok',
            ],
        ];

        return Inertia::render('Dashboard', [
            'videos' => $videos,
            'platforms' => $platforms,
            'socialAccounts' => $socialAccounts,
        ]);
    }
}
