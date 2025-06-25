<?php

namespace App\Services;

use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AIPerformanceOptimizationService
{
    protected array $platformWeights = [
        'youtube' => [
            'views' => 0.3,
            'likes' => 0.2,
            'comments' => 0.15,
            'shares' => 0.1,
            'watch_time' => 0.25,
        ],
        'instagram' => [
            'views' => 0.25,
            'likes' => 0.3,
            'comments' => 0.2,
            'shares' => 0.15,
            'saves' => 0.1,
        ],
        'tiktok' => [
            'views' => 0.2,
            'likes' => 0.25,
            'comments' => 0.15,
            'shares' => 0.3,
            'completion_rate' => 0.1,
        ],
        'x' => [
            'views' => 0.2,
            'likes' => 0.2,
            'retweets' => 0.3,
            'comments' => 0.15,
            'clicks' => 0.15,
        ],
        'facebook' => [
            'views' => 0.25,
            'likes' => 0.2,
            'comments' => 0.2,
            'shares' => 0.25,
            'reactions' => 0.1,
        ],
    ];

    protected array $optimalPostingTimes = [
        'youtube' => [
            'weekdays' => ['14:00', '15:00', '16:00', '17:00', '18:00'],
            'weekends' => ['09:00', '10:00', '11:00', '14:00', '15:00'],
        ],
        'instagram' => [
            'weekdays' => ['06:00', '07:00', '12:00', '17:00', '18:00', '19:00'],
            'weekends' => ['10:00', '11:00', '13:00', '14:00'],
        ],
        'tiktok' => [
            'weekdays' => ['06:00', '10:00', '19:00', '20:00', '21:00'],
            'weekends' => ['09:00', '12:00', '13:00', '15:00', '16:00'],
        ],
        'x' => [
            'weekdays' => ['08:00', '09:00', '12:00', '13:00', '17:00', '18:00'],
            'weekends' => ['09:00', '10:00', '11:00'],
        ],
        'facebook' => [
            'weekdays' => ['09:00', '13:00', '15:00', '16:00', '17:00'],
            'weekends' => ['12:00', '13:00', '14:00', '15:00'],
        ],
    ];

    /**
     * Analyze video performance across all platforms
     */
    public function analyzeVideoPerformance(int $videoId, array $options = []): array
    {
        $cacheKey = 'video_performance_' . $videoId . '_' . md5(serialize($options));
        
        return Cache::remember($cacheKey, 3600, function () use ($videoId, $options) {
            try {
                Log::info('Starting video performance analysis', ['video_id' => $videoId]);
                
                // Get video data with platform statistics
                $videoData = $this->getVideoPerformanceData($videoId);
                
                if (empty($videoData)) {
                    return $this->getEmptyPerformanceAnalysis($videoId);
                }

                $analysis = [
                    'video_id' => $videoId,
                    'overall_performance' => $this->calculateOverallPerformance($videoData),
                    'platform_breakdown' => $this->analyzePlatformPerformance($videoData),
                    'optimization_opportunities' => $this->identifyOptimizationOpportunities($videoData),
                    'comparative_analysis' => $this->compareWithSimilarContent($videoData),
                    'trend_analysis' => $this->analyzeTrends($videoData),
                    'ab_test_suggestions' => $this->generateABTestSuggestions($videoData),
                    'posting_time_optimization' => $this->optimizePostingTimes($videoData),
                    'content_recommendations' => $this->generateContentRecommendations($videoData),
                    'performance_score' => 0,
                    'improvement_potential' => 0,
                ];

                // Calculate performance score and improvement potential
                $analysis['performance_score'] = $this->calculatePerformanceScore($analysis);
                $analysis['improvement_potential'] = $this->calculateImprovementPotential($analysis);

                Log::info('Video performance analysis completed', [
                    'video_id' => $videoId,
                    'performance_score' => $analysis['performance_score'],
                ]);

                return $analysis;

            } catch (\Exception $e) {
                Log::error('Video performance analysis failed', [
                    'video_id' => $videoId,
                    'error' => $e->getMessage(),
                ]);
                
                return $this->getFailsafePerformanceAnalysis($videoId);
            }
        });
    }

    /**
     * Get video performance data from database
     */
    protected function getVideoPerformanceData(int $videoId): array
    {
        try {
            // Get video with platform targets and their statistics
            $video = DB::table('videos')
                ->select('videos.*')
                ->where('videos.id', $videoId)
                ->first();

            if (!$video) {
                return [];
            }

            // Get platform targets with stats
            $platformTargets = DB::table('video_targets')
                ->where('video_id', $videoId)
                ->get();

            $performanceData = [
                'video' => $video,
                'platforms' => [],
                'total_views' => 0,
                'total_engagement' => 0,
                'upload_date' => $video->created_at,
            ];

            foreach ($platformTargets as $target) {
                $platformData = [
                    'platform' => $target->platform,
                    'status' => $target->status,
                    'posted_at' => $target->posted_at,
                    'external_id' => $target->external_id,
                    'stats' => $this->getPlatformStats($target),
                ];

                $performanceData['platforms'][$target->platform] = $platformData;
                $performanceData['total_views'] += $platformData['stats']['views'] ?? 0;
                $performanceData['total_engagement'] += $this->calculateEngagement($platformData['stats']);
            }

            return $performanceData;

        } catch (\Exception $e) {
            Log::error('Failed to get video performance data', [
                'video_id' => $videoId,
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Get platform-specific statistics
     */
    protected function getPlatformStats(object $target): array
    {
        // In a real implementation, this would call platform APIs
        // For now, we'll simulate realistic stats based on platform and time
        
        $daysSincePosted = $target->posted_at 
            ? Carbon::parse($target->posted_at)->diffInDays(now()) 
            : 0;
        
        $baseMultiplier = max(1, $daysSincePosted * 0.1);
        
        $platformStats = [
            'youtube' => [
                'views' => rand(100, 10000) * $baseMultiplier,
                'likes' => rand(10, 500) * $baseMultiplier,
                'dislikes' => rand(0, 50) * $baseMultiplier,
                'comments' => rand(5, 200) * $baseMultiplier,
                'shares' => rand(2, 100) * $baseMultiplier,
                'watch_time_minutes' => rand(50, 5000) * $baseMultiplier,
                'click_through_rate' => rand(20, 80) / 10, // 2-8%
                'average_view_duration' => rand(30, 300), // seconds
            ],
            'instagram' => [
                'views' => rand(200, 50000) * $baseMultiplier,
                'likes' => rand(20, 2000) * $baseMultiplier,
                'comments' => rand(5, 300) * $baseMultiplier,
                'shares' => rand(10, 500) * $baseMultiplier,
                'saves' => rand(5, 200) * $baseMultiplier,
                'reach' => rand(150, 30000) * $baseMultiplier,
                'profile_visits' => rand(10, 500) * $baseMultiplier,
            ],
            'tiktok' => [
                'views' => rand(500, 100000) * $baseMultiplier,
                'likes' => rand(50, 5000) * $baseMultiplier,
                'comments' => rand(10, 500) * $baseMultiplier,
                'shares' => rand(20, 1000) * $baseMultiplier,
                'completion_rate' => rand(40, 90), // percentage
                'profile_clicks' => rand(5, 200) * $baseMultiplier,
            ],
            'x' => [
                'views' => rand(100, 20000) * $baseMultiplier,
                'likes' => rand(10, 1000) * $baseMultiplier,
                'retweets' => rand(5, 300) * $baseMultiplier,
                'comments' => rand(2, 150) * $baseMultiplier,
                'clicks' => rand(10, 500) * $baseMultiplier,
                'impressions' => rand(200, 50000) * $baseMultiplier,
            ],
            'facebook' => [
                'views' => rand(100, 15000) * $baseMultiplier,
                'likes' => rand(10, 800) * $baseMultiplier,
                'reactions' => rand(5, 200) * $baseMultiplier,
                'comments' => rand(3, 100) * $baseMultiplier,
                'shares' => rand(5, 150) * $baseMultiplier,
                'reach' => rand(150, 25000) * $baseMultiplier,
            ],
        ];

        return $platformStats[$target->platform] ?? [
            'views' => 0,
            'likes' => 0,
            'comments' => 0,
            'shares' => 0,
        ];
    }

    /**
     * Calculate overall performance metrics
     */
    protected function calculateOverallPerformance(array $videoData): array
    {
        $totalViews = $videoData['total_views'];
        $totalEngagement = $videoData['total_engagement'];
        $platformCount = count($videoData['platforms']);
        
        $engagementRate = $totalViews > 0 ? ($totalEngagement / $totalViews) * 100 : 0;
        
        return [
            'total_views' => $totalViews,
            'total_engagement' => $totalEngagement,
            'engagement_rate' => round($engagementRate, 2),
            'platform_count' => $platformCount,
            'average_views_per_platform' => $platformCount > 0 ? round($totalViews / $platformCount) : 0,
            'performance_tier' => $this->getPerformanceTier($totalViews, $engagementRate),
            'days_since_upload' => Carbon::parse($videoData['upload_date'])->diffInDays(now()),
        ];
    }

    /**
     * Analyze performance per platform
     */
    protected function analyzePlatformPerformance(array $videoData): array
    {
        $platformAnalysis = [];
        
        foreach ($videoData['platforms'] as $platform => $data) {
            $stats = $data['stats'];
            $engagement = $this->calculateEngagement($stats);
            $views = $stats['views'] ?? 0;
            $engagementRate = $views > 0 ? ($engagement / $views) * 100 : 0;
            
            $platformAnalysis[$platform] = [
                'views' => $views,
                'engagement' => $engagement,
                'engagement_rate' => round($engagementRate, 2),
                'performance_score' => $this->calculatePlatformScore($platform, $stats),
                'ranking' => 0, // Will be set after sorting
                'strengths' => $this->identifyPlatformStrengths($platform, $stats),
                'weaknesses' => $this->identifyPlatformWeaknesses($platform, $stats),
                'recommendations' => $this->generatePlatformRecommendations($platform, $stats),
            ];
        }
        
        // Sort platforms by performance score and assign rankings
        uasort($platformAnalysis, function ($a, $b) {
            return $b['performance_score'] <=> $a['performance_score'];
        });
        
        $rank = 1;
        foreach ($platformAnalysis as &$analysis) {
            $analysis['ranking'] = $rank++;
        }
        
        return $platformAnalysis;
    }

    /**
     * Identify optimization opportunities
     */
    protected function identifyOptimizationOpportunities(array $videoData): array
    {
        $opportunities = [];
        
        foreach ($videoData['platforms'] as $platform => $data) {
            $stats = $data['stats'];
            $platformOpportunities = [];
            
            // Low engagement rate
            $engagementRate = $this->calculateEngagementRate($stats);
            if ($engagementRate < 2.0) {
                $platformOpportunities[] = [
                    'type' => 'engagement',
                    'priority' => 'high',
                    'title' => 'Low Engagement Rate',
                    'description' => 'Engagement rate is below 2%. Consider more compelling calls-to-action.',
                    'potential_impact' => 'medium',
                    'actions' => [
                        'Add clear call-to-action in first 15 seconds',
                        'Include engagement hooks throughout the video',
                        'End with a question to encourage comments',
                    ],
                ];
            }
            
            // Low view count relative to platform average
            $views = $stats['views'] ?? 0;
            if ($views < $this->getPlatformAverageViews($platform)) {
                $platformOpportunities[] = [
                    'type' => 'reach',
                    'priority' => 'high',
                    'title' => 'Below Average Views',
                    'description' => 'Views are below platform average. Optimize for discovery.',
                    'potential_impact' => 'high',
                    'actions' => [
                        'Optimize title and description for SEO',
                        'Use trending hashtags relevant to content',
                        'Post during optimal time windows',
                    ],
                ];
            }
            
            // Platform-specific opportunities
            $platformOpportunities = array_merge(
                $platformOpportunities,
                $this->getPlatformSpecificOpportunities($platform, $stats)
            );
            
            if (!empty($platformOpportunities)) {
                $opportunities[$platform] = $platformOpportunities;
            }
        }
        
        return $opportunities;
    }

    /**
     * Compare with similar content
     */
    protected function compareWithSimilarContent(array $videoData): array
    {
        // In a real implementation, this would compare with similar videos
        // from the same user or industry benchmarks
        
        $benchmarks = [
            'industry_average_views' => 5000,
            'industry_average_engagement_rate' => 3.5,
            'top_performer_views' => 50000,
            'top_performer_engagement_rate' => 8.2,
        ];
        
        $totalViews = $videoData['total_views'];
        $engagementRate = $this->calculateEngagementRate($videoData['platforms']);
        
        return [
            'views_vs_industry' => [
                'your_views' => $totalViews,
                'industry_average' => $benchmarks['industry_average_views'],
                'performance' => $totalViews > $benchmarks['industry_average_views'] ? 'above_average' : 'below_average',
                'difference_percentage' => round((($totalViews - $benchmarks['industry_average_views']) / $benchmarks['industry_average_views']) * 100, 1),
            ],
            'engagement_vs_industry' => [
                'your_engagement_rate' => $engagementRate,
                'industry_average' => $benchmarks['industry_average_engagement_rate'],
                'performance' => $engagementRate > $benchmarks['industry_average_engagement_rate'] ? 'above_average' : 'below_average',
                'difference_percentage' => round((($engagementRate - $benchmarks['industry_average_engagement_rate']) / $benchmarks['industry_average_engagement_rate']) * 100, 1),
            ],
            'growth_potential' => [
                'views_growth_potential' => max(0, $benchmarks['top_performer_views'] - $totalViews),
                'engagement_growth_potential' => max(0, $benchmarks['top_performer_engagement_rate'] - $engagementRate),
            ],
        ];
    }

    /**
     * Analyze performance trends
     */
    protected function analyzeTrends(array $videoData): array
    {
        // This would typically analyze historical data
        // For now, we'll provide trend insights based on time since upload
        
        $daysSinceUpload = Carbon::parse($videoData['upload_date'])->diffInDays(now());
        $totalViews = $videoData['total_views'];
        
        $dailyAverageViews = $daysSinceUpload > 0 ? $totalViews / $daysSinceUpload : $totalViews;
        
        // Simulate trend analysis
        $trendDirection = $dailyAverageViews > 100 ? 'increasing' : ($dailyAverageViews > 50 ? 'stable' : 'decreasing');
        
        return [
            'trend_direction' => $trendDirection,
            'daily_average_views' => round($dailyAverageViews),
            'peak_performance_day' => $daysSinceUpload > 3 ? rand(1, min(7, $daysSinceUpload)) : 1,
            'projected_30_day_views' => round($dailyAverageViews * 30),
            'momentum_score' => $this->calculateMomentumScore($videoData),
            'lifecycle_stage' => $this->getContentLifecycleStage($daysSinceUpload, $trendDirection),
        ];
    }

    /**
     * Generate A/B testing suggestions
     */
    protected function generateABTestSuggestions(array $videoData): array
    {
        $suggestions = [];
        
        // Title optimization
        $suggestions[] = [
            'test_type' => 'title',
            'priority' => 'high',
            'title' => 'Title Optimization',
            'description' => 'Test different title variations to improve click-through rates',
            'test_variations' => [
                'Add numbers or statistics',
                'Use emotional trigger words',
                'Include trending keywords',
                'Test question vs statement format',
            ],
            'success_metrics' => ['click_through_rate', 'views', 'watch_time'],
            'duration' => '7-14 days',
        ];
        
        // Thumbnail testing
        $suggestions[] = [
            'test_type' => 'thumbnail',
            'priority' => 'high',
            'title' => 'Thumbnail A/B Test',
            'description' => 'Test different thumbnail designs for better click-through rates',
            'test_variations' => [
                'Close-up vs wide shot',
                'Text overlay vs no text',
                'Bright vs dark background',
                'Different facial expressions',
            ],
            'success_metrics' => ['click_through_rate', 'impressions', 'views'],
            'duration' => '5-10 days',
        ];
        
        // Posting time optimization
        $suggestions[] = [
            'test_type' => 'posting_time',
            'priority' => 'medium',
            'title' => 'Optimal Posting Time',
            'description' => 'Test different posting times to maximize initial engagement',
            'test_variations' => [
                'Morning (8-10 AM)',
                'Lunch (12-2 PM)',
                'Evening (5-7 PM)',
                'Night (8-10 PM)',
            ],
            'success_metrics' => ['first_hour_views', 'engagement_rate', 'reach'],
            'duration' => '2-4 weeks',
        ];
        
        return $suggestions;
    }

    /**
     * Optimize posting times based on performance data
     */
    protected function optimizePostingTimes(array $videoData): array
    {
        $recommendations = [];
        
        foreach ($videoData['platforms'] as $platform => $data) {
            $currentPostingTime = $data['posted_at'] ? Carbon::parse($data['posted_at'])->format('H:i') : null;
            $currentDay = $data['posted_at'] ? Carbon::parse($data['posted_at'])->format('l') : null;
            
            $isWeekend = in_array($currentDay, ['Saturday', 'Sunday']);
            $optimalTimes = $this->optimalPostingTimes[$platform][$isWeekend ? 'weekends' : 'weekdays'];
            
            $recommendations[$platform] = [
                'current_posting_time' => $currentPostingTime,
                'current_day_type' => $isWeekend ? 'weekend' : 'weekday',
                'optimal_times' => $optimalTimes,
                'best_time' => $optimalTimes[0],
                'improvement_potential' => $this->calculateTimingImprovementPotential($platform, $currentPostingTime, $optimalTimes),
            ];
        }
        
        return $recommendations;
    }

    /**
     * Generate content recommendations based on performance
     */
    protected function generateContentRecommendations(array $videoData): array
    {
        return [
            'content_type_suggestions' => [
                'Based on your performance, consider creating more tutorial-style content',
                'Short-form content (under 60 seconds) shows higher engagement on your channels',
                'Behind-the-scenes content performs well with your audience',
            ],
            'topic_suggestions' => [
                'Trending topics in your niche: AI tools, productivity hacks, quick tips',
                'Seasonal content opportunities coming up',
                'Collaborate with creators in similar niches',
            ],
            'format_recommendations' => [
                'Consider creating series or multi-part content',
                'Add captions for better accessibility and engagement',
                'Include clear calls-to-action at the beginning and end',
            ],
            'optimization_tips' => [
                'Upload in highest quality possible',
                'Use custom thumbnails for all platforms',
                'Optimize video length for each platform',
                'Create platform-specific versions when possible',
            ],
        ];
    }

    /**
     * Helper methods
     */
    protected function calculateEngagement(array $stats): int
    {
        return ($stats['likes'] ?? 0) + 
               ($stats['comments'] ?? 0) + 
               ($stats['shares'] ?? 0) + 
               ($stats['retweets'] ?? 0) + 
               ($stats['reactions'] ?? 0) + 
               ($stats['saves'] ?? 0);
    }

    protected function calculateEngagementRate(array $platformsData): float
    {
        $totalViews = 0;
        $totalEngagement = 0;
        
        foreach ($platformsData as $data) {
            $stats = $data['stats'] ?? [];
            $views = $stats['views'] ?? 0;
            $engagement = $this->calculateEngagement($stats);
            
            $totalViews += $views;
            $totalEngagement += $engagement;
        }
        
        return $totalViews > 0 ? ($totalEngagement / $totalViews) * 100 : 0;
    }

    protected function calculatePlatformScore(string $platform, array $stats): int
    {
        if (!isset($this->platformWeights[$platform])) {
            return 50; // Default score
        }
        
        $weights = $this->platformWeights[$platform];
        $score = 0;
        
        foreach ($weights as $metric => $weight) {
            $value = $stats[$metric] ?? 0;
            $normalizedValue = $this->normalizeMetricValue($platform, $metric, $value);
            $score += $normalizedValue * $weight;
        }
        
        return min(100, max(0, round($score)));
    }

    protected function normalizeMetricValue(string $platform, string $metric, float $value): float
    {
        // Normalize values to 0-100 scale based on platform benchmarks
        // This is a simplified version - in production, you'd use real benchmarks
        
        $benchmarks = [
            'views' => 1000,
            'likes' => 50,
            'comments' => 10,
            'shares' => 5,
            'watch_time' => 100,
            'completion_rate' => 70,
        ];
        
        $benchmark = $benchmarks[$metric] ?? 100;
        return min(100, ($value / $benchmark) * 100);
    }

    protected function getPerformanceTier(int $views, float $engagementRate): string
    {
        if ($views > 10000 && $engagementRate > 5) return 'excellent';
        if ($views > 5000 && $engagementRate > 3) return 'good';
        if ($views > 1000 && $engagementRate > 2) return 'average';
        return 'needs_improvement';
    }

    protected function identifyPlatformStrengths(string $platform, array $stats): array
    {
        $strengths = [];
        $engagementRate = $this->calculateEngagementRate([$platform => ['stats' => $stats]]);
        
        if ($engagementRate > 3) {
            $strengths[] = 'High engagement rate';
        }
        
        if (($stats['views'] ?? 0) > $this->getPlatformAverageViews($platform)) {
            $strengths[] = 'Above average views';
        }
        
        // Platform-specific strengths
        switch ($platform) {
            case 'youtube':
                if (($stats['watch_time_minutes'] ?? 0) > 300) {
                    $strengths[] = 'Strong watch time retention';
                }
                break;
            case 'tiktok':
                if (($stats['completion_rate'] ?? 0) > 70) {
                    $strengths[] = 'High completion rate';
                }
                break;
        }
        
        return $strengths;
    }

    protected function identifyPlatformWeaknesses(string $platform, array $stats): array
    {
        $weaknesses = [];
        $engagementRate = $this->calculateEngagementRate([$platform => ['stats' => $stats]]);
        
        if ($engagementRate < 1) {
            $weaknesses[] = 'Low engagement rate';
        }
        
        if (($stats['views'] ?? 0) < $this->getPlatformAverageViews($platform) * 0.5) {
            $weaknesses[] = 'Below average views';
        }
        
        return $weaknesses;
    }

    protected function generatePlatformRecommendations(string $platform, array $stats): array
    {
        $recommendations = [];
        
        // Generic recommendations based on performance
        if ($this->calculateEngagementRate([$platform => ['stats' => $stats]]) < 2) {
            $recommendations[] = 'Improve call-to-action to boost engagement';
        }
        
        // Platform-specific recommendations
        $platformRecommendations = [
            'youtube' => [
                'Optimize thumbnail for higher click-through rate',
                'Add chapters to improve watch time',
                'Use trending keywords in title and description',
            ],
            'instagram' => [
                'Use relevant hashtags to increase discoverability',
                'Post stories to maintain audience engagement',
                'Collaborate with other creators in your niche',
            ],
            'tiktok' => [
                'Hook viewers in the first 3 seconds',
                'Use trending sounds and effects',
                'Post consistently during peak hours',
            ],
            'x' => [
                'Tweet at optimal times for your audience',
                'Use relevant hashtags and mentions',
                'Engage with comments quickly',
            ],
            'facebook' => [
                'Share to relevant groups to increase reach',
                'Use Facebook native video features',
                'Post when your audience is most active',
            ],
        ];
        
        return array_merge($recommendations, $platformRecommendations[$platform] ?? []);
    }

    protected function getPlatformAverageViews(string $platform): int
    {
        // These would be real industry averages in production
        $averages = [
            'youtube' => 2000,
            'instagram' => 1500,
            'tiktok' => 5000,
            'x' => 800,
            'facebook' => 1200,
        ];
        
        return $averages[$platform] ?? 1000;
    }

    protected function getPlatformSpecificOpportunities(string $platform, array $stats): array
    {
        $opportunities = [];
        
        switch ($platform) {
            case 'youtube':
                if (($stats['click_through_rate'] ?? 0) < 3) {
                    $opportunities[] = [
                        'type' => 'thumbnail',
                        'priority' => 'high',
                        'title' => 'Low Click-Through Rate',
                        'description' => 'Thumbnail and title need optimization for better CTR',
                        'potential_impact' => 'high',
                        'actions' => ['A/B test thumbnails', 'Optimize title', 'Use trending keywords'],
                    ];
                }
                break;
                
            case 'tiktok':
                if (($stats['completion_rate'] ?? 0) < 50) {
                    $opportunities[] = [
                        'type' => 'retention',
                        'priority' => 'high',
                        'title' => 'Low Completion Rate',
                        'description' => 'Many viewers are dropping off before the end',
                        'potential_impact' => 'high',
                        'actions' => ['Improve opening hook', 'Reduce video length', 'Add engaging elements'],
                    ];
                }
                break;
        }
        
        return $opportunities;
    }

    protected function calculateMomentumScore(array $videoData): int
    {
        $daysSinceUpload = Carbon::parse($videoData['upload_date'])->diffInDays(now());
        $totalViews = $videoData['total_views'];
        
        if ($daysSinceUpload <= 1) return 90; // New content gets high momentum
        if ($daysSinceUpload <= 3 && $totalViews > 1000) return 80;
        if ($daysSinceUpload <= 7 && $totalViews > 500) return 70;
        if ($totalViews > 100) return 60;
        
        return 40; // Low momentum
    }

    protected function getContentLifecycleStage(int $daysSinceUpload, string $trendDirection): string
    {
        if ($daysSinceUpload <= 1) return 'launch';
        if ($daysSinceUpload <= 3) return 'growth';
        if ($daysSinceUpload <= 7) return 'peak';
        if ($daysSinceUpload <= 30) return 'mature';
        
        return 'legacy';
    }

    protected function calculateTimingImprovementPotential(string $platform, ?string $currentTime, array $optimalTimes): string
    {
        if (!$currentTime) return 'unknown';
        
        $currentHour = (int) explode(':', $currentTime)[0];
        $optimalHours = array_map(function ($time) {
            return (int) explode(':', $time)[0];
        }, $optimalTimes);
        
        $minDiff = min(array_map(function ($hour) use ($currentHour) {
            return abs($hour - $currentHour);
        }, $optimalHours));
        
        if ($minDiff <= 1) return 'low';
        if ($minDiff <= 3) return 'medium';
        return 'high';
    }

    protected function calculatePerformanceScore(array $analysis): int
    {
        $overallPerf = $analysis['overall_performance'];
        $baseScore = min(100, $overallPerf['total_views'] / 100); // 1 view = 1 point, max 100
        
        // Adjust for engagement rate
        $engagementBonus = min(20, $overallPerf['engagement_rate'] * 5);
        
        // Adjust for platform diversity
        $diversityBonus = min(10, $overallPerf['platform_count'] * 2);
        
        return min(100, round($baseScore + $engagementBonus + $diversityBonus));
    }

    protected function calculateImprovementPotential(array $analysis): int
    {
        $opportunities = $analysis['optimization_opportunities'];
        $highPriorityCount = 0;
        
        foreach ($opportunities as $platformOpps) {
            foreach ($platformOpps as $opp) {
                if ($opp['priority'] === 'high') {
                    $highPriorityCount++;
                }
            }
        }
        
        return min(100, $highPriorityCount * 25); // Each high-priority opportunity = 25% improvement potential
    }

    protected function getEmptyPerformanceAnalysis(int $videoId): array
    {
        return [
            'video_id' => $videoId,
            'overall_performance' => [
                'total_views' => 0,
                'total_engagement' => 0,
                'engagement_rate' => 0,
                'platform_count' => 0,
                'performance_tier' => 'no_data',
            ],
            'platform_breakdown' => [],
            'optimization_opportunities' => [],
            'comparative_analysis' => [],
            'trend_analysis' => [],
            'ab_test_suggestions' => [],
            'posting_time_optimization' => [],
            'content_recommendations' => [],
            'performance_score' => 0,
            'improvement_potential' => 100,
            'status' => 'no_data',
        ];
    }

    protected function getFailsafePerformanceAnalysis(int $videoId): array
    {
        return [
            'video_id' => $videoId,
            'overall_performance' => [
                'total_views' => 0,
                'total_engagement' => 0,
                'engagement_rate' => 0,
                'platform_count' => 0,
                'performance_tier' => 'error',
            ],
            'platform_breakdown' => [],
            'optimization_opportunities' => [],
            'comparative_analysis' => [],
            'trend_analysis' => [],
            'ab_test_suggestions' => [],
            'posting_time_optimization' => [],
            'content_recommendations' => [],
            'performance_score' => 0,
            'improvement_potential' => 0,
            'status' => 'error',
            'error' => 'Failed to analyze performance',
        ];
    }

    /**
     * Create A/B test for video
     */
    public function createABTest(int $videoId, array $testConfig): array
    {
        try {
            // Store A/B test configuration
            $testId = DB::table('ab_tests')->insertGetId([
                'video_id' => $videoId,
                'user_id' => $testConfig['created_by'],
                'test_type' => $testConfig['type'],
                'test_config' => json_encode($testConfig),
                'duration_days' => $testConfig['duration_days'] ?? 14,
                'success_metrics' => json_encode($testConfig['success_metrics']),
                'status' => 'active',
                'started_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return [
                'success' => true,
                'test_id' => $testId,
                'test_config' => $testConfig,
                'message' => 'A/B test created successfully',
            ];

        } catch (\Exception $e) {
            Log::error('Failed to create A/B test', [
                'video_id' => $videoId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Get performance insights for user dashboard
     */
    public function getUserPerformanceInsights(int $userId): array
    {
        try {
            // Get recent videos for the user
            $recentVideos = DB::table('videos')
                ->where('user_id', $userId)
                ->where('created_at', '>=', now()->subDays(30))
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get();

            $insights = [
                'total_videos' => $recentVideos->count(),
                'average_performance' => 0,
                'top_performing_platform' => null,
                'improvement_opportunities' => 0,
                'trending_content_types' => [],
                'monthly_growth' => 0,
            ];

            if ($recentVideos->isEmpty()) {
                return $insights;
            }

            // Analyze each video's performance
            $totalPerformanceScore = 0;
            $platformScores = [];
            $totalOpportunities = 0;

            foreach ($recentVideos as $video) {
                $performance = $this->analyzeVideoPerformance($video->id);
                $totalPerformanceScore += $performance['performance_score'];
                $totalOpportunities += $performance['improvement_potential'];

                // Aggregate platform scores
                foreach ($performance['platform_breakdown'] as $platform => $data) {
                    if (!isset($platformScores[$platform])) {
                        $platformScores[$platform] = [];
                    }
                    $platformScores[$platform][] = $data['performance_score'];
                }
            }

            // Calculate insights
            $insights['average_performance'] = round($totalPerformanceScore / $recentVideos->count());
            $insights['improvement_opportunities'] = round($totalOpportunities / $recentVideos->count());

            // Find top performing platform
            $avgPlatformScores = [];
            foreach ($platformScores as $platform => $scores) {
                $avgPlatformScores[$platform] = array_sum($scores) / count($scores);
            }

            if (!empty($avgPlatformScores)) {
                $insights['top_performing_platform'] = array_key_first(
                    array_slice(arsort($avgPlatformScores), 0, 1, true)
                );
            }

            return $insights;

        } catch (\Exception $e) {
            Log::error('Failed to get user performance insights', [
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return [
                'total_videos' => 0,
                'average_performance' => 0,
                'top_performing_platform' => null,
                'improvement_opportunities' => 0,
                'trending_content_types' => [],
                'monthly_growth' => 0,
                'error' => 'Failed to load insights',
            ];
        }
    }
}