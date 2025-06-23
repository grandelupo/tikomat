<?php

namespace App\Services;

use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;
use App\Models\Video;
use App\Models\User;

class AIContentCalendarService
{
    protected array $platformOptimalTimes = [
        'youtube' => [
            'weekdays' => ['14:00', '16:00', '18:00', '20:00'],
            'weekends' => ['10:00', '12:00', '15:00', '19:00'],
            'peak_days' => ['tuesday', 'wednesday', 'thursday', 'saturday'],
        ],
        'instagram' => [
            'weekdays' => ['11:00', '13:00', '17:00', '19:00'],
            'weekends' => ['10:00', '14:00', '16:00', '20:00'],
            'peak_days' => ['monday', 'tuesday', 'wednesday', 'friday'],
        ],
        'tiktok' => [
            'weekdays' => ['06:00', '10:00', '19:00', '21:00'],
            'weekends' => ['09:00', '12:00', '15:00', '18:00'],
            'peak_days' => ['tuesday', 'thursday', 'friday', 'sunday'],
        ],
        'twitter' => [
            'weekdays' => ['09:00', '12:00', '15:00', '18:00'],
            'weekends' => ['10:00', '13:00', '16:00', '19:00'],
            'peak_days' => ['tuesday', 'wednesday', 'thursday'],
        ],
        'facebook' => [
            'weekdays' => ['13:00', '15:00', '18:00', '20:00'],
            'weekends' => ['12:00', '14:00', '17:00', '19:00'],
            'peak_days' => ['tuesday', 'wednesday', 'thursday', 'saturday'],
        ],
    ];

    protected array $contentTypeScheduling = [
        'educational' => [
            'optimal_frequency' => '2-3 per week',
            'best_days' => ['tuesday', 'wednesday', 'thursday'],
            'avoid_days' => ['friday', 'saturday'],
            'trending_topics' => ['tutorials', 'how-to', 'tips', 'guides'],
        ],
        'entertainment' => [
            'optimal_frequency' => '3-4 per week',
            'best_days' => ['wednesday', 'thursday', 'friday', 'sunday'],
            'avoid_days' => ['monday'],
            'trending_topics' => ['comedy', 'reactions', 'challenges', 'memes'],
        ],
        'gaming' => [
            'optimal_frequency' => '4-5 per week',
            'best_days' => ['friday', 'saturday', 'sunday'],
            'avoid_days' => ['monday', 'tuesday'],
            'trending_topics' => ['gameplay', 'reviews', 'streams', 'tips'],
        ],
        'lifestyle' => [
            'optimal_frequency' => '2-3 per week',
            'best_days' => ['monday', 'wednesday', 'friday', 'sunday'],
            'avoid_days' => ['tuesday'],
            'trending_topics' => ['fashion', 'health', 'travel', 'food'],
        ],
        'business' => [
            'optimal_frequency' => '1-2 per week',
            'best_days' => ['tuesday', 'wednesday', 'thursday'],
            'avoid_days' => ['friday', 'saturday', 'sunday'],
            'trending_topics' => ['entrepreneurship', 'marketing', 'productivity', 'finance'],
        ],
    ];

    protected array $seasonalTrends = [
        'winter' => [
            'trending_topics' => ['new year', 'resolutions', 'indoor activities', 'cozy content'],
            'content_boost' => ['educational', 'lifestyle', 'business'],
            'optimal_posting_increase' => 1.2,
        ],
        'spring' => [
            'trending_topics' => ['fresh starts', 'outdoor activities', 'spring cleaning', 'motivation'],
            'content_boost' => ['lifestyle', 'health', 'travel'],
            'optimal_posting_increase' => 1.1,
        ],
        'summer' => [
            'trending_topics' => ['vacation', 'outdoor fun', 'beach', 'festivals'],
            'content_boost' => ['entertainment', 'travel', 'lifestyle'],
            'optimal_posting_increase' => 0.9,
        ],
        'fall' => [
            'trending_topics' => ['back to school', 'productivity', 'cozy vibes', 'preparation'],
            'content_boost' => ['educational', 'business', 'lifestyle'],
            'optimal_posting_increase' => 1.1,
        ],
    ];

    /**
     * Generate AI-powered content calendar based on user's video performance data
     */
    public function generateContentCalendar(int $userId, array $options = []): array
    {
        $cacheKey = 'content_calendar_' . $userId . '_' . md5(serialize($options));
        
        return Cache::remember($cacheKey, 3600, function () use ($userId, $options) {
            try {
                Log::info('Generating content calendar', ['user_id' => $userId]);

                $user = User::find($userId);
                if (!$user) {
                    throw new \Exception('User not found');
                }

                $startDate = Carbon::parse($options['start_date'] ?? 'now');
                $endDate = Carbon::parse($options['end_date'] ?? 'now')->addDays($options['days'] ?? 30);
                $platforms = $options['platforms'] ?? ['youtube', 'instagram', 'tiktok'];

                // Get user's video data for analysis
                $videoData = $this->getUserVideoData($userId);
                $hasVideoData = !empty($videoData);

                $calendar = [
                    'user_id' => $userId,
                    'has_data' => $hasVideoData,
                    'period' => [
                        'start_date' => $startDate->toDateString(),
                        'end_date' => $endDate->toDateString(),
                        'total_days' => $startDate->diffInDays($endDate),
                    ],
                    'platforms' => $platforms,
                    'data_sources' => $this->getDataSources($userId),
                ];

                if ($hasVideoData) {
                    // Generate AI-powered insights based on real data
                    $calendar = array_merge($calendar, [
                        'optimal_schedule' => $this->generateOptimalScheduleFromData($videoData, $startDate, $endDate, $platforms),
                        'content_recommendations' => $this->generateContentRecommendationsFromData($videoData),
                        'trending_opportunities' => $this->identifyTrendingOpportunitiesFromData($videoData),
                        'engagement_predictions' => $this->predictEngagementTrendsFromData($videoData, $startDate, $endDate, $platforms),
                        'content_gaps' => $this->analyzeContentGapsFromData($videoData, $userId),
                        'performance_forecasts' => $this->generatePerformanceForecastsFromData($videoData, $platforms),
                        'best_performing_content' => $this->getBestPerformingContent($videoData),
                        'platform_insights' => $this->getPlatformInsights($videoData, $platforms),
                    ]);
                } else {
                    // Provide basic calendar without AI functionality
                    $calendar = array_merge($calendar, [
                        'optimal_schedule' => $this->generateBasicSchedule($startDate, $endDate, $platforms),
                        'content_recommendations' => $this->getBasicContentRecommendations(),
                        'trending_opportunities' => [],
                        'engagement_predictions' => [],
                        'content_gaps' => [],
                        'performance_forecasts' => [],
                        'setup_guide' => $this->getSetupGuide(),
                    ]);
                }

                $calendar['seasonal_insights'] = $this->getSeasonalInsights($startDate, $endDate);
                $calendar['posting_frequency'] = $this->calculateOptimalPostingFrequency($platforms, $options, $hasVideoData);
                $calendar['calendar_score'] = $this->calculateCalendarScore($calendar);

                Log::info('Content calendar generated', [
                    'user_id' => $userId,
                    'has_data' => $hasVideoData,
                    'total_days' => $calendar['period']['total_days'],
                    'calendar_score' => $calendar['calendar_score'],
                ]);

                return $calendar;

            } catch (\Exception $e) {
                Log::error('Content calendar generation failed', [
                    'user_id' => $userId,
                    'error' => $e->getMessage(),
                ]);
                
                return $this->getFailsafeContentCalendar($userId, $options);
            }
        });
    }

