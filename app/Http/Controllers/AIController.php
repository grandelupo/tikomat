<?php

namespace App\Http\Controllers;

use App\Services\AIContentOptimizationService;
use App\Services\AIVideoAnalyzerService;
use App\Services\AIPerformanceOptimizationService;
use App\Services\AIThumbnailOptimizerService;
use App\Services\AIContentCalendarService;
use App\Services\AITrendAnalyzerService;
use App\Services\AIAudienceInsightsService;
use App\Services\AIContentStrategyPlannerService;
use App\Services\AISEOOptimizerService;
use App\Services\AIWatermarkRemoverService;
use App\Services\AISubtitleGeneratorService;
use App\Services\FFmpegService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class AIController extends Controller
{
    protected AIContentOptimizationService $aiService;
    protected AIVideoAnalyzerService $videoAnalyzerService;
    protected AIPerformanceOptimizationService $performanceOptimizationService;
    protected AIThumbnailOptimizerService $thumbnailOptimizerService;
    protected AIContentCalendarService $contentCalendarService;
    protected AITrendAnalyzerService $trendAnalyzerService;
    protected AIAudienceInsightsService $audienceInsightsService;
    protected AIContentStrategyPlannerService $contentStrategyPlannerService;
    protected AISEOOptimizerService $seoOptimizerService;
    protected AIWatermarkRemoverService $watermarkRemoverService;
    protected AISubtitleGeneratorService $subtitleGeneratorService;
    protected FFmpegService $ffmpegService;

    public function __construct(
        AIContentOptimizationService $aiService, 
        AIVideoAnalyzerService $videoAnalyzerService, 
        AIPerformanceOptimizationService $performanceOptimizationService, 
        AIThumbnailOptimizerService $thumbnailOptimizerService, 
        AIContentCalendarService $contentCalendarService, 
        AITrendAnalyzerService $trendAnalyzerService, 
        AIAudienceInsightsService $audienceInsightsService, 
        AIContentStrategyPlannerService $contentStrategyPlannerService, 
        AISEOOptimizerService $seoOptimizerService, 
        AIWatermarkRemoverService $watermarkRemoverService, 
        AISubtitleGeneratorService $subtitleGeneratorService,
        FFmpegService $ffmpegService
    ) {
        $this->aiService = $aiService;
        $this->videoAnalyzerService = $videoAnalyzerService;
        $this->performanceOptimizationService = $performanceOptimizationService;
        $this->thumbnailOptimizerService = $thumbnailOptimizerService;
        $this->contentCalendarService = $contentCalendarService;
        $this->trendAnalyzerService = $trendAnalyzerService;
        $this->audienceInsightsService = $audienceInsightsService;
        $this->contentStrategyPlannerService = $contentStrategyPlannerService;
        $this->seoOptimizerService = $seoOptimizerService;
        $this->watermarkRemoverService = $watermarkRemoverService;
        $this->subtitleGeneratorService = $subtitleGeneratorService;
        $this->ffmpegService = $ffmpegService;
    }

    /**
     * Analyze video content comprehensively
     */
    public function analyzeVideo(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
            'options' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $video = \App\Models\Video::findOrFail($request->video_id);
            
            // Ensure user owns this video
            if ($video->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to video',
                ], 403);
            }
            
            // Get video file path from storage
            if (!$video->original_file_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file path not available. Please ensure the video is properly uploaded.',
                ], 404);
            }

            // Convert storage path to absolute path
            $videoPath = Storage::path($video->original_file_path);
            
            if (!file_exists($videoPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file not found on disk. The file may have been moved or deleted.',
                ], 404);
            }

            $analysis = $this->videoAnalyzerService->analyzeVideo($videoPath, $request->options ?? []);

            Log::info('Video analysis completed', [
                'user_id' => $request->user()->id,
                'video_id' => $video->id,
                'video_title' => $video->title,
                'analysis_quality' => $analysis['quality_score']['overall_score'] ?? 'unknown',
            ]);

            return response()->json([
                'success' => true,
                'data' => $analysis,
                'message' => 'Video analysis completed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Video analysis failed', [
                'user_id' => $request->user()->id,
                'video_id' => $request->video_id ?? 'unknown',
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze video. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get video quality assessment
     */
    public function assessVideoQuality(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $video = \App\Models\Video::findOrFail($request->video_id);
            
            // Ensure user owns this video
            if ($video->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to video',
                ], 403);
            }
            
            if (!$video->original_file_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file path not available',
                ], 404);
            }

            $videoPath = Storage::path($video->original_file_path);
            
            if (!file_exists($videoPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file not found',
                ], 404);
            }

            // Use reflection to call protected method for quality assessment only
            $reflection = new \ReflectionClass($this->videoAnalyzerService);
            $method = $reflection->getMethod('assessVideoQuality');
            $method->setAccessible(true);
            $qualityAssessment = $method->invokeArgs($this->videoAnalyzerService, [$videoPath]);

            return response()->json([
                'success' => true,
                'data' => $qualityAssessment,
                'message' => 'Video quality assessed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Video quality assessment failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to assess video quality. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Generate thumbnail suggestions
     */
    public function generateThumbnailSuggestions(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $video = \App\Models\Video::findOrFail($request->video_id);
            
            // Ensure user owns this video
            if ($video->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to video',
                ], 403);
            }
            
            if (!$video->original_file_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file path not available',
                ], 404);
            }

            $videoPath = Storage::path($video->original_file_path);
            
            if (!file_exists($videoPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file not found',
                ], 404);
            }

            // Use reflection to call protected method
            $reflection = new \ReflectionClass($this->videoAnalyzerService);
            $method = $reflection->getMethod('generateThumbnailSuggestions');
            $method->setAccessible(true);
            $thumbnailSuggestions = $method->invokeArgs($this->videoAnalyzerService, [$videoPath]);

            return response()->json([
                'success' => true,
                'data' => $thumbnailSuggestions,
                'message' => 'Thumbnail suggestions generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Thumbnail suggestion generation failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate thumbnail suggestions. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Extract content tags from video
     */
    public function extractVideoTags(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $video = \App\Models\Video::findOrFail($request->video_id);
            
            // Ensure user owns this video
            if ($video->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to video',
                ], 403);
            }
            
            if (!$video->original_file_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file path not available',
                ], 404);
            }

            $videoPath = Storage::path($video->original_file_path);
            
            if (!file_exists($videoPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file not found',
                ], 404);
            }

            // Get basic analysis with transcript
            $analysis = $this->videoAnalyzerService->analyzeVideo($videoPath, ['transcript_only' => true]);
            
            $tags = [];
            if ($analysis['transcript']['success'] && !empty($analysis['transcript']['text'])) {
                // Use reflection to call protected method
                $reflection = new \ReflectionClass($this->videoAnalyzerService);
                $method = $reflection->getMethod('extractContentTags');
                $method->setAccessible(true);
                $tags = $method->invokeArgs($this->videoAnalyzerService, [$analysis['transcript']['text']]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'tags' => $tags,
                    'transcript_available' => $analysis['transcript']['success'],
                    'content_category' => $analysis['content_category'] ?? null,
                ],
                'message' => 'Video tags extracted successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Video tag extraction failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to extract video tags. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Optimize content for multiple platforms
     */
    public function optimizeContent(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'platforms' => 'required|array|min:1',
            'platforms.*' => 'string|in:youtube,instagram,tiktok,facebook,x,snapchat,pinterest',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $optimizations = $this->aiService->optimizeForPlatforms($request->all());

            Log::info('AI content optimization completed', [
                'user_id' => $request->user()->id,
                'platforms' => $request->platforms,
                'title_length' => strlen($request->title),
                'optimization_count' => count($optimizations),
            ]);

            return response()->json([
                'success' => true,
                'data' => $optimizations,
                'message' => 'Content optimized successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('AI content optimization failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
                'title' => $request->title,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to optimize content. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Generate trending hashtags for a platform
     */
    public function generateHashtags(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platform' => 'required|string|in:youtube,instagram,tiktok,facebook,x,snapchat,pinterest',
            'content' => 'required|string|max:1000',
            'count' => 'nullable|integer|min:1|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $hashtags = $this->aiService->generateTrendingHashtags(
                $request->platform,
                $request->content,
                $request->count ?? 10
            );

            return response()->json([
                'success' => true,
                'data' => $hashtags,
                'message' => 'Hashtags generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Hashtag generation failed', [
                'user_id' => $request->user()->id,
                'platform' => $request->platform,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate hashtags. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Suggest optimal posting times
     */
    public function suggestPostingTimes(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platform' => 'required|string|in:youtube,instagram,tiktok,facebook,x,snapchat,pinterest',
            'content' => 'required|string|max:1000',
            'timezone' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $userTimeZone = $request->timezone ? ['timezone' => $request->timezone] : null;
            
            $postingTimes = $this->aiService->suggestOptimalPostingTimes(
                $request->platform,
                $request->content,
                $userTimeZone
            );

            return response()->json([
                'success' => true,
                'data' => $postingTimes,
                'message' => 'Posting times suggested successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Posting time suggestion failed', [
                'user_id' => $request->user()->id,
                'platform' => $request->platform,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to suggest posting times. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Generate SEO-optimized description
     */
    public function generateSEODescription(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'platform' => 'required|string|in:youtube,instagram,tiktok,facebook,xhat,pinterest',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $seoDescription = $this->aiService->generateSEODescription(
                $request->title,
                $request->description,
                $request->platform
            );

            return response()->json([
                'success' => true,
                'data' => $seoDescription,
                'message' => 'SEO description generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('SEO description generation failed', [
                'user_id' => $request->user()->id,
                'platform' => $request->platform,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate SEO description. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Generate A/B testing variations
     */
    public function generateABVariations(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'platform' => 'required|string|in:youtube,instagram,tiktok,facebook,x,snapchat,pinterest',
            'variations' => 'nullable|integer|min:2|max:5',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $variations = $this->aiService->generateABTestVariations(
                $request->platform,
                $request->title,
                $request->description,
                $request->variations ?? 3
            );

            return response()->json([
                'success' => true,
                'data' => $variations,
                'message' => 'A/B test variations generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('A/B variation generation failed', [
                'user_id' => $request->user()->id,
                'platform' => $request->platform,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate A/B variations. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get AI optimization suggestions for content
     */
    public function getOptimizationSuggestions(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'platform' => 'required|string|in:youtube,instagram,tiktok,facebook,x,snapchat,pinterest',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $optimization = $this->aiService->optimizeForPlatform(
                $request->platform,
                $request->title,
                $request->description ?? ''
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'optimization_score' => $optimization['optimization_score'],
                    'suggestions' => $optimization['suggestions'],
                    'platform_tips' => $optimization['platform_specific_tips'],
                ],
                'message' => 'Optimization suggestions generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Optimization suggestions failed', [
                'user_id' => $request->user()->id,
                'platform' => $request->platform,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate optimization suggestions. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Batch optimize content for multiple videos
     */
    public function batchOptimizeContent(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'videos' => 'required|array|min:1|max:10',
            'videos.*.title' => 'required|string|max:255',
            'videos.*.description' => 'nullable|string|max:1000',
            'platforms' => 'required|array|min:1',
            'platforms.*' => 'string|in:youtube,instagram,tiktok,facebook,x,snapchat,pinterest',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $batchResults = [];
            
            foreach ($request->videos as $index => $video) {
                $videoData = [
                    'title' => $video['title'],
                    'description' => $video['description'] ?? '',
                    'platforms' => $request->platforms,
                ];
                
                $optimizations = $this->aiService->optimizeForPlatforms($videoData);
                $batchResults[] = [
                    'index' => $index,
                    'original_title' => $video['title'],
                    'optimizations' => $optimizations,
                ];
            }

            Log::info('Batch AI optimization completed', [
                'user_id' => $request->user()->id,
                'video_count' => count($request->videos),
                'platforms' => $request->platforms,
            ]);

            return response()->json([
                'success' => true,
                'data' => $batchResults,
                'message' => 'Batch optimization completed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Batch optimization failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to optimize content in batch. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Analyze video performance across platforms
     */
    public function analyzeVideoPerformance(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $analysis = $this->performanceOptimizationService->analyzeVideoPerformance($request->video_id);

            Log::info('Video performance analysis completed', [
                'user_id' => $request->user()->id,
                'video_id' => $request->video_id,
                'performance_score' => $analysis['performance_score'],
            ]);

            return response()->json([
                'success' => true,
                'data' => $analysis,
                'message' => 'Performance analysis completed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Video performance analysis failed', [
                'user_id' => $request->user()->id,
                'video_id' => $request->video_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze video performance. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Create A/B test for video optimization
     */
    public function createABTest(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
            'test_type' => 'required|string|in:title,thumbnail,posting_time,description',
            'test_variations' => 'required|array|min:2|max:5',
            'test_duration_days' => 'nullable|integer|min:3|max:30',
            'success_metrics' => 'required|array|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $testConfig = [
                'type' => $request->test_type,
                'variations' => $request->test_variations,
                'duration_days' => $request->test_duration_days ?? 14,
                'success_metrics' => $request->success_metrics,
                'created_by' => $request->user()->id,
            ];

            $result = $this->performanceOptimizationService->createABTest($request->video_id, $testConfig);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result,
                    'message' => 'A/B test created successfully',
                ]);
            } else {
                throw new \Exception($result['error']);
            }

        } catch (\Exception $e) {
            Log::error('A/B test creation failed', [
                'user_id' => $request->user()->id,
                'video_id' => $request->video_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create A/B test. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get user performance insights dashboard
     */
    public function getUserPerformanceInsights(Request $request): JsonResponse
    {
        try {
            $insights = $this->performanceOptimizationService->getUserPerformanceInsights($request->user()->id);

            return response()->json([
                'success' => true,
                'data' => $insights,
                'message' => 'Performance insights retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get user performance insights', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load performance insights. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get optimization opportunities for a video
     */
    public function getOptimizationOpportunities(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $analysis = $this->performanceOptimizationService->analyzeVideoPerformance($request->video_id);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'optimization_opportunities' => $analysis['optimization_opportunities'],
                    'ab_test_suggestions' => $analysis['ab_test_suggestions'],
                    'posting_time_optimization' => $analysis['posting_time_optimization'],
                    'content_recommendations' => $analysis['content_recommendations'],
                    'improvement_potential' => $analysis['improvement_potential'],
                ],
                'message' => 'Optimization opportunities identified successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get optimization opportunities', [
                'user_id' => $request->user()->id,
                'video_id' => $request->video_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to identify optimization opportunities. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get platform performance comparison
     */
    public function getPlatformPerformanceComparison(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $analysis = $this->performanceOptimizationService->analyzeVideoPerformance($request->video_id);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'platform_breakdown' => $analysis['platform_breakdown'],
                    'comparative_analysis' => $analysis['comparative_analysis'],
                    'overall_performance' => $analysis['overall_performance'],
                ],
                'message' => 'Platform performance comparison retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get platform performance comparison', [
                'user_id' => $request->user()->id,
                'video_id' => $request->video_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to compare platform performance. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get trending performance insights
     */
    public function getTrendingPerformanceInsights(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $analysis = $this->performanceOptimizationService->analyzeVideoPerformance($request->video_id);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'trend_analysis' => $analysis['trend_analysis'],
                    'performance_score' => $analysis['performance_score'],
                    'lifecycle_stage' => $analysis['trend_analysis']['lifecycle_stage'] ?? 'unknown',
                    'momentum_score' => $analysis['trend_analysis']['momentum_score'] ?? 0,
                ],
                'message' => 'Trending performance insights retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get trending performance insights', [
                'user_id' => $request->user()->id,
                'video_id' => $request->video_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get trending insights. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Optimize thumbnails for a video
     */
    public function optimizeThumbnails(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
            'title' => 'nullable|string|max:255',
            'platforms' => 'nullable|array',
            'platforms.*' => 'string|in:youtube,instagram,tiktok,facebook,x',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $video = \App\Models\Video::findOrFail($request->video_id);
            
            // Verify the user owns this video
            if ($video->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to video',
                ], 403);
            }

            // Get video file path from storage
            if (!$video->original_file_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file path not available. Please ensure the video is properly uploaded.',
                ], 404);
            }

            // Convert storage path to absolute path
            $videoPath = Storage::path($video->original_file_path);
            
            if (!file_exists($videoPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file not found on disk. The file may have been moved or deleted.',
                ], 404);
            }

            $options = [
                'title' => $request->title ?? $video->title ?? 'Amazing Video',
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
                'video_id' => $video->id,
            ];

            $analysis = $this->thumbnailOptimizerService->optimizeThumbnails($videoPath, $options);

            Log::info('Thumbnail optimization completed', [
                'user_id' => $request->user()->id,
                'video_id' => $video->id,
                'overall_score' => $analysis['overall_score'],
                'frames_extracted' => count($analysis['extracted_frames'] ?? []),
            ]);

            return response()->json([
                'success' => true,
                'data' => $analysis,
                'message' => 'Thumbnail optimization completed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Thumbnail optimization failed', [
                'user_id' => $request->user()->id,
                'video_id' => $request->video_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to optimize thumbnails. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Generate optimized thumbnail with applied effects
     */
    public function generateOptimizedThumbnail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'frame_id' => 'required|string',
            'optimizations' => 'required|array',
            'platform' => 'nullable|string|in:youtube,instagram,tiktok,facebook,x',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $result = $this->thumbnailOptimizerService->generateOptimizedThumbnail(
                $request->frame_id,
                $request->optimizations
            );

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result,
                    'message' => 'Optimized thumbnail generated successfully',
                ]);
            } else {
                throw new \Exception($result['error']);
            }

        } catch (\Exception $e) {
            Log::error('Thumbnail generation failed', [
                'user_id' => $request->user()->id,
                'frame_id' => $request->frame_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate optimized thumbnail. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get thumbnail design analysis
     */
    public function getThumbnailDesignAnalysis(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_path' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $analysis = $this->thumbnailOptimizerService->optimizeThumbnails($request->video_path);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'design_analysis' => $analysis['design_analysis'],
                    'color_analysis' => $analysis['color_analysis'],
                    'face_detection' => $analysis['face_detection'],
                    'improvement_recommendations' => $analysis['improvement_recommendations'],
                ],
                'message' => 'Thumbnail design analysis completed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Thumbnail design analysis failed', [
                'user_id' => $request->user()->id,
                'video_path' => $request->video_path,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze thumbnail design. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get CTR predictions for thumbnail frames
     */
    public function getThumbnailCTRPredictions(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_path' => 'required|string',
            'platforms' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $analysis = $this->thumbnailOptimizerService->optimizeThumbnails($request->video_path);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'ctr_predictions' => $analysis['ctr_predictions'],
                    'thumbnail_suggestions' => $analysis['thumbnail_suggestions'],
                    'platform_optimizations' => $analysis['platform_optimizations'],
                ],
                'message' => 'CTR predictions generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('CTR prediction failed', [
                'user_id' => $request->user()->id,
                'video_path' => $request->video_path,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to predict CTR. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get thumbnail text overlay suggestions
     */
    public function getThumbnailTextSuggestions(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'platform' => 'nullable|string|in:youtube,instagram,tiktok,facebook,x',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = ['title' => $request->title];
            $analysis = $this->thumbnailOptimizerService->optimizeThumbnails('dummy_path', $options);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'text_overlay_suggestions' => $analysis['text_overlay_suggestions'],
                ],
                'message' => 'Text overlay suggestions generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Text suggestion generation failed', [
                'user_id' => $request->user()->id,
                'title' => $request->title,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate text suggestions. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Create thumbnail A/B test
     */
    public function createThumbnailABTest(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
            'frame_variants' => 'required|array|min:2|max:5',
            'test_duration_days' => 'nullable|integer|min:3|max:30',
            'platforms' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $testConfig = [
                'type' => 'thumbnail',
                'variations' => $request->frame_variants,
                'duration_days' => $request->test_duration_days ?? 14,
                'success_metrics' => ['click_through_rate', 'impressions', 'views'],
                'platforms' => $request->platforms ?? ['youtube', 'instagram'],
                'created_by' => $request->user()->id,
            ];

            $result = $this->performanceOptimizationService->createABTest($request->video_id, $testConfig);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => $result,
                    'message' => 'Thumbnail A/B test created successfully',
                ]);
            } else {
                throw new \Exception($result['error']);
            }

        } catch (\Exception $e) {
            Log::error('Thumbnail A/B test creation failed', [
                'user_id' => $request->user()->id,
                'video_id' => $request->video_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create thumbnail A/B test. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Generate AI-powered content calendar
     */
    public function generateContentCalendar(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'nullable|integer|exists:users,id',
            'platforms' => 'nullable|array',
            'platforms.*' => 'string|in:youtube,instagram,tiktok,x,facebook,snapchat,pinterest',
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after:start_date',
            'days' => 'nullable|integer|min:7|max:90',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $userId = $request->user_id ?? $request->user()->id;
            $options = array_filter([
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
                'start_date' => $request->start_date,
                'end_date' => $request->end_date,
                'days' => $request->days ?? 30,
            ]);

            $calendar = $this->contentCalendarService->generateContentCalendar($userId, $options);

            Log::info('Content calendar generated', [
                'user_id' => $userId,
                'has_data' => $calendar['has_data'] ?? false,
                'calendar_score' => $calendar['calendar_score'] ?? 0,
            ]);

            return response()->json([
                'success' => true,
                'data' => $calendar,
                'message' => $calendar['has_data'] 
                    ? 'Content calendar generated successfully with personalized insights'
                    : 'Basic content calendar generated - upload videos for personalized insights',
            ]);

        } catch (\Exception $e) {
            Log::error('Content calendar generation failed', [
                'user_id' => $request->user_id ?? $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate content calendar. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get optimal posting schedule
     */
    public function getOptimalPostingSchedule(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'start_date' => 'nullable|date',
            'days' => 'nullable|integer|min:7|max:30',
            'platforms' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'start_date' => $request->start_date ?? now()->toDateString(),
                'days' => $request->days ?? 14,
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
            ];

            $calendar = $this->contentCalendarService->generateContentCalendar($request->user()->id, $options);

            return response()->json([
                'success' => true,
                'data' => [
                    'optimal_schedule' => $calendar['optimal_schedule'],
                    'posting_frequency' => $calendar['posting_frequency'],
                    'engagement_predictions' => $calendar['engagement_predictions'],
                ],
                'message' => 'Optimal posting schedule generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Posting schedule generation failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate posting schedule. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get trending content opportunities
     */
    public function getTrendingOpportunities(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platforms' => 'nullable|array',
            'timeframe' => 'nullable|string|in:7days,14days,30days',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
                'timeframe' => $request->timeframe ?? '14days',
            ];

            $calendar = $this->contentCalendarService->generateContentCalendar($request->user()->id, $options);

            return response()->json([
                'success' => true,
                'data' => [
                    'trending_opportunities' => $calendar['trending_opportunities'],
                    'content_themes' => $calendar['content_themes'],
                    'seasonal_insights' => $calendar['seasonal_insights'],
                ],
                'message' => 'Trending opportunities retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Trending opportunities retrieval failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get trending opportunities. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Analyze content gaps
     */
    public function analyzeContentGaps(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'timeframe' => 'nullable|string|in:7days,30days,90days',
            'platforms' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'timeframe' => $request->timeframe ?? '30days',
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
            ];

            $calendar = $this->contentCalendarService->generateContentCalendar($request->user()->id, $options);

            return response()->json([
                'success' => true,
                'data' => [
                    'content_gaps' => $calendar['content_gaps'],
                    'content_recommendations' => $calendar['content_recommendations'],
                    'competitive_analysis' => $calendar['competitive_analysis'],
                ],
                'message' => 'Content gap analysis completed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Content gap analysis failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze content gaps. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get seasonal content insights
     */
    public function getSeasonalInsights(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'season' => 'nullable|string|in:spring,summer,fall,winter',
            'include_holidays' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'season' => $request->season,
                'include_holidays' => $request->include_holidays ?? true,
            ];

            $calendar = $this->contentCalendarService->generateContentCalendar($request->user()->id, $options);

            return response()->json([
                'success' => true,
                'data' => [
                    'seasonal_insights' => $calendar['seasonal_insights'],
                    'trending_opportunities' => array_filter($calendar['trending_opportunities'], function($opp) {
                        return $opp['engagement_potential'] === 'very_high';
                    }),
                ],
                'message' => 'Seasonal insights retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Seasonal insights retrieval failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get seasonal insights. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get performance forecasts
     */
    public function getPerformanceForecasts(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platforms' => 'nullable|array',
            'timeframe' => 'nullable|string|in:7days,14days,30days,90days',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
                'timeframe' => $request->timeframe ?? '30days',
            ];

            $calendar = $this->contentCalendarService->generateContentCalendar($request->user()->id, $options);

            return response()->json([
                'success' => true,
                'data' => [
                    'performance_forecasts' => $calendar['performance_forecasts'],
                    'engagement_predictions' => $calendar['engagement_predictions'],
                    'calendar_score' => $calendar['calendar_score'],
                ],
                'message' => 'Performance forecasts generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Performance forecast generation failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate performance forecasts. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // =================
    // AI TREND ANALYZER
    // =================

    /**
     * Analyze current trends across platforms
     */
    public function analyzeTrends(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platforms' => 'nullable|array',
            'categories' => 'nullable|array',
            'timeframe' => 'nullable|string|in:1h,6h,24h,7d,30d',
            'include_competitors' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
                'categories' => $request->categories ?? [],
                'timeframe' => $request->timeframe ?? '24h',
                'include_competitors' => $request->include_competitors ?? false,
            ];

            $analysis = $this->trendAnalyzerService->analyzeTrends($options);

            return response()->json([
                'success' => true,
                'data' => $analysis,
                'message' => 'Trend analysis completed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Trend analysis failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
                'options' => $request->all(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze trends. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get trending topics
     */
    public function getTrendingTopics(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platforms' => 'nullable|array',
            'timeframe' => 'nullable|string|in:1h,6h,24h,7d,30d',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
                'timeframe' => $request->timeframe ?? '24h',
            ];

            $analysis = $this->trendAnalyzerService->analyzeTrends($options);

            return response()->json([
                'success' => true,
                'data' => [
                    'trending_topics' => $analysis['trending_topics'],
                    'trend_score' => $analysis['trend_score'],
                    'timestamp' => $analysis['timestamp'],
                ],
                'message' => 'Trending topics retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Trending topics failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get trending topics. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Detect viral content patterns
     */
    public function detectViralContent(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platforms' => 'nullable|array',
            'timeframe' => 'nullable|string|in:1h,6h,24h,7d,30d',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
                'timeframe' => $request->timeframe ?? '24h',
            ];

            $analysis = $this->trendAnalyzerService->analyzeTrends($options);

            return response()->json([
                'success' => true,
                'data' => [
                    'viral_content' => $analysis['viral_content'],
                    'emerging_trends' => $analysis['emerging_trends'],
                    'timestamp' => $analysis['timestamp'],
                ],
                'message' => 'Viral content patterns detected successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Viral content detection failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to detect viral content. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Analyze hashtag trends
     */
    public function analyzeHashtagTrends(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platforms' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
            ];

            $analysis = $this->trendAnalyzerService->analyzeTrends($options);

            return response()->json([
                'success' => true,
                'data' => [
                    'hashtag_trends' => $analysis['hashtag_trends'],
                    'timestamp' => $analysis['timestamp'],
                ],
                'message' => 'Hashtag trends analyzed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Hashtag trends analysis failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze hashtag trends. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Identify content opportunities
     */
    public function identifyContentOpportunities(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platforms' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
            ];

            $analysis = $this->trendAnalyzerService->analyzeTrends($options);

            return response()->json([
                'success' => true,
                'data' => [
                    'content_opportunities' => $analysis['content_opportunities'],
                    'market_insights' => $analysis['market_insights'],
                    'timestamp' => $analysis['timestamp'],
                ],
                'message' => 'Content opportunities identified successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Content opportunities identification failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to identify content opportunities. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get competitive analysis
     */
    public function getCompetitiveAnalysis(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platforms' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
                'include_competitors' => true,
            ];

            $analysis = $this->trendAnalyzerService->analyzeTrends($options);

            return response()->json([
                'success' => true,
                'data' => [
                    'competitive_landscape' => $analysis['competitive_landscape'],
                    'market_insights' => $analysis['market_insights'],
                    'content_opportunities' => $analysis['content_opportunities'],
                    'timestamp' => $analysis['timestamp'],
                ],
                'message' => 'Competitive analysis completed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Competitive analysis failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get competitive analysis. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // AI Audience Insights Endpoints

    /**
     * Analyze audience insights comprehensively
     */
    public function analyzeAudienceInsights(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platforms' => 'nullable|array',
            'timeframe' => 'nullable|string|in:7d,30d,90d,180d,365d',
            'include_segmentation' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
                'timeframe' => $request->timeframe ?? '30d',
                'include_segmentation' => $request->boolean('include_segmentation', true),
            ];

            $insights = $this->audienceInsightsService->analyzeAudienceInsights(
                $request->user()->id,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $insights,
                'message' => 'Audience insights analyzed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Audience insights analysis failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze audience insights. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get demographic breakdown
     */
    public function getDemographicBreakdown(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platforms' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
                'include_segmentation' => false,
            ];

            $insights = $this->audienceInsightsService->analyzeAudienceInsights(
                $request->user()->id,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $insights['demographic_breakdown'] ?? [],
                'message' => 'Demographic breakdown retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Demographic breakdown failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get demographic breakdown. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get audience segments
     */
    public function getAudienceSegments(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platforms' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
                'include_segmentation' => true,
            ];

            $insights = $this->audienceInsightsService->analyzeAudienceInsights(
                $request->user()->id,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $insights['audience_segments'] ?? [],
                'message' => 'Audience segments analyzed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Audience segmentation failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze audience segments. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get behavior patterns
     */
    public function getBehaviorPatterns(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platforms' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
            ];

            $insights = $this->audienceInsightsService->analyzeAudienceInsights(
                $request->user()->id,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $insights['behavior_patterns'] ?? [],
                'message' => 'Behavior patterns analyzed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Behavior patterns analysis failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze behavior patterns. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get audience growth opportunities
     */
    public function getAudienceGrowthOpportunities(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platforms' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
            ];

            $insights = $this->audienceInsightsService->analyzeAudienceInsights(
                $request->user()->id,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $insights['growth_opportunities'] ?? [],
                'message' => 'Growth opportunities identified successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Growth opportunities analysis failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to identify growth opportunities. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get personalization recommendations
     */
    public function getPersonalizationRecommendations(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'platforms' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
            ];

            $insights = $this->audienceInsightsService->analyzeAudienceInsights(
                $request->user()->id,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $insights['personalization_recommendations'] ?? [],
                'message' => 'Personalization recommendations generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Personalization recommendations failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate personalization recommendations. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // AI Content Strategy Planner Endpoints

    /**
     * Generate comprehensive content strategy
     */
    public function generateContentStrategy(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'timeframe' => 'nullable|string|in:30d,90d,180d,365d',
            'industry' => 'nullable|string|in:technology,education,entertainment,business',
            'platforms' => 'nullable|array',
            'goals' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'timeframe' => $request->timeframe ?? '90d',
                'industry' => $request->industry ?? 'technology',
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
                'goals' => $request->goals ?? ['growth', 'engagement'],
            ];

            $strategy = $this->contentStrategyPlannerService->generateContentStrategy(
                $request->user()->id,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $strategy,
                'message' => 'Content strategy generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Content strategy generation failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate content strategy. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get strategic overview
     */
    public function getStrategicOverview(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'industry' => 'nullable|string',
            'platforms' => 'nullable|array',
            'goals' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'industry' => $request->industry ?? 'technology',
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
                'goals' => $request->goals ?? ['growth', 'engagement'],
            ];

            $strategy = $this->contentStrategyPlannerService->generateContentStrategy(
                $request->user()->id,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $strategy['strategic_overview'] ?? [],
                'message' => 'Strategic overview retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Strategic overview failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to get strategic overview. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get content pillars analysis
     */
    public function getContentPillars(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'industry' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'industry' => $request->industry ?? 'technology',
            ];

            $strategy = $this->contentStrategyPlannerService->generateContentStrategy(
                $request->user()->id,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $strategy['content_pillars'] ?? [],
                'message' => 'Content pillars analyzed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Content pillars analysis failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze content pillars. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get competitive analysis
     */
    public function getStrategyCompetitiveAnalysis(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'industry' => 'nullable|string',
            'platforms' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'industry' => $request->industry ?? 'technology',
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
            ];

            $strategy = $this->contentStrategyPlannerService->generateContentStrategy(
                $request->user()->id,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $strategy['competitive_analysis'] ?? [],
                'message' => 'Competitive analysis completed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Strategy competitive analysis failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to complete competitive analysis. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get growth roadmap
     */
    public function getGrowthRoadmap(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'industry' => 'nullable|string',
            'goals' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'industry' => $request->industry ?? 'technology',
                'goals' => $request->goals ?? ['growth', 'engagement'],
            ];

            $strategy = $this->contentStrategyPlannerService->generateContentStrategy(
                $request->user()->id,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $strategy['growth_roadmap'] ?? [],
                'message' => 'Growth roadmap generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Growth roadmap generation failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate growth roadmap. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get KPI framework
     */
    public function getKPIFramework(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'goals' => 'nullable|array',
            'platforms' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'goals' => $request->goals ?? ['growth', 'engagement'],
                'platforms' => $request->platforms ?? ['youtube', 'instagram', 'tiktok'],
            ];

            $strategy = $this->contentStrategyPlannerService->generateContentStrategy(
                $request->user()->id,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $strategy['kpi_framework'] ?? [],
                'message' => 'KPI framework generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('KPI framework generation failed', [
                'user_id' => $request->user()->id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate KPI framework. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    // AI SEO Optimizer Endpoints

    /**
     * Analyze SEO performance for content
     */
    public function analyzeSEOPerformance(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content_id' => 'required|integer',
            'content_type' => 'required|string|in:video,blog,social',
            'industry' => 'nullable|string',
            'target_keywords' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'industry' => $request->industry ?? 'technology',
                'target_keywords' => $request->target_keywords ?? [],
            ];

            $analysis = $this->seoOptimizerService->analyzeSEOPerformance(
                $request->content_id,
                $request->content_type,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $analysis,
                'message' => 'SEO performance analyzed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('SEO performance analysis failed', [
                'content_id' => $request->content_id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze SEO performance. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Research keywords for content
     */
    public function researchKeywords(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'topic' => 'required|string|max:255',
            'industry' => 'nullable|string',
            'difficulty' => 'nullable|string|in:low,medium,high',
            'volume' => 'nullable|string|in:low,medium,high',
            'intent' => 'nullable|string|in:informational,commercial,navigational,transactional',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'difficulty' => $request->difficulty ?? 'medium',
                'volume' => $request->volume ?? 'medium',
                'intent' => $request->intent ?? 'informational',
            ];

            $research = $this->seoOptimizerService->researchKeywords(
                $request->topic,
                $request->industry ?? 'technology',
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $research,
                'message' => 'Keywords researched successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Keyword research failed', [
                'topic' => $request->topic,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to research keywords. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Optimize content for SEO
     */
    public function optimizeContentSEO(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|array',
            'content_type' => 'required|string|in:video,blog,social',
            'target_keywords' => 'required|array',
            'industry' => 'nullable|string',
            'platform' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'industry' => $request->industry ?? 'technology',
                'platform' => $request->platform ?? 'general',
            ];

            $optimization = $this->seoOptimizerService->optimizeContent(
                $request->content,
                $request->content_type,
                $request->target_keywords,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $optimization,
                'message' => 'Content optimized for SEO successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('SEO content optimization failed', [
                'content_type' => $request->content_type,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to optimize content for SEO. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Track search performance
     */
    public function trackSearchPerformance(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content_id' => 'required|integer',
            'content_type' => 'required|string|in:video,blog,social',
            'timeframe' => 'nullable|string|in:7d,30d,90d,180d',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'timeframe' => $request->timeframe ?? '30d',
            ];

            $performance = $this->seoOptimizerService->trackSearchPerformance(
                $request->content_id,
                $request->content_type,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $performance,
                'message' => 'Search performance tracked successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Search performance tracking failed', [
                'content_id' => $request->content_id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to track search performance. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Generate SEO recommendations
     */
    public function generateSEORecommendations(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content_id' => 'required|integer',
            'content_type' => 'required|string|in:video,blog,social',
            'industry' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'industry' => $request->industry ?? 'technology',
            ];

            $recommendations = $this->seoOptimizerService->generateSEORecommendations(
                $request->content_id,
                $request->content_type,
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $recommendations,
                'message' => 'SEO recommendations generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('SEO recommendations generation failed', [
                'content_id' => $request->content_id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate SEO recommendations. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Analyze competitor SEO strategies
     */
    public function analyzeCompetitorSEO(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'industry' => 'required|string',
            'competitors' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $options = [
                'timeframe' => $request->timeframe ?? '90d',
            ];

            $analysis = $this->seoOptimizerService->analyzeCompetitorSEO(
                $request->industry,
                $request->competitors ?? [],
                $options
            );

            return response()->json([
                'success' => true,
                'data' => $analysis,
                'message' => 'Competitor SEO analysis completed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Competitor SEO analysis failed', [
                'industry' => $request->industry,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze competitor SEO. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Detect watermarks in video
     */
    public function detectWatermarks(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_path' => 'required|string',
            'sensitivity' => 'nullable|string|in:low,medium,high',
            'detection_mode' => 'nullable|string|in:fast,balanced,thorough',
            'enable_learning' => 'nullable|boolean',
            'platform_focus' => 'nullable|string|in:tiktok,sora,custom,all',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $videoPath = Storage::path($request->video_path);
            
            if (!file_exists($videoPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file not found',
                ], 404);
            }

            $options = [
                'sensitivity' => $request->sensitivity ?? 'medium',
                'detection_mode' => $request->detection_mode ?? 'balanced',
                'enable_learning' => $request->enable_learning ?? true,
                'platform_focus' => $request->platform_focus ?? 'all',
            ];

            // Use enhanced detection with learning if enabled
            if ($options['enable_learning']) {
                $detection = $this->watermarkRemoverService->detectWatermarksWithLearning($videoPath, $options);
            } else {
                $detection = $this->watermarkRemoverService->detectWatermarks($videoPath, $options);
            }

            // Filter watermarks by platform focus if specified
            if ($options['platform_focus'] !== 'all' && !empty($detection['detected_watermarks'])) {
                $detection['detected_watermarks'] = array_filter(
                    $detection['detected_watermarks'],
                    function($watermark) use ($options) {
                        return ($watermark['platform'] ?? 'unknown') === $options['platform_focus'];
                    }
                );
                $detection['detected_watermarks'] = array_values($detection['detected_watermarks']);
            }

            // Add detection statistics
            $detection['detection_stats'] = $this->watermarkRemoverService->getDetectionStats();
            $detection['platform_breakdown'] = $this->getPlatformBreakdown($detection['detected_watermarks']);

            Log::info('Enhanced watermark detection completed', [
                'user_id' => $request->user()->id ?? null,
                'video_path' => $request->video_path,
                'watermarks_found' => count($detection['detected_watermarks'] ?? []),
                'platform_focus' => $options['platform_focus'],
                'enable_learning' => $options['enable_learning'],
            ]);

            return response()->json([
                'success' => true,
                'data' => $detection,
                'message' => 'Enhanced watermark detection completed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Enhanced watermark detection failed', [
                'user_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
                'video_path' => $request->video_path ?? 'unknown',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to detect watermarks. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get platform breakdown of detected watermarks
     */
    private function getPlatformBreakdown(array $watermarks): array
    {
        $breakdown = [
            'tiktok' => ['count' => 0, 'confidence_avg' => 0, 'types' => []],
            'sora' => ['count' => 0, 'confidence_avg' => 0, 'types' => []],
            'custom' => ['count' => 0, 'confidence_avg' => 0, 'types' => []],
            'unknown' => ['count' => 0, 'confidence_avg' => 0, 'types' => []],
        ];

        foreach ($watermarks as $watermark) {
            $platform = $watermark['platform'] ?? 'unknown';
            $type = $watermark['type'] ?? 'unknown';
            
            if (!isset($breakdown[$platform])) {
                $breakdown[$platform] = ['count' => 0, 'confidence_avg' => 0, 'types' => []];
            }
            
            $breakdown[$platform]['count']++;
            $breakdown[$platform]['confidence_avg'] += $watermark['confidence'] ?? 0;
            
            if (!in_array($type, $breakdown[$platform]['types'])) {
                $breakdown[$platform]['types'][] = $type;
            }
        }

        // Calculate average confidence
        foreach ($breakdown as $platform => &$data) {
            if ($data['count'] > 0) {
                $data['confidence_avg'] = round($data['confidence_avg'] / $data['count'], 2);
            }
        }

        return $breakdown;
    }

    /**
     * Remove watermarks from video
     */
    public function removeWatermarks(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_path' => 'required|string',
            'watermarks' => 'required|array',
            'watermarks.*' => 'required|array',
            'method' => 'nullable|string|in:inpainting,content_aware,temporal_coherence,frequency_domain',
            'quality_preset' => 'nullable|string|in:fast,balanced,high,ultra',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $videoPath = Storage::path($request->video_path);
            
            if (!file_exists($videoPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file not found',
                ], 404);
            }

            $options = [
                'method' => $request->method ?? 'inpainting',
                'quality_preset' => $request->quality_preset ?? 'balanced',
            ];

            $removal = $this->watermarkRemoverService->removeWatermarks(
                $videoPath, 
                $request->watermarks, 
                $options
            );

            Log::info('Watermark removal started', [
                'user_id' => $request->user()->id ?? null,
                'video_path' => $request->video_path,
                'removal_id' => $removal['removal_id'] ?? 'unknown',
                'watermarks_count' => count($request->watermarks),
            ]);

            return response()->json([
                'success' => true,
                'data' => $removal,
                'message' => 'Watermark removal started successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Watermark removal failed', [
                'user_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
                'video_path' => $request->video_path ?? 'unknown',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to start watermark removal. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get watermark removal progress
     */
    public function getRemovalProgress(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'removal_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $progress = $this->watermarkRemoverService->getRemovalProgress($request->removal_id);

            return response()->json([
                'success' => true,
                'data' => $progress,
                'message' => 'Removal progress retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get removal progress', [
                'removal_id' => $request->removal_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get removal progress. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Optimize watermark removal settings
     */
    public function optimizeRemovalSettings(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'watermarks' => 'required|array',
            'video_metadata' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $optimization = $this->watermarkRemoverService->optimizeRemovalSettings(
                $request->watermarks,
                $request->video_metadata ?? []
            );

            return response()->json([
                'success' => true,
                'data' => $optimization,
                'message' => 'Removal settings optimized successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Removal settings optimization failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to optimize removal settings. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Analyze watermark removal quality
     */
    public function analyzeRemovalQuality(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'original_path' => 'required|string',
            'processed_path' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $originalPath = Storage::path($request->original_path);
            $processedPath = Storage::path($request->processed_path);
            
            if (!file_exists($originalPath) || !file_exists($processedPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video files not found',
                ], 404);
            }

            $analysis = $this->watermarkRemoverService->analyzeRemovalQuality($originalPath, $processedPath);

            return response()->json([
                'success' => true,
                'data' => $analysis,
                'message' => 'Quality analysis completed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Quality analysis failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze removal quality. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Generate watermark removal report
     */
    public function generateRemovalReport(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'removal_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $report = $this->watermarkRemoverService->generateRemovalReport($request->removal_id);

            return response()->json([
                'success' => true,
                'data' => $report,
                'message' => 'Removal report generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Report generation failed', [
                'removal_id' => $request->removal_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate removal report. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Generate subtitles for video
     */
    public function generateSubtitles(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
            'language' => 'nullable|string',
            'style' => 'nullable|string|in:simple,modern,neon,typewriter,bounce,confetti,glass',
            'position' => 'nullable|string|in:bottom_center,bottom_left,bottom_right,top_center,top_left,top_right,center,center_left,center_right',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            // Get the video record first
            $video = \App\Models\Video::findOrFail($request->video_id);
            
            // Ensure user owns this video
            if ($video->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to video',
                ], 403);
            }
            
            // Check if video has a file path
            if (!$video->original_file_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file path not available. Please ensure the video is properly uploaded.',
                ], 404);
            }

            // Convert storage path to absolute path
            $videoPath = Storage::path($video->original_file_path);
            
            if (!file_exists($videoPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file not found on disk. The file may have been moved or deleted.',
                ], 404);
            }

            $options = [
                'video_id' => $request->video_id,
                'language' => $request->language ?? 'en',
                'style' => $request->style ?? 'simple',
                'position' => $request->position ?? 'bottom_center',
            ];

            $generation = $this->subtitleGeneratorService->generateSubtitles($videoPath, $options);

            Log::info('Subtitle generation started', [
                'user_id' => $request->user()->id ?? null,
                'video_id' => $video->id,
                'video_file_path' => $video->original_file_path,
                'generation_id' => $generation['generation_id'] ?? 'unknown',
                'language' => $options['language'],
            ]);

            return response()->json([
                'success' => true,
                'data' => $generation,
                'message' => 'Subtitle generation started successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Subtitle generation failed', [
                'user_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
                'video_id' => $request->video_id ?? 'unknown',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to start subtitle generation. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Check if subtitles exist for a video
     */
    public function checkSubtitles(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $video = \App\Models\Video::findOrFail($request->video_id);
            
            // Ensure user owns this video
            if ($video->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to video',
                ], 403);
            }
            
            Log::info('Checking subtitles for video', [
                'video_id' => $video->id,
                'has_subtitles' => $video->hasSubtitles(),
                'subtitle_generation_id' => $video->subtitle_generation_id,
                'subtitle_status' => $video->subtitle_status,
                'subtitle_data_count' => $video->subtitle_data ? count($video->subtitle_data['subtitles'] ?? []) : 0,
            ]);
            
            if ($video->hasSubtitles()) {
                $videoSubtitleData = $video->subtitle_data;
                // Handle if subtitle_data is still stored as JSON string
                if (is_string($videoSubtitleData)) {
                    $videoSubtitleData = json_decode($videoSubtitleData, true);
                }
                
                // Handle if subtitles within subtitle_data is still a JSON string
                if (isset($videoSubtitleData['subtitles']) && is_string($videoSubtitleData['subtitles'])) {
                    $videoSubtitleData['subtitles'] = json_decode($videoSubtitleData['subtitles'], true);
                }
                
                $subtitleData = [
                    'generation_id' => $video->subtitle_generation_id,
                    'processing_status' => 'completed',
                    'subtitles' => $videoSubtitleData['subtitles'] ?? [],
                    'language' => $video->subtitle_language,
                    'srt_file' => $video->subtitle_file_path,
                    'created_at' => $video->subtitles_generated_at,
                ];
                
                Log::info('Returning existing subtitles', [
                    'video_id' => $video->id,
                    'subtitle_count' => count($subtitleData['subtitles']),
                    'generation_id' => $subtitleData['generation_id'],
                ]);
                
                return response()->json([
                    'success' => true,
                    'data' => $subtitleData,
                    'message' => 'Existing subtitles found',
                ]);
            }

            Log::info('No existing subtitles found', ['video_id' => $video->id]);
            
            return response()->json([
                'success' => true,
                'data' => null,
                'message' => 'No existing subtitles found',
            ]);

        } catch (\Exception $e) {
            Log::error('Subtitle check failed', [
                'video_id' => $request->video_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to check existing subtitles.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get subtitle generation progress
     */
    public function getSubtitleProgress(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'generation_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $progress = $this->subtitleGeneratorService->getGenerationProgress($request->generation_id);

            return response()->json([
                'success' => true,
                'data' => $progress,
                'message' => 'Generation progress retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get subtitle progress', [
                'generation_id' => $request->generation_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get generation progress. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update subtitle style
     */
    public function updateSubtitleStyle(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'generation_id' => 'required|string',
            'style' => 'required|string|in:simple,modern,neon,typewriter,bounce,confetti,glass',
            'custom_properties' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $result = $this->subtitleGeneratorService->updateSubtitleStyle(
                $request->generation_id,
                $request->style,
                $request->custom_properties ?? []
            );

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Subtitle style updated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Subtitle style update failed', [
                'generation_id' => $request->generation_id,
                'style' => $request->style,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update subtitle style. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update subtitle position
     */
    public function updateSubtitlePosition(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'generation_id' => 'required|string',
            'position' => 'required|array',
            'position.x' => 'required|numeric|min:0|max:100',
            'position.y' => 'required|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $result = $this->subtitleGeneratorService->updateSubtitlePosition(
                $request->generation_id,
                $request->position
            );

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Subtitle position updated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Subtitle position update failed', [
                'generation_id' => $request->generation_id,
                'position' => $request->position,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update subtitle position. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Export subtitles
     */
    public function exportSubtitles(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'generation_id' => 'required|string',
            'format' => 'nullable|string|in:srt,vtt,ass,sub',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $export = $this->subtitleGeneratorService->exportSubtitles(
                $request->generation_id,
                $request->format ?? 'srt'
            );

            // Update the file URL to use our direct download route
            $export['file_url'] = route('subtitle-download', [
                'generation_id' => $request->generation_id,
                'format' => $request->format ?? 'srt'
            ]);

            return response()->json([
                'success' => true,
                'data' => $export,
                'message' => 'Subtitles exported successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Subtitle export failed', [
                'generation_id' => $request->generation_id,
                'format' => $request->format ?? 'srt',
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to export subtitles. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Download subtitle file
     */
    public function downloadSubtitleFile(Request $request, string $generationId, string $format = 'srt')
    {
        try {
            $export = $this->subtitleGeneratorService->exportSubtitles($generationId, $format);
            
            if (!isset($export['file_path']) || !file_exists($export['file_path'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Subtitle file not found.',
                ], 404);
            }

            $fileName = "subtitles_{$generationId}.{$format}";
            
            return response()->download($export['file_path'], $fileName, [
                'Content-Type' => $this->getSubtitleMimeType($format),
            ]);

        } catch (\Exception $e) {
            Log::error('Subtitle download failed', [
                'generation_id' => $generationId,
                'format' => $format,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to download subtitle file.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get MIME type for subtitle formats
     */
    private function getSubtitleMimeType(string $format): string
    {
        return match($format) {
            'srt' => 'application/x-subrip',
            'vtt' => 'text/vtt',
            'ass' => 'text/x-ssa',
            'sub' => 'text/plain',
            default => 'text/plain',
        };
    }

    /**
     * Apply style to all subtitles
     */
    public function applyStyleToAllSubtitles(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'generation_id' => 'required|string',
            'style' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $result = $this->subtitleGeneratorService->applyStyleToAllSubtitles(
                $request->input('generation_id'),
                $request->input('style')
            );

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Style applied to all subtitles successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Apply style to all subtitles failed', [
                'generation_id' => $request->input('generation_id'),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to apply style to all subtitles. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get word timing file for a generation
     */
    public function getWordTimingFile(Request $request, string $generationId): JsonResponse
    {
        try {
            // Get the generation progress to find the word timing file
            $generation = $this->subtitleGeneratorService->getGenerationProgress($generationId);
            
            if ($generation['processing_status'] !== 'completed') {
                return response()->json([
                    'success' => false,
                    'message' => 'Subtitle generation not completed',
                ], 404);
            }

            // Check if word timing file exists in generation data
            $wordTimingPath = null;
            
            // First check cache
            $cached = \Illuminate\Support\Facades\Cache::get("subtitle_generation_{$generationId}");
            if ($cached && isset($cached['word_timing_file'])) {
                $wordTimingPath = $cached['word_timing_file'];
            }
            
            // Then check database
            if (!$wordTimingPath) {
                $video = \App\Models\Video::where('subtitle_generation_id', $generationId)->first();
                if ($video && $video->subtitle_data) {
                    $subtitleData = $video->subtitle_data;
                    if (is_string($subtitleData)) {
                        $subtitleData = json_decode($subtitleData, true);
                    }
                    $wordTimingPath = $subtitleData['word_timing_file'] ?? null;
                }
            }
            
            // Fallback: construct expected path
            if (!$wordTimingPath) {
                $wordTimingPath = storage_path('app/subtitles/words_' . $generationId . '.json');
            }

            if (!file_exists($wordTimingPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Word timing file not found',
                ], 404);
            }

            $wordTimingData = json_decode(file_get_contents($wordTimingPath), true);
            
            if (!$wordTimingData) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid word timing file format',
                ], 500);
            }

            return response()->json([
                'success' => true,
                'data' => $wordTimingData,
                'message' => 'Word timing data retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Word timing file retrieval failed', [
                'generation_id' => $generationId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve word timing data.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Analyze subtitle quality
     */
    public function analyzeSubtitleQuality(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'generation_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $analysis = $this->subtitleGeneratorService->analyzeSubtitleQuality($request->generation_id);

            return response()->json([
                'success' => true,
                'data' => $analysis,
                'message' => 'Subtitle quality analyzed successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Subtitle quality analysis failed', [
                'generation_id' => $request->generation_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze subtitle quality. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get available subtitle languages
     */
    public function getSubtitleLanguages(Request $request): JsonResponse
    {
        try {
            $languages = $this->subtitleGeneratorService->getAvailableLanguages();

            return response()->json([
                'success' => true,
                'data' => $languages,
                'message' => 'Available languages retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get subtitle languages', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get available languages. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get available subtitle styles
     */
    public function getSubtitleStyles(Request $request): JsonResponse
    {
        try {
            $styles = $this->subtitleGeneratorService->getSubtitleStyles();

            return response()->json([
                'success' => true,
                'data' => $styles,
                'message' => 'Available styles retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get subtitle styles', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get available styles. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Generate AI-optimized title and description based on video content analysis
     */
    public function generateVideoContent(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
            'content_type' => 'required|string|in:title,description,both',
            'current_title' => 'nullable|string|max:255',
            'current_description' => 'nullable|string|max:5000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $video = \App\Models\Video::findOrFail($request->video_id);
            
            // Get video file path from storage
            if (!$video->original_file_path) {
                Log::warning('Video analysis skipped - no original file path', [
                    'video_id' => $video->id,
                    'user_id' => $request->user()->id,
                    'video_title' => $video->title,
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Video file path not available. This may be an external video or the file was not properly uploaded. Please upload a video file to use AI content generation.',
                ], 404);
            }

            // Convert storage path to absolute path
            $videoPath = Storage::path($video->original_file_path);
            
            if (!file_exists($videoPath)) {
                Log::error('Video file missing from disk', [
                    'video_id' => $video->id,
                    'user_id' => $request->user()->id,
                    'original_file_path' => $video->original_file_path,
                    'absolute_path' => $videoPath,
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Video file not found on disk. The file may have been moved or deleted. Please re-upload your video to use AI content generation.',
                ], 404);
            }

            // Analyze video content
            Log::info('Analyzing video content for AI generation', [
                'video_id' => $video->id,
                'video_path' => $videoPath
            ]);

            $videoAnalysis = $this->videoAnalyzerService->analyzeVideo($videoPath, [
                'include_transcript' => true,
                'include_scenes' => true,
                'include_mood' => true
            ]);
            
            $result = [];
            
            if ($request->content_type === 'title' || $request->content_type === 'both') {
                $result['optimized_title'] = $this->aiService->generateTitleFromVideoAnalysis($videoAnalysis);
            }
            
            if ($request->content_type === 'description' || $request->content_type === 'both') {
                $result['optimized_description'] = $this->aiService->generateDescriptionFromVideoAnalysis($videoAnalysis);
            }

            // Include analysis summary for debugging
            $result['analysis_summary'] = [
                'has_transcript' => $videoAnalysis['transcript']['success'] ?? false,
                'content_category' => $videoAnalysis['content_category']['primary_category'] ?? 'unknown',
                'mood' => $videoAnalysis['mood_analysis']['dominant_mood'] ?? 'neutral',
                'scenes_detected' => count($videoAnalysis['scenes']['scenes'] ?? []),
                'duration' => $videoAnalysis['basic_info']['duration'] ?? 0,
            ];

            Log::info('AI video content generation completed', [
                'user_id' => $request->user()->id,
                'video_id' => $request->video_id,
                'content_type' => $request->content_type,
                'has_transcript' => $result['analysis_summary']['has_transcript'],
                'category' => $result['analysis_summary']['content_category'],
            ]);

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Content generated successfully based on video analysis',
            ]);

        } catch (\Exception $e) {
            Log::error('AI video content generation failed', [
                'user_id' => $request->user()->id,
                'video_id' => $request->video_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze video and generate content. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Apply subtitles to video (burn subtitles into video)
     */
    public function applySubtitlesToVideo(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'generation_id' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $result = $this->subtitleGeneratorService->applySubtitlesToVideo($request->generation_id);

            Log::info('Subtitles applied to video successfully', [
                'generation_id' => $request->generation_id,
                'processed_video_path' => $result['processed_video_path'] ?? 'unknown',
            ]);

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Subtitles applied to video successfully. The processed video is ready for download.',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to apply subtitles to video', [
                'generation_id' => $request->generation_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to apply subtitles to video. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Set a thumbnail for a video
     */
    public function setVideoThumbnail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
            'frame_id' => 'required|string',
            'thumbnail_path' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $video = \App\Models\Video::findOrFail($request->video_id);
            
            // Verify the user owns this video
            if ($video->user_id !== $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to video',
                ], 403);
            }

            // Verify the thumbnail file exists
            $thumbnailPath = $request->thumbnail_path;
            if (!Storage::exists($thumbnailPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Thumbnail file not found',
                ], 404);
            }

            // Update the video's thumbnail
            $video->update([
                'thumbnail_path' => $thumbnailPath,
            ]);

            Log::info('Video thumbnail set', [
                'user_id' => $request->user()->id,
                'video_id' => $request->video_id,
                'frame_id' => $request->frame_id,
                'thumbnail_path' => $thumbnailPath,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Thumbnail set successfully for all platforms',
                'data' => [
                    'video_id' => $video->id,
                    'thumbnail_path' => $thumbnailPath,
                    'thumbnail_url' => Storage::url($thumbnailPath),
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Setting video thumbnail failed', [
                'user_id' => $request->user()->id,
                'video_id' => $request->video_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to set thumbnail. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update subtitle text
     */
    public function updateSubtitleText(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'generation_id' => 'required|string',
            'subtitle_id' => 'required|string',
            'text' => 'required|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $result = $this->subtitleGeneratorService->updateSubtitleText(
                $request->generation_id,
                $request->subtitle_id,
                $request->text
            );

            Log::info('Subtitle text updated', [
                'generation_id' => $request->generation_id,
                'subtitle_id' => $request->subtitle_id,
            ]);

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Subtitle text updated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update subtitle text', [
                'generation_id' => $request->generation_id,
                'subtitle_id' => $request->subtitle_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update subtitle text. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update subtitle style for individual subtitle
     */
    public function updateIndividualSubtitleStyle(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'generation_id' => 'required|string',
            'subtitle_id' => 'required|string',
            'style' => 'required|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $result = $this->subtitleGeneratorService->updateIndividualSubtitleStyle(
                $request->generation_id,
                $request->subtitle_id,
                $request->style
            );

            Log::info('Individual subtitle style updated', [
                'generation_id' => $request->generation_id,
                'subtitle_id' => $request->subtitle_id,
            ]);

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Subtitle style updated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update individual subtitle style', [
                'generation_id' => $request->generation_id,
                'subtitle_id' => $request->subtitle_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update subtitle style. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update subtitle position for individual subtitle
     */
    public function updateIndividualSubtitlePosition(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'generation_id' => 'required|string',
            'subtitle_id' => 'required|string',
            'position' => 'required|array',
            'position.x' => 'required|numeric|min:0|max:100',
            'position.y' => 'required|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $result = $this->subtitleGeneratorService->updateIndividualSubtitlePosition(
                $request->generation_id,
                $request->subtitle_id,
                $request->position
            );

            Log::info('Individual subtitle position updated', [
                'generation_id' => $request->generation_id,
                'subtitle_id' => $request->subtitle_id,
                'position' => $request->position,
            ]);

            return response()->json([
                'success' => true,
                'data' => $result,
                'message' => 'Subtitle position updated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update individual subtitle position', [
                'generation_id' => $request->generation_id,
                'subtitle_id' => $request->subtitle_id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update subtitle position. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Render video with subtitles and upload to all platforms
     */
    public function renderVideoWithSubtitles(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'generation_id' => 'required|string',
            'video_id' => 'required|integer|exists:videos,id',
        ]);

        Log::info('Render video with subtitles request', [
            'generation_id' => $request->generation_id,
            'video_id' => $request->video_id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $video = \App\Models\Video::findOrFail($request->video_id);

            // Verify the user owns this video
            if ($video->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to video',
                ], 403);
            }

            Log::info('User owns video');

            // Set status to processing
            $video->rendered_video_status = 'processing';
            $video->save();

            Log::info('Video status set to processing');

            // Dispatch the background job
            \App\Jobs\RenderVideoWithSubtitlesJob::dispatch($request->generation_id, $video->id);

            Log::info('Video rendering job dispatched');

            return response()->json([
                'success' => true,
                'message' => 'Video rendering started in background',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to start video rendering',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Check the rendering status and get the rendered video link
     */
    public function getRenderedVideoStatus(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $video = \App\Models\Video::findOrFail($request->video_id);
        if ($video->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to video',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'status' => $video->rendered_video_status,
            'rendered_video_path' => $video->rendered_video_path,
        ]);
    }

    /**
     * Set video thumbnail from captured frame
     */
    public function setVideoThumbnailFromFrame(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
            'frame_id' => 'required|string',
            'thumbnail' => 'required|image|mimes:jpeg,png,jpg|max:5120', // 5MB max
            'current_time' => 'required|numeric|min:0',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $video = \App\Models\Video::findOrFail($request->video_id);
            
            // Verify the user owns this video
            if ($video->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to video',
                ], 403);
            }

            $thumbnailFile = $request->file('thumbnail');
            $frameId = $request->frame_id;
            $currentTime = (float) $request->current_time;

            // Generate a unique filename for the thumbnail
            $thumbnailPath = 'thumbnails/' . $video->id . '_' . $frameId . '_' . time() . '.jpg';
            
            // Store the thumbnail
            $storedPath = $thumbnailFile->storeAs('public', $thumbnailPath);
            
            if (!$storedPath) {
                throw new \Exception('Failed to store thumbnail file');
            }

            // Update the video record with the new thumbnail
            $video->update([
                'thumbnail_path' => $thumbnailPath,
                'thumbnail_time' => $currentTime,
                'updated_at' => now(),
            ]);

            // Generate the public URL for the thumbnail
            $thumbnailUrl = Storage::url($thumbnailPath);

            return response()->json([
                'success' => true,
                'data' => [
                    'thumbnail_path' => $thumbnailPath,
                    'thumbnail_url' => $thumbnailUrl,
                    'frame_id' => $frameId,
                    'current_time' => $currentTime,
                ],
                'message' => 'Thumbnail set successfully from video frame',
            ]);

        } catch (\Exception $e) {
            Log::error('Error setting video thumbnail from frame: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to set thumbnail: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Analyze video and generate tags using AI
     */
    public function analyzeVideoTags(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $video = \App\Models\Video::findOrFail($request->video_id);
            
            // Verify the user owns this video
            if ($video->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to video',
                ], 403);
            }

            // Get video file path
            if (!$video->original_file_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file path not available',
                ], 404);
            }

            $videoPath = Storage::path($video->original_file_path);
            
            if (!file_exists($videoPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Video file not found',
                ], 404);
            }

            $startTime = microtime(true);

            // Perform actual video analysis with error handling
            $videoAnalysis = [];
            try {
                $videoAnalysis = $this->performDeepVideoAnalysis($videoPath);
            } catch (\Exception $e) {
                Log::error('Video analysis failed, using minimal analysis', [
                    'video_id' => $request->video_id,
                    'error' => $e->getMessage(),
                ]);
                // Provide minimal fallback analysis
                $videoAnalysis = [
                    'suggested_tags' => ['video', 'content', 'social'],
                    'optimized_content' => [],
                    'confidence' => 0.5,
                    'properties' => [],
                    'features' => [],
                    'content_type' => 'general',
                    'mood' => 'general',
                    'target_audience' => 'general',
                    'content_description' => 'Video content',
                    'themes' => [],
                    'visual_elements' => [],
                ];
            }

            Log::info('Video analysis', [
                'video_id' => $request->video_id,
                'video_analysis' => $videoAnalysis,
            ]);

            $tags = $videoAnalysis['suggested_tags'] ?? [];
            
            // Ensure we have at least some basic tags if analysis didn't return any
            if (empty($tags)) {
                Log::warning('Video analsis failed, no tags generated', [
                    'video_id' => $request->video_id,
                ]);
            }
            
            // Clean and limit tags
            $tags = array_filter(array_unique($tags), function($tag) {
                return !empty($tag) && strlen(trim($tag)) > 1;
            });
            $tags = array_slice(array_values($tags), 0, 12); // Limit to 12 tags

            // Save tags to the video's database field
            $video->update(['tags' => $tags]);

            $processingTime = round(microtime(true) - $startTime, 2);

            Log::info('Video tags analyzed successfully', [
                'video_id' => $request->video_id,
                'generated_tags_count' => count($tags),
                'processing_time' => $processingTime,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'optimized_content' => $videoAnalysis['optimized_content'] ?? [],
                    'analysis' => [
                        'confidence' => $videoAnalysis['confidence'] ?? 0.88,
                        'processing_time' => $processingTime . 's',
                        'method' => 'AI Video Content Analysis + Content Optimization',
                        'video_properties' => $videoAnalysis['properties'] ?? [],
                        'detected_features' => $videoAnalysis['features'] ?? [],
                        'content_type' => $videoAnalysis['content_type'] ?? 'general',
                        'mood' => $videoAnalysis['mood'] ?? 'general',
                        'target_audience' => $videoAnalysis['target_audience'] ?? 'general',
                        'content_description' => $videoAnalysis['content_description'] ?? '',
                        'themes' => $videoAnalysis['themes'] ?? [],
                        'visual_elements' => $videoAnalysis['visual_elements'] ?? [],
                        'tags' => $tags,
                    ]
                ],
                'message' => 'Video analysis completed with optimized content generation',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to analyze video tags', [
                'video_id' => $request->video_id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to analyze video tags. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Perform deep video analysis using FFmpeg and AI
     */
    private function performDeepVideoAnalysis(string $videoPath): array
    {
        try {
            // Extract video metadata using FFProbe
            $ffprobe = $this->ffmpegService->getFFProbe();
            
            if (!$ffprobe) {
                Log::warning('FFProbe not available for video analysis');
                return $this->getFallbackVideoAnalysis();
            }

            $format = $ffprobe->format($videoPath);
            $streams = $ffprobe->streams($videoPath);
            
            $videoData = [
                'format' => [
                    'duration' => $format->get('duration'),
                    'size' => $format->get('size'),
                    'bit_rate' => $format->get('bit_rate'),
                ],
                'streams' => []
            ];

            foreach ($streams as $stream) {
                $videoData['streams'][] = [
                    'codec_type' => $stream->get('codec_type'),
                    'width' => $stream->get('width'),
                    'height' => $stream->get('height'),
                    'duration' => $stream->get('duration'),
                    'r_frame_rate' => $stream->get('r_frame_rate'),
                ];
            }

            // Extract video frames for analysis (3 frames at different intervals)
            $tempDir = storage_path('app/temp');
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }

            $frameFiles = [];
            $duration = floatval($videoData['format']['duration'] ?? 30);
            $intervals = [0.1, 0.5, 0.9]; // 10%, 50%, 90% through video

            $ffmpeg = $this->ffmpegService->getFFMpeg();
            if ($ffmpeg) {
                $video = $ffmpeg->open($videoPath);
                
                foreach ($intervals as $i => $interval) {
                    $timestamp = $duration * $interval;
                    $frameFile = $tempDir . '/frame_' . uniqid() . '.jpg';
                    
                    try {
                        $frame = $video->frame(\FFMpeg\Coordinate\TimeCode::fromSeconds($timestamp));
                        $frame->save($frameFile);
                        
                        if (file_exists($frameFile)) {
                            $frameFiles[] = $frameFile;
                        }
                    } catch (\Exception $e) {
                        Log::warning('Failed to extract frame at timestamp ' . $timestamp, ['error' => $e->getMessage()]);
                    }
                }
            }

            // Analyze video properties
            $videoStream = null;
            $audioStream = null;
            
            foreach ($videoData['streams'] ?? [] as $stream) {
                if ($stream['codec_type'] === 'video' && !$videoStream) {
                    $videoStream = $stream;
                } elseif ($stream['codec_type'] === 'audio' && !$audioStream) {
                    $audioStream = $stream;
                }
            }

            // Generate AI description based on video analysis
            $aiAnalysis = $this->analyzeVideoContentWithOpenAI($frameFiles, $videoData);

            // Clean up temporary files
            foreach ($frameFiles as $frameFile) {
                if (file_exists($frameFile)) {
                    unlink($frameFile);
                }
            }

            return $aiAnalysis;

        } catch (\Exception $e) {
            Log::error('Video analysis failed: ' . $e->getMessage());
            return $this->getFallbackVideoAnalysis();
        }
    }

    /**
     * Get fallback video analysis when FFmpeg is not available
     */
    private function getFallbackVideoAnalysis(): array
    {
        return [
            'suggested_tags' => ['video', 'content'],
            'optimized_content' => [],
            'confidence' => 0.3,
            'properties' => [],
            'features' => [],
            'content_type' => 'general',
            'mood' => 'general',
            'target_audience' => 'general',
            'content_description' => 'Video content analysis failed',
            'themes' => [],
            'visual_elements' => [],
        ];
    }

    /**
     * Analyze video content using OpenAI Vision API and generate optimized content
     */
    private function analyzeVideoContentWithOpenAI(array $frameFiles, array $videoData): array
    {
        try {
            if (empty($frameFiles)) {
                return [
                    'error' => 'No frame files provided',
                ];
            }

            // Convert first frame to base64 for OpenAI analysis
            $firstFrame = $frameFiles[0];
            $imageData = base64_encode(file_get_contents($firstFrame));
            
            $openaiKey = config('openai.api_key');
            if (!$openaiKey) {
                throw new \Exception('OpenAI API key not configured');
            }

            // Determine if this is a short-form video (under 60 seconds)
            $duration = floatval($videoData['format']['duration'] ?? 0);
            $isShortForm = $duration < 60;
            
            // Enhanced prompt for comprehensive analysis including content optimization
            $descriptionLength = $isShortForm ? 'short and punchy (1-2 sentences)' : 'detailed and comprehensive (2-4 sentences)';
            $prompt = "Analyze this video frame and generate comprehensive content optimization data. " . 
                     ($isShortForm ? "This is a short-form video (under 60 seconds), so descriptions should be brief and impactful. " : "This is a longer-form video, so descriptions can be more detailed. ") .
                     "Provide a JSON response with the following structure:
            {
                \"content_type\": \"tutorial|gaming|music|comedy|tech|food|travel|fitness|beauty|diy|educational|entertainment|business|lifestyle|sports|news|general\",
                \"features\": [\"list of detected features like 'person', 'text_overlay', 'graphics', 'product', 'landscape', etc.\"],
                \"themes\": [\"list of thematic elements like 'professional', 'casual', 'colorful', 'minimal', 'dark', 'bright', etc.\"],
                \"visual_elements\": [\"list of visual elements like 'close_up', 'wide_shot', 'animation', 'real_person', 'logo', 'charts', etc.\"],
                \"mood\": \"energetic|calm|professional|fun|serious|inspiring|educational|entertaining\",
                \"target_audience\": \"kids|teens|adults|professionals|seniors|general\",
                \"content_description\": \"A detailed description of what's happening in the video based on the frame\",
                \"optimized_titles\": {
                    \"youtube\": \"Engaging YouTube title (under 60 chars)\",
                    \"tiktok\": \"Catchy TikTok caption (under 150 chars)\",
                    \"instagram\": \"Instagram story-style caption\",
                    \"general\": \"Universal engaging title\"
                },
                \"optimized_descriptions\": {
                    \"youtube\": \"SEO-optimized YouTube description with keywords and structure - {$descriptionLength}\",
                    \"tiktok\": \"Fun TikTok description with trending language - {$descriptionLength}\",
                    \"instagram\": \"Instagram description that builds community - {$descriptionLength}\",
                    \"general\": \"Universal description suitable for all platforms - {$descriptionLength}\"
                },
                \"suggested_tags\": [\"list of 8-12 hashtags for best discoverability accross all social media platforms\"]
            }
            
            Only respond with valid JSON, no additional text.";

            $response = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Bearer ' . $openaiKey,
                'Content-Type' => 'application/json',
            ])->timeout(45)->post('https://api.openai.com/v1/chat/completions', [
                'model' => 'gpt-4o',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'You are an expert social media content optimizer and video analyst. Analyze video content and generate platform-specific optimized titles, descriptions, and hashtags that maximize engagement and discoverability.'
                    ],
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => $prompt
                            ],
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => 'data:image/jpeg;base64,' . $imageData
                                ]
                            ]
                        ]
                    ]
                ],
                'max_tokens' => 1500,
                'temperature' => 0.7,
            ]);

            if ($response->successful()) {
                $result = $response->json();
                $content = $result['choices'][0]['message']['content'] ?? '{}';
                
                // Clean up the response and parse JSON
                $content = trim($content);
                $content = preg_replace('/```json\s*/', '', $content);
                $content = preg_replace('/\s*```/', '', $content);
                
                $analysis = json_decode($content, true);
                
                // Debug logging for OpenAI response
                Log::info('OpenAI video analysis response', [
                    'raw_content' => $content,
                    'parsed_analysis' => $analysis,
                    'json_error' => json_last_error_msg(),
                    'has_suggested_tags' => isset($analysis['suggested_tags']),
                    'suggested_tags_count' => isset($analysis['suggested_tags']) ? count($analysis['suggested_tags']) : 0,
                ]);
                
                if (json_last_error() === JSON_ERROR_NONE && is_array($analysis)) {
                    // Process the analysis with AIContentOptimizationService
                    $optimizedContent = $this->processVideoAnalysisWithOptimizationService($analysis, $videoData);
                    $analysis['optimized_content'] = $optimizedContent;
                    
                    return $analysis;
                }
            }

            Log::error('OpenAI video analysis failed', [
                'error' => $response->body(),
            ]);

            return [
                'error' => 'Analysis failed #2',
            ];

        } catch (\Exception $e) {
            Log::error('OpenAI video analysis failed: ' . $e->getMessage());
            
            return [
                'error' => 'Analysis failed #3',
            ];
        }
    }

    /**
     * Generate tags from actual video analysis
     */
    private function generateTagsFromVideoAnalysis(array $videoInfo): array
    {
        $tags = [];
        $analysis = $videoInfo['analysis'] ?? [];
        
        // Add content type as primary tag
        $contentType = $analysis['content_type'] ?? 'general';
        if ($contentType !== 'general') {
            $tags[] = $contentType;
        }

        // Add feature-based tags
        $features = $analysis['features'] ?? [];
        foreach ($features as $feature) {
            if (strlen($feature) > 2 && !in_array($feature, $tags)) {
                $tags[] = strtolower($feature);
            }
        }

        // Add theme-based tags
        $themes = $analysis['themes'] ?? [];
        foreach ($themes as $theme) {
            if (strlen($theme) > 2 && !in_array($theme, $tags)) {
                $tags[] = strtolower($theme);
            }
        }

        // Add duration-based tags
        $duration = $videoInfo['duration'] ?? 0;
        if ($duration > 0) {
            if ($duration < 60) {
                $tags[] = 'shorts';
            } elseif ($duration > 600) {
                $tags[] = 'longform';
            }
        }

        // Add metadata-based tags
        $text = strtolower(($videoInfo['title'] ?? '') . ' ' . ($videoInfo['description'] ?? ''));
        
        // Enhanced keyword detection
        $keywordCategories = [
            'tutorial' => ['tutorial', 'howto', 'guide', 'learn', 'explain', 'teach'],
            'gaming' => ['game', 'gaming', 'play', 'gamer', 'gameplay', 'stream'],
            'music' => ['music', 'song', 'beat', 'audio', 'sound', 'track'],
            'comedy' => ['funny', 'laugh', 'joke', 'humor', 'comedy', 'meme'],
            'tech' => ['tech', 'technology', 'software', 'app', 'digital', 'code'],
            'food' => ['food', 'recipe', 'cooking', 'eat', 'chef', 'kitchen'],
            'travel' => ['travel', 'trip', 'vacation', 'explore', 'journey', 'adventure'],
            'fitness' => ['workout', 'fitness', 'exercise', 'health', 'gym', 'training'],
            'beauty' => ['beauty', 'makeup', 'skincare', 'style', 'fashion', 'cosmetic'],
            'diy' => ['diy', 'craft', 'handmade', 'creative', 'build', 'make'],
        ];

        foreach ($keywordCategories as $category => $keywords) {
            foreach ($keywords as $keyword) {
                if (str_contains($text, $keyword) && !in_array($category, $tags)) {
                    $tags[] = $category;
                    break;
                }
            }
        }

        // Add quality and engagement tags based on video properties
        $properties = $analysis['properties'] ?? [];
        if (isset($properties['resolution'])) {
            $resolution = $properties['resolution'];
            if (str_contains($resolution, '1920x1080') || str_contains($resolution, '1080')) {
                $tags[] = 'hd';
            } elseif (str_contains($resolution, '3840x2160') || str_contains($resolution, '4k')) {
                $tags[] = 'uhd';
            }
        }

        // Add trending and engagement tags with current year
        $currentYear = date('Y');
        $engagementTags = ['trending', 'viral', 'popular', $currentYear];
        $tags = array_merge($tags, array_slice($engagementTags, 0, 2));

        // Remove duplicates, empty values, and limit to 8 tags
        $tags = array_filter(array_unique($tags), function($tag) {
            return !empty($tag) && strlen($tag) > 1;
        });

        return array_slice($tags, 0, 8);
    }

    /**
     * Get optimized content suggestions for a video
     */
    public function getOptimizedContentSuggestions(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
            'platforms' => 'nullable|array',
            'platforms.*' => 'string|in:youtube,tiktok,instagram,facebook,x,snapchat,pinterest',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $video = \App\Models\Video::findOrFail($request->video_id);
            
            // Verify the user owns this video
            if ($video->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to video',
                ], 403);
            }

            $platforms = $request->platforms ?? ['youtube', 'tiktok', 'instagram'];

            // Use the content optimization service directly
            $optimizations = $this->aiService->optimizeForPlatforms([
                'title' => $video->title,
                'description' => $video->description,
                'platforms' => $platforms,
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'optimizations' => $optimizations,
                    'video_info' => [
                        'title' => $video->title,
                        'description' => $video->description,
                        'duration' => $video->duration,
                    ],
                ],
                'message' => 'Content optimization suggestions generated successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get optimized content suggestions', [
                'video_id' => $request->video_id ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate content suggestions. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Process video analysis with AIContentOptimizationService
     */
    private function processVideoAnalysisWithOptimizationService(array $analysis, array $videoData): array
    {
        try {
            // Prepare video analysis data for the optimization service
            $videoAnalysisData = [
                'content_type' => $analysis['content_type'] ?? 'general',
                'mood' => $analysis['mood'] ?? 'general',
                'themes' => $analysis['themes'] ?? [],
                'features' => $analysis['features'] ?? [],
                'visual_elements' => $analysis['visual_elements'] ?? [],
                'target_audience' => $analysis['target_audience'] ?? 'general',
                'content_description' => $analysis['content_description'] ?? '',
                'duration' => floatval($videoData['format']['duration'] ?? 0),
                'video_properties' => [
                    'resolution' => $this->getVideoResolution($videoData),
                    'has_audio' => $this->hasAudio($videoData),
                    'file_size' => $videoData['format']['size'] ?? 0,
                ],
            ];

            // Use the optimization service to enhance the generated content
            $optimizedTitles = [];
            $optimizedDescriptions = [];
            $platformTags = [];

            $platforms = ['youtube', 'tiktok', 'instagram', 'facebook', 'x'];
            
            foreach ($platforms as $platform) {
                // Generate platform-specific optimized content using the service
                $optimizedTitles[$platform] = $this->aiService->generateTitleFromVideoAnalysis($videoAnalysisData);
                $optimizedDescriptions[$platform] = $this->aiService->generateDescriptionFromVideoAnalysis($videoAnalysisData);
                
                // Get platform-specific hashtags from analysis or generate new ones
                if (isset($analysis['hashtags'][$platform])) {
                    $platformTags[$platform] = $analysis['hashtags'][$platform];
                } else {
                    $platformTags[$platform] = $this->aiService->generateTrendingHashtags(
                        $platform, 
                        $analysis['content_description'] ?? 'video content', 
                        $platform === 'instagram' ? 20 : 10
                    );
                }
            }

            // Merge with OpenAI generated content (prefer OpenAI if available)
            return [
                'titles' => array_merge($optimizedTitles, $analysis['optimized_titles'] ?? []),
                'descriptions' => array_merge($optimizedDescriptions, $analysis['optimized_descriptions'] ?? []),
                'tags' => [
                    'suggested_tags' => $analysis['tags'] ?? [],
                    'platform_hashtags' => array_merge($platformTags, $analysis['hashtags'] ?? []),
                ],
                'optimization_data' => [
                    'content_type' => $analysis['content_type'] ?? 'general',
                    'mood' => $analysis['mood'] ?? 'general',
                    'target_audience' => $analysis['target_audience'] ?? 'general',
                    'confidence' => 0.88,
                    'processing_method' => 'AI Vision + Content Optimization Service',
                ],
            ];

        } catch (\Exception $e) {
            Log::error('Failed to process video analysis with optimization service: ' . $e->getMessage());
            
            // Return basic optimized content from OpenAI analysis
            return [
                'titles' => $analysis['optimized_titles'],
                'descriptions' => $analysis['optimized_descriptions'],
                'tags' => [
                    'suggested_tags' => $analysis['suggested_tags'] ?? [],
                    'platform_hashtags' => $analysis['hashtags'] ?? [],
                ],
                'optimization_data' => [
                    'content_type' => $analysis['content_type'] ?? 'general',
                    'mood' => 'general',
                    'target_audience' => 'general',
                    'confidence' => 0.5,
                    'processing_method' => 'OpenAI Vision Only',
                ],
            ];
        }
    }

    /**
     * Get video resolution from video data
     */
    private function getVideoResolution(array $videoData): string
    {
        foreach ($videoData['streams'] ?? [] as $stream) {
            if ($stream['codec_type'] === 'video') {
                $width = $stream['width'] ?? 0;
                $height = $stream['height'] ?? 0;
                return "{$width}x{$height}";
            }
        }
        return 'unknown';
    }

    /**
     * Check if video has audio stream
     */
    private function hasAudio(array $videoData): bool
    {
        foreach ($videoData['streams'] ?? [] as $stream) {
            if ($stream['codec_type'] === 'audio') {
                return true;
            }
        }
        return false;
    }

    /**
     * Upload custom thumbnail for video
     */
    public function uploadCustomThumbnail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'video_id' => 'required|integer|exists:videos,id',
            'thumbnail' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120', // 5MB max
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $video = \App\Models\Video::findOrFail($request->video_id);
            
            // Verify the user owns this video
            if ($video->user_id !== Auth::id()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized access to video',
                ], 403);
            }

            $thumbnailFile = $request->file('thumbnail');
            
            // Generate a unique filename for the thumbnail
            $filename = 'video_' . $video->id . '_custom_' . time() . '.' . $thumbnailFile->getClientOriginalExtension();
            
            // Store the thumbnail in the public disk
            $storedPath = $thumbnailFile->storeAs('public/thumbnails', $filename);
            
            if (!$storedPath) {
                throw new \Exception('Failed to store thumbnail file');
            }

            // The stored path is 'public/thumbnails/filename', but for Storage::url() we need 'thumbnails/filename'
            $thumbnailPath = 'thumbnails/' . $filename;

            // Update the video record with the new thumbnail
            $video->update([
                'thumbnail_path' => $thumbnailPath,
                'updated_at' => now(),
            ]);

            // Generate the public URL using the custom thumbnail route
            $filename = basename($thumbnailPath);
            $thumbnailUrl = url('/thumbnails/' . $filename);

            Log::info('Custom thumbnail uploaded successfully', [
                'user_id' => Auth::id(),
                'video_id' => $request->video_id,
                'thumbnail_path' => $thumbnailPath,
                'file_size' => $thumbnailFile->getSize(),
                'file_type' => $thumbnailFile->getMimeType(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Thumbnail uploaded successfully',
                'data' => [
                    'video_id' => $video->id,
                    'thumbnail_path' => $thumbnailPath,
                    'thumbnail_url' => $thumbnailUrl,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to upload custom thumbnail', [
                'video_id' => $request->video_id ?? null,
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload thumbnail. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Create a custom watermark template
     */
    public function createWatermarkTemplate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'properties' => 'required|array',
            'patterns' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $template = $this->watermarkRemoverService->createWatermarkTemplate(
                $request->name,
                $request->properties,
                $request->patterns ?? []
            );

            Log::info('Watermark template created', [
                'user_id' => $request->user()->id ?? null,
                'template_name' => $request->name,
                'template_id' => $template['id'] ?? 'unknown',
            ]);

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Watermark template created successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to create watermark template', [
                'user_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
                'template_name' => $request->name ?? 'unknown',
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create watermark template. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get all watermark templates
     */
    public function getWatermarkTemplates(Request $request): JsonResponse
    {
        try {
            $templates = $this->watermarkRemoverService->getWatermarkTemplates();

            return response()->json([
                'success' => true,
                'data' => $templates,
                'message' => 'Watermark templates retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get watermark templates', [
                'user_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve watermark templates. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Get watermark detection statistics
     */
    public function getWatermarkDetectionStats(Request $request): JsonResponse
    {
        try {
            $stats = $this->watermarkRemoverService->getDetectionStats();

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Watermark detection statistics retrieved successfully',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get watermark detection stats', [
                'user_id' => $request->user()->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve detection statistics. Please try again.',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}