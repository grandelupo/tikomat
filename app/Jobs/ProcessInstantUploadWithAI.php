<?php

namespace App\Jobs;

use App\Models\Video;
use App\Models\VideoTarget;
use App\Services\AIVideoAnalyzerService;
use App\Services\AIWatermarkRemoverService;
use App\Services\AISubtitleGeneratorService;
use App\Services\VideoUploadService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessInstantUploadWithAI implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Video $video;
    protected array $platforms;

    /**
     * Create a new job instance.
     */
    public function __construct(Video $video, array $platforms)
    {
        $this->video = $video;
        $this->platforms = $platforms;
    }

    /**
     * Execute the job.
     */
    public function handle(
        AIVideoAnalyzerService $videoAnalyzer,
        AIWatermarkRemoverService $watermarkRemover,
        AISubtitleGeneratorService $subtitleGenerator,
        VideoUploadService $uploadService
    ): void {
        try {
            Log::info('Processing instant upload with AI', [
                'video_id' => $this->video->id,
                'platforms' => $this->platforms,
            ]);

            // Get video file path
            $videoPath = Storage::path($this->video->original_file_path);
            
            if (!file_exists($videoPath)) {
                Log::error('Video file not found for AI processing', [
                    'video_id' => $this->video->id,
                    'file_path' => $videoPath,
                ]);
                $this->handleProcessingFailure('Video file not found');
                return;
            }

            // Step 1: Comprehensive video analysis with fallback
            $analysis = [];
            try {
                $analysis = $videoAnalyzer->analyzeVideo($videoPath, [
                    'include_transcript' => true,
                    'include_scenes' => true,
                    'include_mood' => true,
                    'include_quality' => true,
                ]);

                Log::info('Video analysis completed', [
                    'video_id' => $this->video->id,
                    'quality_score' => $analysis['quality_score']['overall_score'] ?? 'unknown',
                ]);
            } catch (\Exception $e) {
                Log::warning('Video analysis failed, using fallback', [
                    'video_id' => $this->video->id,
                    'error' => $e->getMessage(),
                ]);
                $analysis = $this->getFallbackAnalysis();
            }

            // Step 2: Generate optimized metadata based on analysis
            $optimizedContent = $this->generateOptimizedContent($analysis);

            Log::info('Generated optimized content', [
                'video_id' => $this->video->id,
                'title' => $optimizedContent['title'],
                'description_length' => strlen($optimizedContent['description']),
                'tags_count' => count($optimizedContent['tags'] ?? []),
            ]);

            // Step 3: Detect watermarks with error handling
            $needsWatermarkRemoval = false;
            try {
                $watermarkDetection = $watermarkRemover->detectWatermarks($videoPath, [
                    'sensitivity' => 'high',
                    'include_metadata' => true,
                ]);

                $needsWatermarkRemoval = !empty($watermarkDetection['detected_watermarks']);
            } catch (\Exception $e) {
                Log::warning('Watermark detection failed', [
                    'video_id' => $this->video->id,
                    'error' => $e->getMessage(),
                ]);
            }

            // Step 4: Determine if subtitles are needed
            $needsSubtitles = $this->shouldGenerateSubtitles($analysis);

            // Step 5: Process watermark removal if needed
            $processedVideoPath = $videoPath;
            if ($needsWatermarkRemoval) {
                try {
                    Log::info('Watermarks detected, processing removal', [
                        'video_id' => $this->video->id,
                        'watermarks_count' => count($watermarkDetection['detected_watermarks']),
                    ]);

                    $removalResult = $watermarkRemover->removeWatermarks(
                        $videoPath,
                        $watermarkDetection['detected_watermarks'],
                        ['quality' => 'high', 'method' => 'inpainting']
                    );

                    if ($removalResult['processing_status'] === 'completed' && !empty($removalResult['cleaned_video_path'])) {
                        $processedVideoPath = $removalResult['cleaned_video_path'];
                        
                        // Update video with processed file
                        $newStoragePath = 'videos/cleaned_' . basename($processedVideoPath);
                        Storage::put($newStoragePath, file_get_contents($processedVideoPath));
                        $this->video->update(['original_file_path' => $newStoragePath]);
                        
                        Log::info('Watermark removal completed', [
                            'video_id' => $this->video->id,
                            'cleaned_path' => $newStoragePath,
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::warning('Watermark removal failed', [
                        'video_id' => $this->video->id,
                        'error' => $e->getMessage(),
                    ]);
                    $needsWatermarkRemoval = false; // Reset flag
                }
            }

            // Step 6: Generate subtitles if needed
            if ($needsSubtitles) {
                try {
                    Log::info('Generating subtitles for instant upload', [
                        'video_id' => $this->video->id,
                    ]);

                    $subtitleResult = $subtitleGenerator->generateSubtitles(
                        $this->video->id,
                        [
                            'language' => 'auto',
                            'style' => $this->getOptimalSubtitleStyle($analysis),
                            'position' => 'bottom',
                        ]
                    );

                    if ($subtitleResult['success']) {
                        Log::info('Subtitles generated successfully', [
                            'video_id' => $this->video->id,
                            'generation_id' => $subtitleResult['generation_id'] ?? 'unknown',
                        ]);
                    }
                } catch (\Exception $e) {
                    Log::warning('Subtitle generation failed', [
                        'video_id' => $this->video->id,
                        'error' => $e->getMessage(),
                    ]);
                    $needsSubtitles = false; // Reset flag
                }
            }

            // Step 7: Update video metadata with AI-generated content
            $this->video->update([
                'title' => $optimizedContent['title'],
                'description' => $optimizedContent['description'],
            ]);

            // Step 8: Create video targets for all platforms with optimized settings
            foreach ($this->platforms as $platform) {
                $platformSettings = $this->generatePlatformSettings($platform, $analysis, $optimizedContent);
                
                $target = VideoTarget::create([
                    'video_id' => $this->video->id,
                    'platform' => $platform,
                    'status' => 'pending',
                    'publish_at' => now(),
                    'advanced_options' => $platformSettings,
                ]);

                Log::info('Video target created for instant upload', [
                    'video_id' => $this->video->id,
                    'target_id' => $target->id,
                    'platform' => $platform,
                ]);

                // Dispatch upload job
                $uploadService->dispatchUploadJob($target);
            }

            Log::info('Instant upload AI processing completed successfully', [
                'video_id' => $this->video->id,
                'platforms_count' => count($this->platforms),
                'watermark_removal' => $needsWatermarkRemoval ? 'applied' : 'not_needed',
                'subtitles' => $needsSubtitles ? 'generated' : 'not_needed',
            ]);

        } catch (\Exception $e) {
            Log::error('Instant upload AI processing failed', [
                'video_id' => $this->video->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $this->handleProcessingFailure($e->getMessage());
        }
    }

    /**
     * Generate optimized content based on video analysis.
     */
    private function generateOptimizedContent(array $analysis): array
    {
        Log::info('Generating optimized content using AI services', [
            'video_id' => $this->video->id,
            'has_transcript' => !empty($analysis['transcript']['text'] ?? ''),
            'content_category' => $analysis['content_category'] ?? 'unknown',
        ]);

        // Use AIContentOptimizationService to generate title and description
        $contentService = app(\App\Services\AIContentOptimizationService::class);
        
        try {
            // Generate AI-powered title from video analysis
            $title = $contentService->generateTitleFromVideoAnalysis($analysis);
            
            // Generate AI-powered description from video analysis
            $description = $contentService->generateDescriptionFromVideoAnalysis($analysis);
            
            // Generate AI-powered hashtags for each platform
            $contentSummary = substr($analysis['transcript']['text'] ?? '', 0, 500);
            if (empty($contentSummary)) {
                // Use basic info if transcript is empty
                $contentSummary = ($analysis['content_category']['primary_category'] ?? 'video') . ' content';
            }
            
            $tags = [];
            
            // Get hashtags for different platforms and combine them
            $platforms = ['instagram', 'tiktok', 'youtube'];
            foreach ($platforms as $platform) {
                try {
                    $platformTags = $contentService->generateTrendingHashtags($platform, $contentSummary, 5);
                    $tags = array_merge($tags, $platformTags);
                } catch (\Exception $e) {
                    Log::warning('Failed to generate hashtags for platform', [
                        'platform' => $platform,
                        'error' => $e->getMessage()
                    ]);
                }
            }
            
            // Clean and deduplicate tags
            $tags = array_unique(array_map(function($tag) {
                return str_replace('#', '', trim($tag));
            }, $tags));
            
            $tags = array_slice($tags, 0, 12); // Limit to 12 tags
            
            // If no tags were generated, add fallback tags
            if (empty($tags)) {
                $contentCategory = $analysis['content_category']['primary_category'] ?? 'general';
                $tags = [$contentCategory, 'video', 'content', 'viral', 'amazing'];
            }
            
            Log::info('AI content generation successful', [
                'video_id' => $this->video->id,
                'title_length' => strlen($title),
                'description_length' => strlen($description),
                'tags_count' => count($tags),
            ]);

            return [
                'title' => $title,
                'description' => $description,
                'tags' => $tags,
            ];
            
        } catch (\Exception $e) {
            Log::error('AI content generation failed, using fallback', [
                'video_id' => $this->video->id,
                'error' => $e->getMessage(),
            ]);
            
            // Fallback to simplified generation
            return $this->generateFallbackContent($analysis);
        }
    }

    /**
     * Generate fallback content when AI services fail.
     */
    private function generateFallbackContent(array $analysis): array
    {
        // Extract key information for fallback generation
        $transcript = $analysis['transcript']['text'] ?? '';
        $contentCategory = $analysis['content_category'] ?? 'general';
        
        // Handle content_category - could be string or array
        if (is_array($contentCategory)) {
            $contentCategory = $contentCategory['main'] ?? $contentCategory['category'] ?? $contentCategory[0] ?? 'general';
        }
        $contentCategory = (string) $contentCategory;
        
        // Simple fallback title
        $title = "Amazing " . ucfirst($contentCategory) . " Content You Need to See";
        
        // Simple fallback description
        $summary = !empty($transcript) ? substr($transcript, 0, 200) . '...' : "Engaging content that you'll love!";
        $description = "Check out this amazing {$contentCategory} video! {$summary}\n\n#video #{$contentCategory} #content #viral #amazing";
        
        // Simple fallback tags
        $tags = [$contentCategory, 'video', 'content', 'amazing', 'viral'];
        
        return [
            'title' => $title,
            'description' => $description,
            'tags' => $tags,
        ];
    }

    /**
     * Determine if subtitles should be generated.
     */
    private function shouldGenerateSubtitles(array $analysis): bool
    {
        // Generate subtitles if:
        // 1. Video has speech content (transcript available)
        // 2. Video is longer than 10 seconds
        // 3. Audio quality is decent

        $hasTranscript = !empty($analysis['transcript']['text'] ?? '');
        $hasMinimumDuration = ($this->video->duration ?? 0) > 10;
        $qualityScore = $analysis['quality_score']['overall_score'] ?? 0;
        $hasDecentQuality = $qualityScore > 60;

        return $hasTranscript && $hasMinimumDuration && $hasDecentQuality;
    }

    /**
     * Get optimal subtitle style based on AI video analysis.
     */
    private function getOptimalSubtitleStyle(array $analysis): array
    {
        // Choose subtitle style based on video characteristics
        $moodData = $analysis['mood_analysis'] ?? [];
        $mood = 'general';
        if (isset($moodData['dominant_mood']) && is_string($moodData['dominant_mood'])) {
            $mood = $moodData['dominant_mood'];
        }
        
        $category = $analysis['content_category'] ?? 'general';
        if (is_array($category)) {
            $category = $category['main'] ?? $category['category'] ?? $category[0] ?? 'general';
        }
        $category = (string) $category;
        
        // Enhanced AI-driven subtitle styles
        $styles = [
            'educational' => [
                'font_family' => 'Arial',
                'font_size' => 24,
                'color' => '#FFFFFF',
                'background_color' => '#1e3a8a', // Professional blue
                'background_opacity' => 0.8,
                'position' => 'bottom',
                'style_reason' => 'Professional and readable for educational content',
            ],
            'entertainment' => [
                'font_family' => 'Arial Black',
                'font_size' => 28,
                'color' => '#FFD700', // Gold for excitement
                'background_color' => '#000000',
                'background_opacity' => 0.6,
                'position' => 'bottom',
                'style_reason' => 'Bold and eye-catching for entertainment',
            ],
            'lifestyle' => [
                'font_family' => 'Helvetica',
                'font_size' => 22,
                'color' => '#FFFFFF',
                'background_color' => '#4a5568', // Warm gray
                'background_opacity' => 0.7,
                'position' => 'bottom',
                'style_reason' => 'Clean and modern for lifestyle content',
            ],
            'technology' => [
                'font_family' => 'Roboto',
                'font_size' => 24,
                'color' => '#00ff88', // Tech green
                'background_color' => '#000000',
                'background_opacity' => 0.8,
                'position' => 'bottom',
                'style_reason' => 'Modern tech aesthetic',
            ],
            'gaming' => [
                'font_family' => 'Arial Black',
                'font_size' => 26,
                'color' => '#ff6b6b', // Gaming red
                'background_color' => '#000000',
                'background_opacity' => 0.7,
                'position' => 'bottom',
                'style_reason' => 'High contrast for gaming visibility',
            ],
            'music' => [
                'font_family' => 'Arial',
                'font_size' => 24,
                'color' => '#9f7aea', // Music purple
                'background_color' => '#000000',
                'background_opacity' => 0.6,
                'position' => 'bottom',
                'style_reason' => 'Artistic purple for music content',
            ]
        ];

        // Mood-based adjustments
        $baseStyle = $styles[$category] ?? $styles['educational'];
        
        // Adjust based on mood
        switch ($mood) {
            case 'energetic':
            case 'excited':
                $baseStyle['font_size'] += 2;
                $baseStyle['color'] = '#FFD700'; // More vibrant
                break;
            case 'calm':
            case 'peaceful':
                $baseStyle['background_opacity'] = 0.8; // More subtle
                $baseStyle['color'] = '#E6E6FA'; // Softer color
                break;
            case 'serious':
            case 'professional':
                $baseStyle['font_family'] = 'Arial';
                $baseStyle['background_color'] = '#1a202c'; // More professional
                break;
        }

        // Add AI-enhanced metadata
        $baseStyle['ai_optimized'] = true;
        $baseStyle['analysis_based'] = [
            'category' => $category,
            'mood' => $mood,
            'confidence' => 0.85,
        ];

        Log::info('AI-optimized subtitle style generated', [
            'video_id' => $this->video->id,
            'category' => $category,
            'mood' => $mood,
            'style_reason' => $baseStyle['style_reason'] ?? 'Standard optimization',
        ]);

        return $baseStyle;
    }

    /**
     * Generate platform-specific settings using AI optimization.
     */
    private function generatePlatformSettings(string $platform, array $analysis, array $content): array
    {
        $baseSettings = [
            'auto_generated' => true,
            'ai_optimized' => true,
            'tags' => $content['tags'] ?? [],
        ];

        try {
            // Use AI services to optimize platform settings
            $contentService = app(\App\Services\AIContentOptimizationService::class);
            $trendService = app(\App\Services\AITrendAnalyzerService::class);
            
            // Get AI-optimized posting suggestions
            $postingTimes = $contentService->suggestOptimalPostingTimes($platform, $content['description'] ?? '');
            
            // Get trending hashtags specific to this platform
            $contentSummary = substr($analysis['transcript']['text'] ?? '', 0, 300);
            if (empty($contentSummary)) {
                $contentSummary = $content['title'] . ' ' . substr($content['description'] ?? '', 0, 200);
            }
            
            $platformHashtags = $contentService->generateTrendingHashtags($platform, $contentSummary, 8);
            
            // Add AI insights to base settings
            $aiEnhancedSettings = array_merge($baseSettings, [
                'optimal_posting_times' => $postingTimes,
                'platform_hashtags' => $platformHashtags,
                'content_analysis' => [
                    'category' => $analysis['content_category']['primary_category'] ?? 'general',
                    'mood' => $analysis['mood_analysis']['dominant_mood'] ?? 'neutral',
                    'estimated_engagement' => $this->estimateEngagementPotential($analysis, $platform),
                ],
            ]);
            
            // Platform-specific AI optimizations
            switch ($platform) {
                case 'youtube':
                    $category = $this->mapToYouTubeCategory($analysis['content_category']['primary_category'] ?? 'general');
                    return array_merge($aiEnhancedSettings, [
                        'category' => $category,
                        'privacy' => 'public',
                        'allow_comments' => true,
                        'allow_ratings' => true,
                        'seo_optimized' => true,
                    ]);

                case 'instagram':
                    return array_merge($aiEnhancedSettings, [
                        'caption_hashtags' => true,
                        'story_format' => false,
                        'engagement_strategy' => 'visual_appeal',
                    ]);

                case 'tiktok':
                    return array_merge($aiEnhancedSettings, [
                        'duet' => true,
                        'comment' => true,
                        'stitch' => true,
                        'trend_aligned' => true,
                    ]);

                case 'facebook':
                    return array_merge($aiEnhancedSettings, [
                        'privacy' => 'public',
                        'allow_comments' => true,
                        'audience_targeting' => 'broad',
                    ]);

                case 'x':
                    return array_merge($aiEnhancedSettings, [
                        'reply_settings' => 'everyone',
                        'thread_optimization' => false,
                    ]);

                default:
                    return $aiEnhancedSettings;
            }
            
        } catch (\Exception $e) {
            Log::warning('AI platform optimization failed, using basic settings', [
                'platform' => $platform,
                'error' => $e->getMessage()
            ]);
            
            // Fallback to basic platform settings
            return $this->getBasicPlatformSettings($platform, $baseSettings);
        }
    }

    /**
     * Get basic platform settings as fallback.
     */
    private function getBasicPlatformSettings(string $platform, array $baseSettings): array
    {
        switch ($platform) {
            case 'youtube':
                return array_merge($baseSettings, [
                    'category' => 'Entertainment',
                    'privacy' => 'public',
                    'allow_comments' => true,
                    'allow_ratings' => true,
                ]);

            case 'instagram':
                return array_merge($baseSettings, [
                    'caption_hashtags' => true,
                    'story_format' => false,
                ]);

            case 'tiktok':
                return array_merge($baseSettings, [
                    'duet' => true,
                    'comment' => true,
                    'stitch' => true,
                ]);

            case 'facebook':
                return array_merge($baseSettings, [
                    'privacy' => 'public',
                    'allow_comments' => true,
                ]);

            case 'x':
                return array_merge($baseSettings, [
                    'reply_settings' => 'everyone',
                ]);

            default:
                return $baseSettings;
        }
    }

    /**
     * Map content category to YouTube category.
     */
    private function mapToYouTubeCategory(string $contentCategory): string
    {
        $mapping = [
            'educational' => 'Education',
            'entertainment' => 'Entertainment',
            'technology' => 'Science & Technology',
            'gaming' => 'Gaming',
            'music' => 'Music',
            'sports' => 'Sports',
            'travel' => 'Travel & Events',
            'food' => 'Howto & Style',
            'lifestyle' => 'People & Blogs',
            'business' => 'Education',
            'news' => 'News & Politics',
        ];

        return $mapping[$contentCategory] ?? 'Entertainment';
    }

    /**
     * Estimate engagement potential based on AI analysis.
     */
    private function estimateEngagementPotential(array $analysis, string $platform): string
    {
        $score = 50; // Base score
        
        // Boost for transcript availability
        if (!empty($analysis['transcript']['text'] ?? '')) {
            $score += 15;
        }
        
        // Boost for positive mood
        $mood = $analysis['mood_analysis']['dominant_mood'] ?? 'neutral';
        if (in_array($mood, ['positive', 'excited', 'energetic'])) {
            $score += 20;
        }
        
        // Boost for popular categories
        $category = $analysis['content_category']['primary_category'] ?? 'general';
        if (in_array($category, ['entertainment', 'educational', 'lifestyle'])) {
            $score += 15;
        }
        
        // Platform-specific adjustments
        switch ($platform) {
            case 'tiktok':
                $score += 10; // TikTok generally has higher engagement
                break;
            case 'instagram':
                $score += 5;
                break;
        }
        
        if ($score >= 80) return 'very_high';
        if ($score >= 65) return 'high';
        if ($score >= 50) return 'medium';
        return 'low';
    }

    /**
     * Handle processing failure with fallback content.
     */
    private function handleProcessingFailure(string $error): void
    {
        Log::warning('AI processing failed, using fallback content', [
            'video_id' => $this->video->id,
            'error' => $error,
        ]);

        // Update video with fallback content that's still useful
        $fallbackContent = $this->getFallbackContent();
        
        $this->video->update([
            'title' => $fallbackContent['title'],
            'description' => $fallbackContent['description'],
        ]);

        // Still create video targets for publishing (even without AI optimization)
        foreach ($this->platforms as $platform) {
            $target = VideoTarget::create([
                'video_id' => $this->video->id,
                'platform' => $platform,
                'status' => 'pending',
                'publish_at' => now(),
                'advanced_options' => ['auto_generated' => false, 'fallback_mode' => true],
            ]);

            // Dispatch upload job
            $uploadService = app(VideoUploadService::class);
            $uploadService->dispatchUploadJob($target);
        }

        Log::info('Fallback processing completed', [
            'video_id' => $this->video->id,
            'platforms_count' => count($this->platforms),
        ]);
    }

    /**
     * Get fallback analysis when AI analysis fails.
     */
    private function getFallbackAnalysis(): array
    {
        return [
            'transcript' => ['text' => '', 'success' => false],
            'mood_analysis' => ['dominant_mood' => 'general'],
            'content_category' => 'general', // Ensure this is always a string
            'scenes' => [],
            'quality_score' => ['overall_score' => 70],
        ];
    }

    /**
     * Get fallback content when AI processing fails.
     */
    private function getFallbackContent(): array
    {
        $titles = [
            "New Video Upload",
            "Amazing Content!",
            "Check This Out!",
            "Latest Video",
            "Fresh Content",
        ];

        $descriptions = [
            "🎥 New video uploaded!\n\n📍 Check out this amazing content!\n\n👍 Don't forget to like, subscribe, and share!\n\n#video #content #amazing",
            "🔥 Fresh content just dropped!\n\n✨ Hope you enjoy this video!\n\n💫 Like and subscribe for more!\n\n#newvideo #content #subscribe",
            "🎬 Latest upload is here!\n\n🌟 Thanks for watching!\n\n🚀 More content coming soon!\n\n#upload #video #amazing",
        ];

        return [
            'title' => $titles[array_rand($titles)],
            'description' => $descriptions[array_rand($descriptions)],
            'tags' => ['video', 'content', 'upload', 'amazing'],
        ];
    }
} 