    /**
     * Generate optimal posting schedule
     */
    protected function generateOptimalSchedule(Carbon $startDate, Carbon $endDate, array $platforms, array $options): array
    {
        $schedule = [];
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            $dayOfWeek = strtolower($currentDate->format('l'));
            $isWeekend = in_array($dayOfWeek, ['saturday', 'sunday']);
            
            $daySchedule = [
                'date' => $currentDate->toDateString(),
                'day_of_week' => $dayOfWeek,
                'is_weekend' => $isWeekend,
                'platforms' => [],
                'recommended_posts' => 0,
                'optimal_times' => [],
                'content_priority' => $this->calculateDayContentPriority($currentDate),
                'engagement_potential' => $this->predictDayEngagementPotential($currentDate, $dayOfWeek),
            ];

            foreach ($platforms as $platform) {
                $platformTimes = $this->platformOptimalTimes[$platform] ?? [];
                $timeSlots = $isWeekend ? ($platformTimes['weekends'] ?? []) : ($platformTimes['weekdays'] ?? []);
                
                $platformSchedule = [
                    'platform' => $platform,
                    'is_peak_day' => in_array($dayOfWeek, $platformTimes['peak_days'] ?? []),
                    'optimal_times' => $timeSlots,
                    'recommended_posts' => $this->calculateRecommendedPosts($platform, $dayOfWeek, $options),
                    'content_types' => $this->suggestContentTypesForDay($platform, $currentDate),
                    'engagement_multiplier' => $this->calculateEngagementMultiplier($platform, $dayOfWeek),
                ];

                $daySchedule['platforms'][$platform] = $platformSchedule;
                $daySchedule['recommended_posts'] += $platformSchedule['recommended_posts'];
                $daySchedule['optimal_times'] = array_merge($daySchedule['optimal_times'], $timeSlots);
            }

            $daySchedule['optimal_times'] = array_unique($daySchedule['optimal_times']);
            sort($daySchedule['optimal_times']);

            $schedule[] = $daySchedule;
            $currentDate->addDay();
        }

