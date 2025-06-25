<?php

namespace App\Services;

use App\Models\User;
use App\Models\Channel;
use App\Models\SocialAccount;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PlatformVideoDetectionService
{
    /**
     * Detect new videos on a platform since the last check.
     */
    public function detectNewVideos(User $user, Channel $channel, string $platform, ?Carbon $lastRunAt = null): array
    {
        Log::info('Detecting new videos', [
            'user_id' => $user->id,
            'channel_id' => $channel->id,
            'platform' => $platform,
            'last_run_at' => $lastRunAt?->toISOString(),
        ]);

        // Get social account for the platform
        $socialAccount = SocialAccount::where('user_id', $user->id)
            ->where('channel_id', $channel->id)
            ->where('platform', $platform)
            ->first();

        if (!$socialAccount) {
            Log::warning('No social account found for platform', [
                'user_id' => $user->id,
                'channel_id' => $channel->id,
                'platform' => $platform,
            ]);
            return [];
        }

        // Check if we're in development mode
        if ($socialAccount->access_token === 'fake_token_for_development') {
            return $this->generateFakeVideos($platform, $lastRunAt);
        }

        // Detect videos based on platform
        switch ($platform) {
            case 'youtube':
                return $this->detectYouTubeVideos($socialAccount, $lastRunAt);
            case 'instagram':
                return $this->detectInstagramVideos($socialAccount, $lastRunAt);
            case 'tiktok':
                return $this->detectTikTokVideos($socialAccount, $lastRunAt);
            case 'facebook':
                return $this->detectFacebookVideos($socialAccount, $lastRunAt);
            case 'x':
                return $this->detectTwitterVideos($socialAccount, $lastRunAt);
            case 'snapchat':
                return $this->detectSnapchatVideos($socialAccount, $lastRunAt);
            case 'pinterest':
                return $this->detectPinterestVideos($socialAccount, $lastRunAt);
            default:
                Log::warning('Unknown platform for video detection', ['platform' => $platform]);
                return [];
        }
    }

    /**
     * Generate fake videos for development/testing.
     */
    protected function generateFakeVideos(string $platform, ?Carbon $lastRunAt = null): array
    {
        // Only generate fake videos occasionally to simulate real behavior
        if (rand(1, 10) > 3) { // 30% chance of new videos
            return [];
        }

        $fakeVideos = [];
        $videoCount = rand(1, 2); // 1-2 new videos

        for ($i = 0; $i < $videoCount; $i++) {
            $fakeVideos[] = [
                'platform_video_id' => 'FAKE_' . strtoupper($platform) . '_' . uniqid(),
                'title' => 'Auto-detected video from ' . ucfirst($platform) . ' #' . ($i + 1),
                'description' => 'This is a simulated video detected by the workflow system for testing purposes.',
                'platform_url' => "https://{$platform}.com/fake-video-" . uniqid(),
                'published_at' => now()->subMinutes(rand(5, 60)),
                'duration' => rand(30, 300), // 30 seconds to 5 minutes
                'width' => 1920,
                'height' => 1080,
            ];
        }

        Log::info('Generated fake videos for development', [
            'platform' => $platform,
            'count' => count($fakeVideos),
        ]);

        return $fakeVideos;
    }

    /**
     * Detect new YouTube videos.
     */
    protected function detectYouTubeVideos(SocialAccount $socialAccount, ?Carbon $lastRunAt = null): array
    {
        try {
            // Use YouTube Data API to get recent uploads
            $publishedAfter = $lastRunAt ? $lastRunAt->toISOString() : now()->subHour()->toISOString();
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $socialAccount->access_token,
            ])->get('https://www.googleapis.com/youtube/v3/search', [
                'part' => 'snippet',
                'forMine' => 'true',
                'type' => 'video',
                'order' => 'date',
                'publishedAfter' => $publishedAfter,
                'maxResults' => 10,
            ]);

            if (!$response->successful()) {
                Log::error('YouTube API error', ['response' => $response->body()]);
                return [];
            }

            $data = $response->json();
            $videos = [];

            foreach ($data['items'] ?? [] as $item) {
                $videos[] = [
                    'platform_video_id' => $item['id']['videoId'],
                    'title' => $item['snippet']['title'],
                    'description' => $item['snippet']['description'],
                    'platform_url' => 'https://www.youtube.com/watch?v=' . $item['id']['videoId'],
                    'published_at' => Carbon::parse($item['snippet']['publishedAt']),
                ];
            }

            return $videos;

        } catch (\Exception $e) {
            Log::error('Error detecting YouTube videos', [
                'error' => $e->getMessage(),
                'social_account_id' => $socialAccount->id,
            ]);
            return [];
        }
    }

    /**
     * Detect new Instagram videos.
     */
    protected function detectInstagramVideos(SocialAccount $socialAccount, ?Carbon $lastRunAt = null): array
    {
        try {
            // Use Instagram Basic Display API to get recent media
            $response = Http::get('https://graph.instagram.com/me/media', [
                'fields' => 'id,media_type,media_url,permalink,caption,timestamp',
                'access_token' => $socialAccount->access_token,
                'limit' => 10,
            ]);

            if (!$response->successful()) {
                Log::error('Instagram API error', ['response' => $response->body()]);
                return [];
            }

            $data = $response->json();
            $videos = [];

            foreach ($data['data'] ?? [] as $item) {
                // Only process videos
                if ($item['media_type'] !== 'VIDEO') {
                    continue;
                }

                $publishedAt = Carbon::parse($item['timestamp']);
                
                // Skip if video is older than last run
                if ($lastRunAt && $publishedAt->lte($lastRunAt)) {
                    continue;
                }

                $videos[] = [
                    'platform_video_id' => $item['id'],
                    'title' => substr($item['caption'] ?? 'Instagram Video', 0, 100),
                    'description' => $item['caption'] ?? null,
                    'platform_url' => $item['permalink'],
                    'published_at' => $publishedAt,
                ];
            }

            return $videos;

        } catch (\Exception $e) {
            Log::error('Error detecting Instagram videos', [
                'error' => $e->getMessage(),
                'social_account_id' => $socialAccount->id,
            ]);
            return [];
        }
    }

    /**
     * Detect new TikTok videos.
     */
    protected function detectTikTokVideos(SocialAccount $socialAccount, ?Carbon $lastRunAt = null): array
    {
        try {
            // Use TikTok API to get user's videos
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $socialAccount->access_token,
            ])->post('https://open.tiktokapis.com/v2/video/list/', [
                'max_count' => 10,
                'cursor' => 0,
            ]);

            if (!$response->successful()) {
                Log::error('TikTok API error', ['response' => $response->body()]);
                return [];
            }

            $data = $response->json();
            $videos = [];

            foreach ($data['data']['videos'] ?? [] as $item) {
                $publishedAt = Carbon::createFromTimestamp($item['create_time']);
                
                // Skip if video is older than last run
                if ($lastRunAt && $publishedAt->lte($lastRunAt)) {
                    continue;
                }

                $videos[] = [
                    'platform_video_id' => $item['id'],
                    'title' => $item['title'] ?? 'TikTok Video',
                    'description' => null,
                    'platform_url' => $item['share_url'] ?? null,
                    'published_at' => $publishedAt,
                    'duration' => $item['duration'] ?? null,
                    'width' => $item['width'] ?? null,
                    'height' => $item['height'] ?? null,
                ];
            }

            return $videos;

        } catch (\Exception $e) {
            Log::error('Error detecting TikTok videos', [
                'error' => $e->getMessage(),
                'social_account_id' => $socialAccount->id,
            ]);
            return [];
        }
    }

    /**
     * Detect new Facebook videos.
     */
    protected function detectFacebookVideos(SocialAccount $socialAccount, ?Carbon $lastRunAt = null): array
    {
        try {
            // Use Facebook Graph API to get user's videos
            $since = $lastRunAt ? $lastRunAt->timestamp : now()->subHour()->timestamp;
            
            $response = Http::get('https://graph.facebook.com/me/videos', [
                'access_token' => $socialAccount->access_token,
                'fields' => 'id,title,description,permalink_url,created_time',
                'since' => $since,
                'limit' => 10,
            ]);

            if (!$response->successful()) {
                Log::error('Facebook API error', ['response' => $response->body()]);
                return [];
            }

            $data = $response->json();
            $videos = [];

            foreach ($data['data'] ?? [] as $item) {
                $videos[] = [
                    'platform_video_id' => $item['id'],
                    'title' => $item['title'] ?? 'Facebook Video',
                    'description' => $item['description'] ?? null,
                    'platform_url' => $item['permalink_url'] ?? null,
                    'published_at' => Carbon::parse($item['created_time']),
                ];
            }

            return $videos;

        } catch (\Exception $e) {
            Log::error('Error detecting Facebook videos', [
                'error' => $e->getMessage(),
                'social_account_id' => $socialAccount->id,
            ]);
            return [];
        }
    }

    /**
     * Detect new Twitter videos.
     */
    protected function detectTwitterVideos(SocialAccount $socialAccount, ?Carbon $lastRunAt = null): array
    {
        try {
            // Use Twitter API v2 to get user's tweets with videos
            $startTime = $lastRunAt ? $lastRunAt->toISOString() : now()->subHour()->toISOString();
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $socialAccount->access_token,
            ])->get('https://api.twitter.com/2/users/me/tweets', [
                'tweet.fields' => 'created_at,attachments',
                'media.fields' => 'type,url,duration_ms',
                'expansions' => 'attachments.media_keys',
                'start_time' => $startTime,
                'max_results' => 10,
            ]);

            if (!$response->successful()) {
                Log::error('Twitter API error', ['response' => $response->body()]);
                return [];
            }

            $data = $response->json();
            $videos = [];

            // Process tweets with video attachments
            foreach ($data['data'] ?? [] as $tweet) {
                if (!isset($tweet['attachments']['media_keys'])) {
                    continue;
                }

                // Check if any media is a video
                foreach ($data['includes']['media'] ?? [] as $media) {
                    if (in_array($media['media_key'], $tweet['attachments']['media_keys']) && $media['type'] === 'video') {
                        $videos[] = [
                            'platform_video_id' => $tweet['id'],
                            'title' => 'Twitter Video - ' . substr($tweet['text'], 0, 50),
                            'description' => $tweet['text'],
                            'platform_url' => 'https://twitter.com/i/status/' . $tweet['id'],
                            'published_at' => Carbon::parse($tweet['created_at']),
                            'duration' => isset($media['duration_ms']) ? $media['duration_ms'] / 1000 : null,
                        ];
                        break;
                    }
                }
            }

            return $videos;

        } catch (\Exception $e) {
            Log::error('Error detecting Twitter videos', [
                'error' => $e->getMessage(),
                'social_account_id' => $socialAccount->id,
            ]);
            return [];
        }
    }

    /**
     * Detect new Snapchat videos.
     */
    protected function detectSnapchatVideos(SocialAccount $socialAccount, ?Carbon $lastRunAt = null): array
    {
        // Snapchat doesn't provide a public API for retrieving user content
        // This would require Snapchat's Marketing API which is limited
        Log::info('Snapchat video detection not implemented - API limitations');
        return [];
    }

    /**
     * Detect new Pinterest videos.
     */
    protected function detectPinterestVideos(SocialAccount $socialAccount, ?Carbon $lastRunAt = null): array
    {
        try {
            // Use Pinterest API to get user's pins
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $socialAccount->access_token,
            ])->get('https://api.pinterest.com/v5/pins', [
                'page_size' => 10,
            ]);

            if (!$response->successful()) {
                Log::error('Pinterest API error', ['response' => $response->body()]);
                return [];
            }

            $data = $response->json();
            $videos = [];

            foreach ($data['items'] ?? [] as $item) {
                // Only process video pins
                if ($item['media']['media_type'] !== 'video') {
                    continue;
                }

                $publishedAt = Carbon::parse($item['created_at']);
                
                // Skip if video is older than last run
                if ($lastRunAt && $publishedAt->lte($lastRunAt)) {
                    continue;
                }

                $videos[] = [
                    'platform_video_id' => $item['id'],
                    'title' => $item['title'] ?? 'Pinterest Video',
                    'description' => $item['description'] ?? null,
                    'platform_url' => $item['link'] ?? null,
                    'published_at' => $publishedAt,
                ];
            }

            return $videos;

        } catch (\Exception $e) {
            Log::error('Error detecting Pinterest videos', [
                'error' => $e->getMessage(),
                'social_account_id' => $socialAccount->id,
            ]);
            return [];
        }
    }
} 