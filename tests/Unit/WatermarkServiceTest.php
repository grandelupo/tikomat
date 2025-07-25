<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\AIWatermarkRemoverService;
use App\Services\FFmpegService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Mockery;

class WatermarkServiceTest extends TestCase
{
    protected AIWatermarkRemoverService $service;
    protected FFmpegService $ffmpegService;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Mock FFmpegService
        $this->ffmpegService = Mockery::mock(FFmpegService::class);
        $this->service = new AIWatermarkRemoverService($this->ffmpegService);
        
        // Create storage directories
        Storage::makeDirectory('temp');
        Storage::makeDirectory('temp/watermark_detection');
    }

    public function test_watermark_detection_with_invalid_path()
    {
        $result = $this->service->detectWatermarks('/nonexistent/path.mp4');
        
        $this->assertArrayHasKey('processing_status', $result);
        $this->assertEquals('failed', $result['processing_status']);
        $this->assertArrayHasKey('error', $result);
        $this->assertStringContainsString('Video file not found', $result['error']);
    }

    public function test_watermark_removal_with_invalid_path()
    {
        $watermarks = [
            [
                'id' => 'wm_test_1',
                'type' => 'logo',
                'location' => ['x' => 10, 'y' => 10, 'width' => 100, 'height' => 50]
            ]
        ];
        
        $result = $this->service->removeWatermarks('/nonexistent/path.mp4', $watermarks);
        
        $this->assertArrayHasKey('processing_status', $result);
        $this->assertArrayHasKey('removal_id', $result);
        
        // Check if it's either failed immediately or processing
        $this->assertContains($result['processing_status'], ['failed', 'processing']);
    }

    public function test_watermark_removal_with_valid_input()
    {
        $watermarks = [
            [
                'id' => 'wm_test_1',
                'type' => 'logo',
                'platform' => 'tiktok',
                'confidence' => 85,
                'location' => ['x' => 10, 'y' => 10, 'width' => 100, 'height' => 50],
                'removal_difficulty' => 'medium'
            ]
        ];
        
        $options = ['method' => 'inpainting'];
        
        $result = $this->service->removeWatermarks('test_video.mp4', $watermarks, $options);
        
        $this->assertArrayHasKey('processing_status', $result);
        $this->assertArrayHasKey('removal_id', $result);
        $this->assertArrayHasKey('selected_method', $result);
        $this->assertEquals('inpainting', $result['selected_method']);
        $this->assertArrayHasKey('watermarks_to_remove', $result);
        $this->assertCount(1, $result['watermarks_to_remove']);
    }

    public function test_create_simple_removal_filter()
    {
        $watermark = [
            'location' => ['x' => 100, 'y' => 50, 'width' => 200, 'height' => 100],
            'platform' => 'tiktok',
            'confidence' => 90
        ];
        
        // Use reflection to test private method
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('createSimpleRemovalFilter');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->service, $watermark, 'inpainting');
        
        $this->assertNotNull($result);
        $this->assertStringContainsString('delogo=x=100:y=50:w=200:h=100:band=15:show=0', $result);
    }

    public function test_create_simple_removal_filter_with_different_methods()
    {
        $watermark = [
            'location' => ['x' => 50, 'y' => 25, 'width' => 150, 'height' => 75],
            'platform' => 'sora',
            'confidence' => 95
        ];
        
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('createSimpleRemovalFilter');
        $method->setAccessible(true);
        
        // Test different methods produce different band sizes
        $inpaintingResult = $method->invoke($this->service, $watermark, 'inpainting');
        $this->assertStringContainsString('band=15', $inpaintingResult);
        
        $temporalResult = $method->invoke($this->service, $watermark, 'temporal_coherence');
        $this->assertStringContainsString('band=20', $temporalResult);
        
        $contentAwareResult = $method->invoke($this->service, $watermark, 'content_aware');
        $this->assertStringContainsString('band=12', $contentAwareResult);
        
        $frequencyResult = $method->invoke($this->service, $watermark, 'frequency_domain');
        $this->assertStringContainsString('band=8', $frequencyResult);
    }

    public function test_progress_retrieval_for_nonexistent_removal()
    {
        $removalId = 'nonexistent_removal_id';
        $result = $this->service->getRemovalProgress($removalId);
        
        $this->assertArrayHasKey('processing_status', $result);
        $this->assertEquals('not_found', $result['processing_status']);
        $this->assertArrayHasKey('error', $result);
    }

    public function test_progress_tracking_with_cached_data()
    {
        $removalId = 'test_removal_123';
        
        // Mock progress data in cache
        Cache::put("watermark_removal_{$removalId}", [
            'removal_id' => $removalId,
            'processing_status' => 'processing',
            'progress' => [
                'current_step' => 'processing',
                'percentage' => 50
            ]
        ], 3600);

        $result = $this->service->getRemovalProgress($removalId);
        
        $this->assertArrayHasKey('processing_status', $result);
        $this->assertEquals('processing', $result['processing_status']);
        $this->assertEquals($removalId, $result['removal_id']);
        $this->assertEquals(50, $result['progress']['percentage']);
    }

    public function test_optimize_removal_settings()
    {
        $watermarks = [
            [
                'id' => 'wm_1',
                'type' => 'logo',
                'confidence' => 85,
                'removal_difficulty' => 'medium'
            ],
            [
                'id' => 'wm_2',
                'type' => 'text',
                'confidence' => 92,
                'removal_difficulty' => 'easy'
            ]
        ];

        $videoMetadata = [
            'duration' => 120,
            'width' => 1920,
            'height' => 1080
        ];

        $result = $this->service->optimizeRemovalSettings($watermarks, $videoMetadata);
        
        $this->assertArrayHasKey('optimization_id', $result);
        $this->assertArrayHasKey('recommended_method', $result);
        $this->assertArrayHasKey('processing_strategy', $result);
        $this->assertArrayHasKey('quality_settings', $result);
        $this->assertArrayHasKey('estimated_metrics', $result);
        
        // Check that the recommended method is one of the valid options
        $validMethods = ['inpainting', 'content_aware', 'temporal_coherence', 'frequency_domain'];
        $this->assertContains($result['recommended_method'], $validMethods);
    }

    public function test_analyze_removal_quality()
    {
        $originalPath = '/path/to/original.mp4';
        $processedPath = '/path/to/processed.mp4';
        
        $result = $this->service->analyzeRemovalQuality($originalPath, $processedPath);
        
        $this->assertArrayHasKey('analysis_id', $result);
        $this->assertArrayHasKey('quality_metrics', $result);
        $this->assertArrayHasKey('comparison_analysis', $result);
        $this->assertArrayHasKey('watermark_removal_effectiveness', $result);
        
        // Check quality metrics structure
        $this->assertArrayHasKey('overall_score', $result['quality_metrics']);
        $this->assertArrayHasKey('visual_quality', $result['quality_metrics']);
        $this->assertArrayHasKey('artifact_detection', $result['quality_metrics']);
    }

    public function test_generate_removal_report()
    {
        $removalId = 'test_removal_456';
        
        // Mock some removal data in cache
        Cache::put("watermark_removal_{$removalId}", [
            'removal_id' => $removalId,
            'processing_status' => 'completed',
            'watermarks_to_remove' => [
                ['id' => 'wm_1', 'type' => 'logo'],
                ['id' => 'wm_2', 'type' => 'text']
            ],
            'removal_results' => [
                ['watermark_id' => 'wm_1', 'removal_success' => true],
                ['watermark_id' => 'wm_2', 'removal_success' => true]
            ]
        ], 3600);
        
        $result = $this->service->generateRemovalReport($removalId);
        
        $this->assertArrayHasKey('report_id', $result);
        $this->assertArrayHasKey('removal_id', $result);
        $this->assertArrayHasKey('processing_summary', $result);
        $this->assertArrayHasKey('method_performance', $result);
        $this->assertArrayHasKey('technical_details', $result);
    }

    public function test_update_removal_progress()
    {
        $removalId = 'test_update_progress';
        
        // Initially cache some data
        Cache::put("watermark_removal_{$removalId}", [
            'removal_id' => $removalId,
            'processing_status' => 'processing',
            'progress' => ['percentage' => 0]
        ], 3600);
        
        // Update progress
        $this->service->updateRemovalProgress($removalId, 'processing', 75, [
            'current_frame' => 750,
            'total_frames' => 1000
        ]);
        
        // Retrieve and verify
        $result = $this->service->getRemovalProgress($removalId);
        
        $this->assertEquals('processing', $result['processing_status']);
        $this->assertEquals(75, $result['progress']['percentage']);
        $this->assertEquals(750, $result['current_frame']);
        $this->assertEquals(1000, $result['total_frames']);
    }

    public function test_watermark_filter_handles_invalid_coordinates()
    {
        $watermark = [
            'location' => ['x' => -10, 'y' => -5, 'width' => 0, 'height' => -10],
            'platform' => 'unknown'
        ];
        
        $reflection = new \ReflectionClass($this->service);
        $method = $reflection->getMethod('createSimpleRemovalFilter');
        $method->setAccessible(true);
        
        $result = $method->invoke($this->service, $watermark, 'inpainting');
        
        // Should normalize negative coordinates and zero dimensions
        $this->assertStringContainsString('delogo=x=0:y=0:w=1:h=1', $result);
    }

    protected function tearDown(): void
    {
        // Clean up cache
        Cache::flush();
        
        // Clean up any test directories
        Storage::deleteDirectory('temp');
        
        parent::tearDown();
    }
} 