        return $schedule;
    }

    /**
     * Generate content recommendations
     */
    protected function generateContentRecommendations(Carbon $startDate, Carbon $endDate, array $options): array
    {
        $recommendations = [];
        
        // Weekly content themes
        $weeklyThemes = [
            'monday' => ['motivation', 'planning', 'goal-setting'],
            'tuesday' => ['tutorials', 'tips', 'education'],
            'wednesday' => ['behind-the-scenes', 'process', 'workflow'],
            'thursday' => ['throwback', 'highlights', 'compilation'],
            'friday' => ['fun', 'entertainment', 'relaxation'],
            'saturday' => ['lifestyle', 'personal', 'casual'],
            'sunday' => ['reflection', 'inspiration', 'preparation'],
        ];

        // Content type rotation
        $contentTypes = ['educational', 'entertainment', 'promotional', 'user-generated', 'trending'];
        
        foreach ($contentTypes as $type) {
            $recommendations[] = [
                'type' => $type,
                'frequency' => $this->contentTypeScheduling[$type]['optimal_frequency'] ?? '1-2 per week',
                'best_days' => $this->contentTypeScheduling[$type]['best_days'] ?? ['monday', 'wednesday', 'friday'],
                'trending_topics' => $this->contentTypeScheduling[$type]['trending_topics'] ?? [],
                'expected_performance' => $this->predictContentTypePerformance($type, $startDate, $endDate),
                'suggested_times' => $this->suggestOptimalTimesForContentType($type),
            ];
        }

        // Seasonal content suggestions
        $season = $this->getCurrentSeason($startDate);
        $seasonalData = $this->seasonalTrends[$season] ?? [];
        
        $recommendations[] = [
            'type' => 'seasonal',
            'season' => $season,
            'trending_topics' => $seasonalData['trending_topics'] ?? [],
            'content_boost' => $seasonalData['content_boost'] ?? [],
            'posting_adjustment' => $seasonalData['optimal_posting_increase'] ?? 1.0,
            'special_dates' => $this->getSpecialDatesInPeriod($startDate, $endDate),
        ];

        return $recommendations;
    }

    /**
     * Identify trending opportunities
     */
    protected function identifyTrendingOpportunities(Carbon $startDate, Carbon $endDate): array
    {
        $opportunities = [];

        // Simulated trending topics (in real implementation, this would connect to trend APIs)
        $trendingTopics = [
            [
                'topic' => 'AI and Automation',
                'trend_score' => 95,
                'growth_rate' => '+45%',
                'competition_level' => 'medium',
                'optimal_window' => '7-14 days',
                'content_suggestions' => [
                    'How AI is changing industries',
                    'Automation tools for productivity',
                    'Future of work with AI',
                ],
                'platforms' => ['youtube', 'instagram', 'tiktok'],
                'engagement_potential' => 'high',
            ],
            [
                'topic' => 'Sustainable Living',
                'trend_score' => 88,
                'growth_rate' => '+32%',
                'competition_level' => 'low',
                'optimal_window' => '14-21 days',
                'content_suggestions' => [
                    'Eco-friendly daily habits',
                    'Zero waste challenges',
                    'Sustainable fashion tips',
                ],
                'platforms' => ['instagram', 'youtube', 'tiktok'],
                'engagement_potential' => 'very_high',
            ],
            [
                'topic' => 'Remote Work Tips',
                'trend_score' => 82,
                'growth_rate' => '+28%',
                'competition_level' => 'high',
                'optimal_window' => '5-10 days',
                'content_suggestions' => [
                    'Home office setup tours',
                    'Productivity hacks for remote workers',
                    'Work-life balance strategies',
                ],
                'platforms' => ['youtube', 'instagram', 'twitter'],
                'engagement_potential' => 'high',
            ],
            [
                'topic' => 'Mental Health Awareness',
                'trend_score' => 90,
                'growth_rate' => '+38%',
                'competition_level' => 'medium',
                'optimal_window' => '10-21 days',
                'content_suggestions' => [
                    'Mindfulness exercises',
                    'Stress management techniques',
                    'Mental health resources',
                ],
                'platforms' => ['instagram', 'tiktok', 'youtube'],
                'engagement_potential' => 'very_high',
            ],
        ];

        foreach ($trendingTopics as $topic) {
            $opportunities[] = [
                'topic' => $topic['topic'],
                'trend_score' => $topic['trend_score'],
                'growth_rate' => $topic['growth_rate'],
                'competition_level' => $topic['competition_level'],
                'optimal_posting_date' => $startDate->copy()->addDays(rand(1, 14))->toDateString(),
                'content_suggestions' => $topic['content_suggestions'],
                'recommended_platforms' => $topic['platforms'],
                'engagement_potential' => $topic['engagement_potential'],
                'hashtag_suggestions' => $this->generateHashtagsForTopic($topic['topic']),
            ];
        }

        return $opportunities;
    }

    /**
     * Predict engagement trends
     */
    protected function predictEngagementTrends(Carbon $startDate, Carbon $endDate, array $platforms): array
    {
        $predictions = [];
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            $dayOfWeek = strtolower($currentDate->format('l'));
            $isWeekend = in_array($dayOfWeek, ['saturday', 'sunday']);
            
            $dayPrediction = [
                'date' => $currentDate->toDateString(),
                'day_of_week' => $dayOfWeek,
                'overall_engagement_score' => $this->calculateOverallEngagementScore($currentDate),
                'platforms' => [],
            ];

            foreach ($platforms as $platform) {
                $platformTimes = $this->platformOptimalTimes[$platform] ?? [];
                $isPeakDay = in_array($dayOfWeek, $platformTimes['peak_days'] ?? []);
                
                $baseEngagement = 100;
                $dayMultiplier = $isPeakDay ? 1.3 : ($isWeekend ? 0.8 : 1.0);
                $seasonalMultiplier = $this->getSeasonalEngagementMultiplier($currentDate);
                
                $predictedEngagement = $baseEngagement * $dayMultiplier * $seasonalMultiplier;
                
                $dayPrediction['platforms'][$platform] = [
                    'platform' => $platform,
                    'predicted_engagement' => round($predictedEngagement),
                    'confidence_level' => rand(75, 95),
                    'peak_times' => $isWeekend ? ($platformTimes['weekends'] ?? []) : ($platformTimes['weekdays'] ?? []),
                    'recommended_content_types' => $this->getRecommendedContentTypes($platform, $currentDate),
                ];
            }

            $predictions[] = $dayPrediction;
            $currentDate->addDay();
        }

        return $predictions;
    }

    /**
     * Analyze content gaps
     */
    protected function analyzeContentGaps(int $userId, Carbon $startDate, Carbon $endDate): array
    {
        $gaps = [];
        
        // Simulated content gap analysis
        $contentTypes = ['educational', 'entertainment', 'promotional', 'behind-the-scenes', 'user-generated'];
        
        foreach ($contentTypes as $type) {
            $recentCount = rand(0, 5); // Simulated recent content count
            $recommendedCount = 8; // Recommended posts per month
            
            if ($recentCount < $recommendedCount * 0.5) {
                $gaps[] = [
                    'type' => $type,
                    'gap_severity' => 'high',
                    'current_count' => $recentCount,
                    'recommended_count' => $recommendedCount,
                    'gap_percentage' => round((($recommendedCount - $recentCount) / $recommendedCount) * 100),
                    'suggested_actions' => $this->getSuggestedActionsForGap($type),
                    'priority_level' => $this->calculateGapPriority($type, $recentCount, $recommendedCount),
                ];
            }
        }

        // Platform-specific gaps
        $platforms = ['youtube', 'instagram', 'tiktok', 'twitter', 'facebook'];
        foreach ($platforms as $platform) {
            $platformGaps = $this->analyzePlatformSpecificGaps($platform, $userId);
            if (!empty($platformGaps)) {
                $gaps = array_merge($gaps, $platformGaps);
            }
        }

        return $gaps;
    }

    /**
     * Get user's video data for analysis
     */
    protected function getUserVideoData(int $userId): array
    {
        // Get user's videos with their targets and performance data
        $videos = Video::where('user_id', $userId)
            ->with(['targets', 'user'])
            ->where('created_at', '>=', now()->subDays(90)) // Last 90 days
            ->orderBy('created_at', 'desc')
            ->get();

        $videoData = [];
        foreach ($videos as $video) {
            $videoInfo = [
                'id' => $video->id,
                'title' => $video->title,
                'description' => $video->description,
                'duration' => $video->duration,
                'created_at' => $video->created_at,
                'platforms' => [],
                'total_engagement' => 0,
                'best_platform' => null,
                'content_type' => $this->inferContentType($video),
            ];

            foreach ($video->targets as $target) {
                $platformData = [
                    'platform' => $target->platform,
                    'status' => $target->status,
                    'platform_video_id' => $target->platform_video_id,
                    'platform_url' => $target->platform_url,
                    'published_at' => $target->publish_at,
                    'performance_score' => $this->calculatePlatformPerformanceScore($target),
                ];

                $videoInfo['platforms'][$target->platform] = $platformData;
                $videoInfo['total_engagement'] += $platformData['performance_score'];
            }

            // Determine best performing platform
            if (!empty($videoInfo['platforms'])) {
                $bestPlatform = array_reduce(array_keys($videoInfo['platforms']), function ($best, $platform) use ($videoInfo) {
                    return $best === null || $videoInfo['platforms'][$platform]['performance_score'] > $videoInfo['platforms'][$best]['performance_score']
                        ? $platform : $best;
                });
                $videoInfo['best_platform'] = $bestPlatform;
            }

            $videoData[] = $videoInfo;
        }

        return $videoData;
    }

    /**
     * Get data sources available for the user
     */
    protected function getDataSources(int $userId): array
    {
        $user = User::find($userId);
        $videoCount = $user->videos()->count();
        $publishedCount = Video::where('user_id', $userId)
            ->whereHas('targets', function ($query) {
                $query->where('status', 'success');
            })->count();
        
        $connectedPlatforms = $user->socialAccounts()->pluck('platform')->toArray();

        return [
            'total_videos' => $videoCount,
            'published_videos' => $publishedCount,
            'connected_platforms' => $connectedPlatforms,
            'has_sufficient_data' => $videoCount >= 3 && $publishedCount >= 1,
            'data_quality' => $this->assessDataQuality($videoCount, $publishedCount, count($connectedPlatforms)),
        ];
    }

    /**
     * Generate optimal schedule based on actual video performance data
     */
    protected function generateOptimalScheduleFromData(array $videoData, Carbon $startDate, Carbon $endDate, array $platforms): array
    {
        $schedule = [];
        $currentDate = $startDate->copy();

        // Analyze best performing times from video data
        $performanceByDay = $this->analyzePerformanceByDay($videoData);
        $performanceByTime = $this->analyzePerformanceByTime($videoData);

        while ($currentDate->lte($endDate)) {
            $dayOfWeek = strtolower($currentDate->format('l'));
            $isWeekend = in_array($dayOfWeek, ['saturday', 'sunday']);
            
            $dayPerformance = $performanceByDay[$dayOfWeek] ?? ['score' => 50, 'video_count' => 0];
            
            $daySchedule = [
                'date' => $currentDate->toDateString(),
                'day_of_week' => $dayOfWeek,
                'is_weekend' => $isWeekend,
                'historical_performance' => $dayPerformance['score'],
                'video_count' => $dayPerformance['video_count'],
                'platforms' => [],
                'recommended_posts' => 0,
                'optimal_times' => $performanceByTime[$dayOfWeek] ?? ['12:00', '18:00'],
                'confidence_level' => $dayPerformance['video_count'] > 0 ? 'high' : 'low',
            ];

            foreach ($platforms as $platform) {
                $platformPerformance = $this->getPlatformPerformanceForDay($videoData, $platform, $dayOfWeek);
                
                $platformSchedule = [
                    'platform' => $platform,
                    'historical_performance' => $platformPerformance['score'],
                    'video_count' => $platformPerformance['count'],
                    'success_rate' => $platformPerformance['success_rate'],
                    'recommended_posts' => $platformPerformance['count'] > 0 ? 1 : 0,
                    'optimal_times' => $platformPerformance['best_times'] ?? ['12:00', '18:00'],
                    'confidence' => $platformPerformance['count'] > 0 ? 'high' : 'low',
                ];

                $daySchedule['platforms'][$platform] = $platformSchedule;
                $daySchedule['recommended_posts'] += $platformSchedule['recommended_posts'];
            }

            $schedule[] = $daySchedule;
            $currentDate->addDay();
        }

        return $schedule;
    }

    /**
     * Generate content recommendations based on user's successful content
     */
    protected function generateContentRecommendationsFromData(array $videoData): array
    {
        $recommendations = [];
        
        // Analyze content types that perform well
        $contentTypePerformance = $this->analyzeContentTypePerformance($videoData);
        
        foreach ($contentTypePerformance as $type => $data) {
            if ($data['avg_score'] > 60 && $data['count'] > 0) {
                $recommendations[] = [
                    'type' => $type,
                    'performance_score' => $data['avg_score'],
                    'video_count' => $data['count'],
                    'success_rate' => $data['success_rate'],
                    'best_platforms' => $data['best_platforms'],
                    'optimal_duration' => $data['avg_duration'],
                    'example_titles' => $data['example_titles'],
                    'suggested_frequency' => $this->suggestFrequency($data),
                ];
            }
        }

        // If no high-performing content, suggest based on general best practices
        if (empty($recommendations)) {
            $recommendations = $this->getBasicContentRecommendations();
        }

        return $recommendations;
    }

    /**
     * Get basic schedule for users without data
     */
    protected function generateBasicSchedule(Carbon $startDate, Carbon $endDate, array $platforms): array
    {
        $schedule = [];
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            $dayOfWeek = strtolower($currentDate->format('l'));
            $isWeekend = in_array($dayOfWeek, ['saturday', 'sunday']);
            
            $daySchedule = [
                'date' => $currentDate->toDateString(),
                'day_of_week' => $dayOfWeek,
                'is_weekend' => $isWeekend,
                'platforms' => [],
                'recommended_posts' => 0,
                'optimal_times' => $this->platformOptimalTimes['general'] ?? ['12:00', '18:00'],
                'note' => 'Based on general best practices. Connect platforms and upload videos for personalized insights.',
            ];

            foreach ($platforms as $platform) {
                $platformTimes = $this->platformOptimalTimes[$platform] ?? [];
                $timeSlots = $isWeekend ? ($platformTimes['weekends'] ?? ['12:00', '18:00']) : ($platformTimes['weekdays'] ?? ['12:00', '18:00']);
                
                $daySchedule['platforms'][$platform] = [
                    'platform' => $platform,
                    'optimal_times' => $timeSlots,
                    'recommended_posts' => in_array($dayOfWeek, ['tuesday', 'wednesday', 'thursday']) ? 1 : 0,
                    'note' => 'General recommendations - upload videos for personalized timing',
                ];
                
                $daySchedule['recommended_posts'] += $daySchedule['platforms'][$platform]['recommended_posts'];
            }

            $schedule[] = $daySchedule;
            $currentDate->addDay();
        }

        return $schedule;
    }

    /**
     * Get basic content recommendations for users without data
     */
    protected function getBasicContentRecommendations(): array
    {
        return [
            [
                'type' => 'educational',
                'title' => 'Tutorial Content',
                'description' => 'Create how-to videos and educational content',
                'suggested_frequency' => '2-3 times per week',
                'platforms' => ['youtube', 'instagram'],
                'tips' => [
                    'Keep videos under 60 seconds for optimal engagement',
                    'Use clear, descriptive titles',
                    'Include relevant hashtags',
                ],
                'note' => 'General recommendation - upload videos to get personalized suggestions',
            ],
            [
                'type' => 'entertainment',
                'title' => 'Fun & Engaging Content',
                'description' => 'Create entertaining videos that engage your audience',
                'suggested_frequency' => '3-4 times per week',
                'platforms' => ['tiktok', 'instagram'],
                'tips' => [
                    'Follow trending audio and challenges',
                    'Use engaging thumbnails',
                    'Post during peak hours',
                ],
                'note' => 'General recommendation - upload videos to get personalized suggestions',
            ],
        ];
    }

    /**
     * Get setup guide for users without data
     */
    protected function getSetupGuide(): array
    {
        return [
            'steps' => [
                [
                    'title' => 'Connect Social Media Accounts',
                    'description' => 'Connect your YouTube, Instagram, TikTok, and other social media accounts',
                    'action' => 'Go to Connections page',
                    'importance' => 'high',
                ],
                [
                    'title' => 'Upload Your First Video',
                    'description' => 'Upload and publish at least one video to start gathering performance data',
                    'action' => 'Go to Videos page',
                    'importance' => 'high',
                ],
                [
                    'title' => 'Publish to Multiple Platforms',
                    'description' => 'Publish your videos to multiple platforms to compare performance',
                    'action' => 'Use the multi-platform publishing feature',
                    'importance' => 'medium',
                ],
                [
                    'title' => 'Wait for Performance Data',
                    'description' => 'Allow time for your content to gather views and engagement data',
                    'action' => 'Check back in 24-48 hours',
                    'importance' => 'medium',
                ],
            ],
            'estimated_time' => '5-10 minutes setup, 24-48 hours for data collection',
            'benefits' => [
                'Personalized posting schedules based on your audience',
                'Content recommendations based on your successful videos',
                'Platform-specific optimization insights',
                'Trend analysis for your niche',
            ],
        ];
    }

    /**
     * Get seasonal insights
     */
    protected function getSeasonalInsights(Carbon $startDate, Carbon $endDate): array
    {
        $season = $this->getCurrentSeason($startDate);
        $seasonalData = $this->seasonalTrends[$season] ?? [];
        
        return [
            'current_season' => $season,
            'trending_topics' => $seasonalData['trending_topics'] ?? [],
            'content_boost_categories' => $seasonalData['content_boost'] ?? [],
            'posting_frequency_adjustment' => $seasonalData['optimal_posting_increase'] ?? 1.0,
            'seasonal_events' => $this->getSeasonalEvents($startDate, $endDate),
            'holiday_opportunities' => $this->getHolidayOpportunities($startDate, $endDate),
            'weather_impact' => $this->analyzeWeatherImpact($season),
            'audience_behavior_changes' => $this->predictAudientBehaviorChanges($season),
        ];
    }

    /**
     * Calculate optimal posting frequency
     */
    protected function calculateOptimalPostingFrequency(array $platforms, array $options, bool $hasData): array
    {
        $frequency = [];
        
        foreach ($platforms as $platform) {
            $baseFrequency = match ($platform) {
                'youtube' => 2, // posts per week
                'instagram' => 5,
                'tiktok' => 7,
                'twitter' => 10,
                'facebook' => 3,
                default => 3,
            };
            
            if (!$hasData) {
                // Provide conservative recommendations for users without data
                $baseFrequency = (int) ($baseFrequency * 0.7);
            }
            
            $frequency[$platform] = [
                'platform' => $platform,
                'posts_per_week' => $baseFrequency,
                'posts_per_day' => round($baseFrequency / 7, 1),
                'confidence' => $hasData ? 'high' : 'low',
                'note' => $hasData ? 'Based on your video performance data' : 'Conservative recommendation - upload videos for personalized insights',
            ];
        }
        
        return $frequency;
    }

    /**
     * Generate performance forecasts
     */
    protected function generatePerformanceForecasts(Carbon $startDate, Carbon $endDate, array $platforms): array
    {
        $forecasts = [];
        
        foreach ($platforms as $platform) {
            $baseViews = match ($platform) {
                'youtube' => 1000,
                'instagram' => 500,
                'tiktok' => 2000,
                'twitter' => 300,
                'facebook' => 400,
                default => 500,
            };
            
            $growthRate = rand(5, 25) / 100; // 5-25% growth
            $seasonalMultiplier = $this->getSeasonalEngagementMultiplier($startDate);
            
            $forecasts[$platform] = [
                'platform' => $platform,
                'expected_views_per_post' => round($baseViews * $seasonalMultiplier),
                'expected_engagement_rate' => round(rand(25, 80) / 10, 1) . '%',
                'growth_projection' => round($growthRate * 100, 1) . '%',
                'confidence_level' => rand(70, 90) . '%',
                'key_success_factors' => $this->getKeySuccessFactors($platform),
                'potential_reach' => $this->calculatePotentialReach($platform, $baseViews, $growthRate),
            ];
        }
        
        return $forecasts;
    }

    /**
     * Suggest content themes
     */
    protected function suggestContentThemes(Carbon $startDate, Carbon $endDate): array
    {
        $themes = [
            [
                'theme' => 'Productivity & Organization',
                'duration' => '1 week',
                'content_ideas' => [
                    'Morning routine optimization',
                    'Workspace organization tips',
                    'Time management strategies',
                    'Digital decluttering guide',
                    'Goal-setting frameworks',
                ],
                'target_audience' => 'professionals, students, entrepreneurs',
                'expected_engagement' => 'high',
                'best_platforms' => ['youtube', 'instagram', 'tiktok'],
            ],
            [
                'theme' => 'Health & Wellness',
                'duration' => '2 weeks',
                'content_ideas' => [
                    'Healthy meal prep ideas',
                    'Home workout routines',
                    'Mental health check-ins',
                    'Sleep optimization tips',
                    'Stress management techniques',
                ],
                'target_audience' => 'health-conscious individuals, wellness enthusiasts',
                'expected_engagement' => 'very_high',
                'best_platforms' => ['instagram', 'tiktok', 'youtube'],
            ],
            [
                'theme' => 'Creative Inspiration',
                'duration' => '1 week',
                'content_ideas' => [
                    'Art challenge participation',
                    'Creative process behind-the-scenes',
                    'Inspiration sources sharing',
                    'Skill development tutorials',
                    'Creative community features',
                ],
                'target_audience' => 'artists, creators, designers',
                'expected_engagement' => 'high',
                'best_platforms' => ['instagram', 'youtube', 'tiktok'],
            ],
        ];
        
        return $themes;
    }

    /**
     * Analyze competitive opportunities
     */
    protected function analyzeCompetitiveOpportunities(Carbon $startDate, Carbon $endDate): array
    {
        return [
            'content_gaps' => [
                'underserved_topics' => [
                    'Advanced tutorial series',
                    'Industry-specific content',
                    'Niche community content',
                ],
                'posting_time_opportunities' => [
                    'Early morning slots (6-8 AM)',
                    'Late evening slots (9-11 PM)',
                    'Weekend afternoon slots',
                ],
                'platform_opportunities' => [
                    'Emerging platforms with low competition',
                    'Underutilized features on existing platforms',
                    'Cross-platform content adaptation',
                ],
            ],
            'competitive_advantages' => [
                'unique_content_angles' => [
                    'Personal experience sharing',
                    'Behind-the-scenes content',
                    'Educational value-add',
                ],
                'engagement_strategies' => [
                    'Community building focus',
                    'Interactive content creation',
                    'Consistent posting schedule',
                ],
            ],
            'market_positioning' => [
                'recommended_niches' => [
                    'Beginner-friendly content',
                    'Advanced skill development',
                    'Industry insights',
                ],
                'differentiation_strategies' => [
                    'Unique visual style',
                    'Consistent brand voice',
                    'Value-first approach',
                ],
            ],
        ];
    }

    /**
     * Calculate calendar optimization score
     */
    protected function calculateCalendarScore(array $calendar): int
    {
        $score = 0;
        $maxScore = 100;
        
        // Scheduling optimization (30 points)
        $scheduleScore = 0;
        foreach ($calendar['optimal_schedule'] as $day) {
            if ($day['recommended_posts'] > 0) {
                $scheduleScore += 5;
            }
            if ($day['engagement_potential'] > 70) {
                $scheduleScore += 3;
            }
        }
        $scheduleScore = min(30, $scheduleScore);
        
        // Content variety (25 points)
        $contentScore = count($calendar['content_recommendations']) * 5;
        $contentScore = min(25, $contentScore);
        
        // Trend utilization (20 points)
        $trendScore = count($calendar['trending_opportunities']) * 5;
        $trendScore = min(20, $trendScore);
        
        // Seasonal alignment (15 points)
        $seasonalScore = !empty($calendar['seasonal_insights']['trending_topics']) ? 15 : 5;
        
        // Gap coverage (10 points)
        $gapScore = 10 - (count($calendar['content_gaps']) * 2);
        $gapScore = max(0, $gapScore);
        
        $totalScore = $scheduleScore + $contentScore + $trendScore + $seasonalScore + $gapScore;
        
        return min($maxScore, $totalScore);
    }

    /**
     * Helper methods
     */
    protected function calculateDayContentPriority(Carbon $date): string
    {
        $dayOfWeek = strtolower($date->format('l'));
        $priorityDays = ['tuesday', 'wednesday', 'thursday'];
        
        if (in_array($dayOfWeek, $priorityDays)) {
            return 'high';
        } elseif (in_array($dayOfWeek, ['monday', 'friday'])) {
            return 'medium';
        } else {
            return 'low';
        }
    }

    protected function predictDayEngagementPotential(Carbon $date, string $dayOfWeek): int
    {
        $basePotential = 50;
        
        // Day of week adjustment
        $dayMultiplier = match ($dayOfWeek) {
            'tuesday', 'wednesday', 'thursday' => 1.3,
            'monday', 'friday' => 1.1,
            'saturday', 'sunday' => 0.8,
            default => 1.0,
        };
        
        // Seasonal adjustment
        $seasonalMultiplier = $this->getSeasonalEngagementMultiplier($date);
        
        return round($basePotential * $dayMultiplier * $seasonalMultiplier);
    }

    protected function calculateRecommendedPosts(string $platform, string $dayOfWeek, array $options): int
    {
        $basePosts = match ($platform) {
            'youtube' => 0.3, // ~2 per week
            'instagram' => 0.7, // ~5 per week
            'tiktok' => 1.0, // ~7 per week
            'twitter' => 1.4, // ~10 per week
            'facebook' => 0.4, // ~3 per week
            default => 0.5,
        };
        
        $platformTimes = $this->platformOptimalTimes[$platform] ?? [];
        $isPeakDay = in_array($dayOfWeek, $platformTimes['peak_days'] ?? []);
        
        $adjustedPosts = $basePosts * ($isPeakDay ? 1.5 : 1.0);
        
        return round($adjustedPosts);
    }

    protected function suggestContentTypesForDay(string $platform, Carbon $date): array
    {
        $dayOfWeek = strtolower($date->format('l'));
        
        $dayContentMap = [
            'monday' => ['motivational', 'planning', 'goal-setting'],
            'tuesday' => ['educational', 'tutorial', 'tips'],
            'wednesday' => ['behind-the-scenes', 'process', 'workflow'],
            'thursday' => ['highlights', 'compilation', 'throwback'],
            'friday' => ['entertainment', 'fun', 'casual'],
            'saturday' => ['lifestyle', 'personal', 'relaxed'],
            'sunday' => ['inspiration', 'reflection', 'preparation'],
        ];
        
        return $dayContentMap[$dayOfWeek] ?? ['general'];
    }

    protected function calculateEngagementMultiplier(string $platform, string $dayOfWeek): float
    {
        $platformTimes = $this->platformOptimalTimes[$platform] ?? [];
        $isPeakDay = in_array($dayOfWeek, $platformTimes['peak_days'] ?? []);
        
        return $isPeakDay ? 1.3 : 1.0;
    }

    protected function getCurrentSeason(Carbon $date): string
    {
        $month = $date->month;
        
        return match (true) {
            $month >= 12 || $month <= 2 => 'winter',
            $month >= 3 && $month <= 5 => 'spring',
            $month >= 6 && $month <= 8 => 'summer',
            $month >= 9 && $month <= 11 => 'fall',
            default => 'spring',
        };
    }

    protected function getSeasonalEngagementMultiplier(Carbon $date): float
    {
        $season = $this->getCurrentSeason($date);
        $seasonalData = $this->seasonalTrends[$season] ?? [];
        
        return $seasonalData['optimal_posting_increase'] ?? 1.0;
    }

    protected function getSpecialDatesInPeriod(Carbon $startDate, Carbon $endDate): array
    {
        // Simulated special dates
        return [
            [
                'date' => $startDate->copy()->addDays(7)->toDateString(),
                'event' => 'World Creativity Day',
                'content_opportunity' => 'Creative showcase content',
                'engagement_boost' => 'high',
            ],
            [
                'date' => $startDate->copy()->addDays(14)->toDateString(),
                'event' => 'International Productivity Day',
                'content_opportunity' => 'Productivity tips and tools',
                'engagement_boost' => 'medium',
            ],
        ];
    }

    protected function generateHashtagsForTopic(string $topic): array
    {
        $hashtagMap = [
            'AI and Automation' => ['#AI', '#automation', '#technology', '#innovation', '#future'],
            'Sustainable Living' => ['#sustainability', '#ecofriendly', '#greenliving', '#environment', '#zerowaste'],
            'Remote Work Tips' => ['#remotework', '#workfromhome', '#productivity', '#digitallife', '#worklife'],
            'Mental Health Awareness' => ['#mentalhealth', '#mindfulness', '#wellness', '#selfcare', '#mentalwellness'],
        ];
        
        return $hashtagMap[$topic] ?? ['#trending', '#content', '#social'];
    }

    protected function calculateOverallEngagementScore(Carbon $date): int
    {
        $dayOfWeek = strtolower($date->format('l'));
        $baseScore = 50;
        
        $dayMultiplier = match ($dayOfWeek) {
            'tuesday', 'wednesday', 'thursday' => 1.4,
            'monday', 'friday' => 1.2,
            'saturday', 'sunday' => 0.9,
            default => 1.0,
        };
        
        return round($baseScore * $dayMultiplier);
    }

    protected function getRecommendedContentTypes(string $platform, Carbon $date): array
    {
        $platformContentMap = [
            'youtube' => ['educational', 'entertainment', 'tutorial'],
            'instagram' => ['lifestyle', 'visual', 'story'],
            'tiktok' => ['entertainment', 'trending', 'creative'],
            'twitter' => ['news', 'opinion', 'discussion'],
            'facebook' => ['community', 'sharing', 'discussion'],
        ];
        
        return $platformContentMap[$platform] ?? ['general'];
    }

    protected function predictContentTypePerformance(string $type, Carbon $startDate, Carbon $endDate): array
    {
        return [
            'expected_views' => rand(500, 2000),
            'expected_engagement_rate' => rand(30, 80) / 10 . '%',
            'growth_potential' => rand(10, 40) . '%',
            'competition_level' => ['low', 'medium', 'high'][rand(0, 2)],
        ];
    }

    protected function suggestOptimalTimesForContentType(string $type): array
    {
        $contentTimeMap = [
            'educational' => ['09:00', '14:00', '19:00'],
            'entertainment' => ['17:00', '19:00', '21:00'],
            'promotional' => ['11:00', '15:00', '18:00'],
            'user-generated' => ['12:00', '16:00', '20:00'],
            'trending' => ['10:00', '14:00', '18:00'],
        ];
        
        return $contentTimeMap[$type] ?? ['12:00', '16:00', '20:00'];
    }

    protected function getSuggestedActionsForGap(string $type): array
    {
        $actionMap = [
            'educational' => [
                'Create tutorial series',
                'Share industry insights',
                'Develop how-to guides',
            ],
            'entertainment' => [
                'Participate in trending challenges',
                'Create behind-the-scenes content',
                'Share funny moments',
            ],
            'promotional' => [
                'Showcase products/services',
                'Share customer testimonials',
                'Highlight achievements',
            ],
        ];
        
        return $actionMap[$type] ?? ['Create more content of this type'];
    }

    protected function calculateGapPriority(string $type, int $current, int $recommended): string
    {
        $gapPercentage = (($recommended - $current) / $recommended) * 100;
        
        return match (true) {
            $gapPercentage >= 70 => 'critical',
            $gapPercentage >= 50 => 'high',
            $gapPercentage >= 30 => 'medium',
            default => 'low',
        };
    }

    protected function analyzePlatformSpecificGaps(string $platform, int $userId): array
    {
        // Simulated platform-specific gap analysis
        return [
            [
                'type' => 'platform_specific',
                'platform' => $platform,
                'gap_type' => 'posting_frequency',
                'current_frequency' => rand(1, 3),
                'recommended_frequency' => rand(4, 7),
                'impact' => 'medium',
                'suggested_actions' => [
                    "Increase posting frequency on {$platform}",
                    "Optimize content for {$platform} audience",
                    "Use platform-specific features more",
                ],
            ],
        ];
    }

    protected function getSeasonalEvents(Carbon $startDate, Carbon $endDate): array
    {
        return [
            [
                'name' => 'Spring Cleaning Week',
                'date' => $startDate->copy()->addDays(10)->toDateString(),
                'content_opportunity' => 'Organization and productivity content',
                'engagement_potential' => 'high',
            ],
        ];
    }

    protected function getHolidayOpportunities(Carbon $startDate, Carbon $endDate): array
    {
        return [
            [
                'holiday' => 'Earth Day',
                'date' => '2024-04-22',
                'content_themes' => ['sustainability', 'environment', 'green living'],
                'engagement_boost' => 'very_high',
            ],
        ];
    }

    protected function analyzeWeatherImpact(string $season): array
    {
        $weatherImpact = [
            'winter' => ['indoor_activities', 'cozy_content', 'planning'],
            'spring' => ['outdoor_activities', 'fresh_starts', 'energy'],
            'summer' => ['travel', 'outdoor_fun', 'vacation'],
            'fall' => ['preparation', 'productivity', 'cozy_vibes'],
        ];
        
        return $weatherImpact[$season] ?? [];
    }

    protected function predictAudientBehaviorChanges(string $season): array
    {
        return [
            'viewing_patterns' => 'Higher engagement during peak hours',
            'content_preferences' => 'Seasonal content performs better',
            'platform_usage' => 'Increased mobile usage',
            'engagement_timing' => 'Earlier evening engagement',
        ];
    }

    protected function getOptimalTimesPerDay(string $platform): int
    {
        return match ($platform) {
            'youtube' => 1,
            'instagram' => 2,
            'tiktok' => 3,
            'twitter' => 4,
            'facebook' => 1,
            default => 2,
        };
    }

    protected function getRecommendedContentMix(string $platform): array
    {
        $contentMix = [
            'youtube' => ['educational' => 40, 'entertainment' => 30, 'promotional' => 20, 'behind-the-scenes' => 10],
            'instagram' => ['lifestyle' => 35, 'promotional' => 25, 'behind-the-scenes' => 25, 'user-generated' => 15],
            'tiktok' => ['entertainment' => 50, 'trending' => 30, 'educational' => 15, 'promotional' => 5],
            'twitter' => ['news' => 40, 'opinion' => 30, 'promotional' => 20, 'engagement' => 10],
            'facebook' => ['community' => 40, 'promotional' => 30, 'educational' => 20, 'entertainment' => 10],
        ];
        
        return $contentMix[$platform] ?? ['general' => 100];
    }

    protected function calculateEngagementGoal(string $platform, int $postsPerWeek): array
    {
        $baseEngagement = match ($platform) {
            'youtube' => 5.0,
            'instagram' => 3.5,
            'tiktok' => 8.0,
            'twitter' => 2.0,
            'facebook' => 2.5,
            default => 3.0,
        };
        
        return [
            'target_engagement_rate' => $baseEngagement . '%',
            'target_views_per_post' => rand(500, 2000),
            'target_growth_rate' => rand(10, 30) . '%',
        ];
    }

    protected function getKeySuccessFactors(string $platform): array
    {
        $factors = [
            'youtube' => ['High-quality thumbnails', 'Engaging titles', 'Consistent upload schedule'],
            'instagram' => ['Visual aesthetics', 'Story engagement', 'Hashtag strategy'],
            'tiktok' => ['Trend participation', 'Creative content', 'Consistent posting'],
            'twitter' => ['Timely content', 'Engagement with community', 'Hashtag usage'],
            'facebook' => ['Community building', 'Shareable content', 'Consistent posting'],
        ];
        
        return $factors[$platform] ?? ['Quality content', 'Consistent posting', 'Audience engagement'];
    }

    protected function calculatePotentialReach(string $platform, int $baseViews, float $growthRate): array
    {
        $currentReach = $baseViews;
        $projectedReach = round($currentReach * (1 + $growthRate));
        
        return [
            'current_reach' => $currentReach,
            'projected_reach' => $projectedReach,
            'growth_potential' => round($growthRate * 100) . '%',
        ];
    }

    protected function getFailsafeContentCalendar(int $userId, array $options): array
    {
        $startDate = Carbon::parse($options['start_date'] ?? 'now');
        $endDate = Carbon::parse($options['end_date'] ?? 'now')->addDays($options['days'] ?? 30);
        $platforms = $options['platforms'] ?? ['youtube', 'instagram', 'tiktok'];

        return [
            'user_id' => $userId,
            'has_data' => false,
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'total_days' => $startDate->diffInDays($endDate),
            ],
            'platforms' => $platforms,
            'optimal_schedule' => $this->generateBasicSchedule($startDate, $endDate, $platforms),
            'content_recommendations' => $this->getBasicContentRecommendations(),
            'trending_opportunities' => [],
            'engagement_predictions' => [],
            'content_gaps' => [],
            'seasonal_insights' => $this->getSeasonalInsights($startDate, $endDate),
            'posting_frequency' => $this->calculateOptimalPostingFrequency($platforms, $options, false),
            'performance_forecasts' => [],
            'setup_guide' => $this->getSetupGuide(),
            'calendar_score' => 30, // Basic score
            'status' => 'error',
            'error' => 'Failed to generate content calendar - showing basic recommendations',
        ];
    }

    // Helper methods for data analysis
    protected function inferContentType($video): string
    {
        $title = strtolower($video->title);
        $description = strtolower($video->description ?? '');
        $content = $title . ' ' . $description;

        if (str_contains($content, 'tutorial') || str_contains($content, 'how to') || str_contains($content, 'guide')) {
            return 'educational';
        }
        if (str_contains($content, 'funny') || str_contains($content, 'comedy') || str_contains($content, 'entertainment')) {
            return 'entertainment';
        }
        if (str_contains($content, 'review') || str_contains($content, 'unboxing')) {
            return 'review';
        }
        if (str_contains($content, 'behind') || str_contains($content, 'bts')) {
            return 'behind_the_scenes';
        }
        
        return 'general';
    }

    protected function calculatePlatformPerformanceScore($target): int
    {
        if ($target->status !== 'success') {
            return 0;
        }

        // Basic scoring based on successful publication
        $baseScore = 60;
        
        // Bonus for having platform video ID (means it was actually uploaded)
        if ($target->platform_video_id) {
            $baseScore += 20;
        }
        
        // Bonus for having platform URL (means it's accessible)
        if ($target->platform_url) {
            $baseScore += 10;
        }
        
        // Time-based scoring (more recent = potentially better)
        if ($target->publish_at) {
            $daysAgo = Carbon::parse($target->publish_at)->diffInDays(now());
            if ($daysAgo <= 7) {
                $baseScore += 10;
            }
        }

        return min(100, $baseScore);
    }

    protected function analyzePerformanceByDay(array $videoData): array
    {
        $dayPerformance = [];
        
        foreach ($videoData as $video) {
            if (empty($video['platforms'])) continue;
            
            $publishDate = Carbon::parse($video['created_at']);
            $dayOfWeek = strtolower($publishDate->format('l'));
            
            if (!isset($dayPerformance[$dayOfWeek])) {
                $dayPerformance[$dayOfWeek] = ['scores' => [], 'video_count' => 0];
            }
            
            $dayPerformance[$dayOfWeek]['scores'][] = $video['total_engagement'];
            $dayPerformance[$dayOfWeek]['video_count']++;
        }

        // Calculate average scores
        foreach ($dayPerformance as $day => $data) {
            $dayPerformance[$day]['score'] = !empty($data['scores']) 
                ? array_sum($data['scores']) / count($data['scores']) 
                : 50;
        }

        return $dayPerformance;
    }

    protected function analyzePerformanceByTime(array $videoData): array
    {
        $timePerformance = [];
        $defaultTimes = ['12:00', '18:00'];
        
        foreach (['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as $day) {
            $timePerformance[$day] = $defaultTimes; // Default times
        }

        // For now, return default times since we don't have detailed time data
        // In a real implementation, you'd analyze the actual posting times and their performance
        return $timePerformance;
    }

    protected function getPlatformPerformanceForDay(array $videoData, string $platform, string $dayOfWeek): array
    {
        $platformData = [
            'score' => 50,
            'count' => 0,
            'success_count' => 0,
            'success_rate' => 0,
            'best_times' => ['12:00', '18:00'],
        ];

        foreach ($videoData as $video) {
            if (empty($video['platforms'][$platform])) continue;
            
            $publishDate = Carbon::parse($video['created_at']);
            if (strtolower($publishDate->format('l')) !== $dayOfWeek) continue;
            
            $platformData['count']++;
            $score = $video['platforms'][$platform]['performance_score'];
            
            if ($score > 60) {
                $platformData['success_count']++;
            }
        }

        if ($platformData['count'] > 0) {
            $platformData['success_rate'] = ($platformData['success_count'] / $platformData['count']) * 100;
            $platformData['score'] = 50 + ($platformData['success_rate'] * 0.5); // Adjust score based on success rate
        }

        return $platformData;
    }

    protected function analyzeContentTypePerformance(array $videoData): array
    {
        $typePerformance = [];
        
        foreach ($videoData as $video) {
            $type = $video['content_type'];
            
            if (!isset($typePerformance[$type])) {
                $typePerformance[$type] = [
                    'scores' => [],
                    'durations' => [],
                    'titles' => [],
                    'platforms' => [],
                    'success_count' => 0,
                    'count' => 0,
                ];
            }
            
            $typePerformance[$type]['count']++;
            $typePerformance[$type]['scores'][] = $video['total_engagement'];
            $typePerformance[$type]['durations'][] = $video['duration'];
            $typePerformance[$type]['titles'][] = $video['title'];
            
            if ($video['total_engagement'] > 120) { // Threshold for "success"
                $typePerformance[$type]['success_count']++;
            }
            
            foreach ($video['platforms'] as $platform => $data) {
                if ($data['status'] === 'success') {
                    $typePerformance[$type]['platforms'][] = $platform;
                }
            }
        }

        // Calculate aggregated metrics
        foreach ($typePerformance as $type => $data) {
            $typePerformance[$type]['avg_score'] = !empty($data['scores']) 
                ? array_sum($data['scores']) / count($data['scores']) 
                : 0;
            $typePerformance[$type]['avg_duration'] = !empty($data['durations']) 
                ? array_sum($data['durations']) / count($data['durations']) 
                : 30;
            $typePerformance[$type]['success_rate'] = $data['count'] > 0 
                ? ($data['success_count'] / $data['count']) * 100 
                : 0;
            $typePerformance[$type]['best_platforms'] = !empty($data['platforms']) 
                ? array_unique($data['platforms']) 
                : [];
            $typePerformance[$type]['example_titles'] = array_slice($data['titles'], 0, 3);
        }

        return $typePerformance;
    }

    protected function suggestFrequency(array $data): string
    {
        if ($data['success_rate'] > 80) {
            return 'Daily';
        } elseif ($data['success_rate'] > 60) {
            return '4-5 times per week';
        } elseif ($data['success_rate'] > 40) {
            return '2-3 times per week';
        }
        
        return '1-2 times per week';
    }

    protected function assessDataQuality(int $videoCount, int $publishedCount, int $platformCount): string
    {
        $score = 0;
        
        if ($videoCount >= 10) $score += 3;
        elseif ($videoCount >= 5) $score += 2;
        elseif ($videoCount >= 1) $score += 1;
        
        if ($publishedCount >= 5) $score += 3;
        elseif ($publishedCount >= 3) $score += 2;
        elseif ($publishedCount >= 1) $score += 1;
        
        if ($platformCount >= 3) $score += 2;
        elseif ($platformCount >= 2) $score += 1;
        
        if ($score >= 7) return 'excellent';
        if ($score >= 5) return 'good';
        if ($score >= 3) return 'fair';
        return 'poor';
    }

    // Data-driven methods for users with video data
    protected function identifyTrendingOpportunitiesFromData(array $videoData): array
    {
        $opportunities = [];
        
        // Analyze what content types are working
        $contentTypePerformance = $this->analyzeContentTypePerformance($videoData);
        
        foreach ($contentTypePerformance as $type => $data) {
            if ($data['success_rate'] > 70 && $data['count'] >= 2) {
                $opportunities[] = [
                    'type' => 'content_type_success',
                    'title' => "More {$type} content",
                    'description' => "Your {$type} content has a {$data['success_rate']}% success rate",
                    'performance_score' => $data['avg_score'],
                    'recommended_action' => "Create more {$type} content similar to: " . implode(', ', array_slice($data['example_titles'], 0, 2)),
                    'confidence' => 'high',
                ];
            }
        }

        return $opportunities;
    }

    protected function predictEngagementTrendsFromData(array $videoData, Carbon $startDate, Carbon $endDate, array $platforms): array
    {
        $predictions = [];
        $currentDate = $startDate->copy();

        // Analyze historical performance by day
        $dayPerformance = $this->analyzePerformanceByDay($videoData);

        while ($currentDate->lte($endDate)) {
            $dayOfWeek = strtolower($currentDate->format('l'));
            $historicalData = $dayPerformance[$dayOfWeek] ?? ['score' => 50, 'video_count' => 0];
            
            $predictions[] = [
                'date' => $currentDate->toDateString(),
                'day_of_week' => $dayOfWeek,
                'predicted_engagement' => $historicalData['score'],
                'confidence' => $historicalData['video_count'] > 0 ? 'high' : 'low',
                'based_on_videos' => $historicalData['video_count'],
                'recommendation' => $historicalData['score'] > 70 ? 'Great day to post!' : 'Consider posting on higher-performing days',
            ];
            
            $currentDate->addDay();
        }

        return $predictions;
    }

    protected function analyzeContentGapsFromData(array $videoData, int $userId): array
    {
        $gaps = [];
        
        // Analyze content type distribution
        $contentTypes = [];
        foreach ($videoData as $video) {
            $type = $video['content_type'];
            $contentTypes[$type] = ($contentTypes[$type] ?? 0) + 1;
        }
        
        $recommendedTypes = ['educational', 'entertainment', 'behind_the_scenes', 'review'];
        foreach ($recommendedTypes as $type) {
            if (!isset($contentTypes[$type]) || $contentTypes[$type] < 2) {
                $gaps[] = [
                    'type' => 'content_type_gap',
                    'missing_type' => $type,
                    'current_count' => $contentTypes[$type] ?? 0,
                    'recommended_count' => 3,
                    'priority' => 'medium',
                    'suggestion' => "Try creating more {$type} content to diversify your content portfolio",
                ];
            }
        }

        return $gaps;
    }

    protected function generatePerformanceForecastsFromData(array $videoData, array $platforms): array
    {
        $forecasts = [];
        
        foreach ($platforms as $platform) {
            $platformVideos = array_filter($videoData, function ($video) use ($platform) {
                return isset($video['platforms'][$platform]) && $video['platforms'][$platform]['status'] === 'success';
            });
            
            if (empty($platformVideos)) {
                $forecasts[$platform] = [
                    'platform' => $platform,
                    'status' => 'no_data',
                    'message' => 'No published videos on this platform yet',
                ];
                continue;
            }
            
            $avgScore = array_sum(array_column($platformVideos, 'total_engagement')) / count($platformVideos);
            $successRate = (count($platformVideos) / count($videoData)) * 100;
            
            $forecasts[$platform] = [
                'platform' => $platform,
                'avg_performance_score' => round($avgScore, 1),
                'success_rate' => round($successRate, 1),
                'video_count' => count($platformVideos),
                'trend' => $avgScore > 70 ? 'positive' : ($avgScore > 50 ? 'stable' : 'needs_improvement'),
                'recommendation' => $this->getPlatformRecommendation($platform, $avgScore, $successRate),
            ];
        }
        
        return $forecasts;
    }

    protected function getBestPerformingContent(array $videoData): array
    {
        if (empty($videoData)) {
            return [];
        }
        
        // Sort by total engagement
        usort($videoData, function ($a, $b) {
            return $b['total_engagement'] <=> $a['total_engagement'];
        });
        
        return array_slice(array_map(function ($video) {
            return [
                'id' => $video['id'],
                'title' => $video['title'],
                'content_type' => $video['content_type'],
                'total_engagement' => $video['total_engagement'],
                'best_platform' => $video['best_platform'],
                'created_at' => $video['created_at']->format('Y-m-d'),
                'success_factors' => $this->identifySuccessFactors($video),
            ];
        }, $videoData), 0, 5);
    }

    protected function getPlatformInsights(array $videoData, array $platforms): array
    {
        $insights = [];
        
        foreach ($platforms as $platform) {
            $platformVideos = array_filter($videoData, function ($video) use ($platform) {
                return isset($video['platforms'][$platform]);
            });
            
            if (empty($platformVideos)) {
                $insights[$platform] = [
                    'platform' => $platform,
                    'status' => 'no_data',
                    'message' => 'No videos published to this platform',
                ];
                continue;
            }
            
            $successfulVideos = array_filter($platformVideos, function ($video) use ($platform) {
                return $video['platforms'][$platform]['status'] === 'success';
            });
            
            $insights[$platform] = [
                'platform' => $platform,
                'total_videos' => count($platformVideos),
                'successful_videos' => count($successfulVideos),
                'success_rate' => count($platformVideos) > 0 ? (count($successfulVideos) / count($platformVideos)) * 100 : 0,
                'avg_performance' => $this->calculateAveragePerformance($successfulVideos, $platform),
                'best_content_type' => $this->getBestContentTypeForPlatform($successfulVideos, $platform),
                'recommendations' => $this->getPlatformSpecificRecommendations($platform, $successfulVideos),
            ];
        }
        
        return $insights;
    }

    // Additional helper methods
    protected function getPlatformRecommendation(string $platform, float $avgScore, float $successRate): string
    {
        if ($avgScore > 80) {
            return "Excellent performance on {$platform}! Keep up the great work.";
        } elseif ($avgScore > 60) {
            return "Good performance on {$platform}. Consider optimizing posting times and content format.";
        } else {
            return "Performance on {$platform} needs improvement. Review successful content patterns and platform best practices.";
        }
    }

    protected function identifySuccessFactors(array $video): array
    {
        $factors = [];
        
        if ($video['duration'] <= 60) {
            $factors[] = 'Optimal duration (≤60 seconds)';
        }
        
        if (count($video['platforms']) > 2) {
            $factors[] = 'Multi-platform distribution';
        }
        
        if ($video['total_engagement'] > 150) {
            $factors[] = 'High engagement score';
        }
        
        return $factors;
    }

    protected function calculateAveragePerformance(array $videos, string $platform): float
    {
        if (empty($videos)) {
            return 0;
        }
        
        $scores = array_map(function ($video) use ($platform) {
            return $video['platforms'][$platform]['performance_score'] ?? 0;
        }, $videos);
        
        return array_sum($scores) / count($scores);
    }

    protected function getBestContentTypeForPlatform(array $videos, string $platform): string
    {
        if (empty($videos)) {
            return 'unknown';
        }
        
        $typeScores = [];
        foreach ($videos as $video) {
            $type = $video['content_type'];
            if (!isset($typeScores[$type])) {
                $typeScores[$type] = [];
            }
            $typeScores[$type][] = $video['platforms'][$platform]['performance_score'] ?? 0;
        }
        
        $bestType = 'general';
        $bestScore = 0;
        
        foreach ($typeScores as $type => $scores) {
            $avgScore = array_sum($scores) / count($scores);
            if ($avgScore > $bestScore) {
                $bestScore = $avgScore;
                $bestType = $type;
            }
        }
        
        return $bestType;
    }

    protected function getPlatformSpecificRecommendations(string $platform, array $videos): array
    {
        $recommendations = [];
        
        if (empty($videos)) {
            $recommendations[] = "Start publishing content to {$platform} to gather performance data";
            return $recommendations;
        }
        
        $avgDuration = array_sum(array_column($videos, 'duration')) / count($videos);
        if ($avgDuration > 60) {
            $recommendations[] = "Consider shorter videos (≤60 seconds) for better engagement on {$platform}";
        }
        
        $contentTypes = array_count_values(array_column($videos, 'content_type'));
        if (count($contentTypes) < 2) {
            $recommendations[] = "Diversify content types on {$platform} to reach different audience segments";
        }
        
        return $recommendations;
    }
}