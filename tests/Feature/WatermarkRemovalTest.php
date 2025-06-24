<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Services\AIWatermarkRemoverService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;

class WatermarkRemovalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create storage directories
        Storage::makeDirectory('temp');
        Storage::makeDirectory('temp/watermark_detection');
        Storage::makeDirectory('videos');
    }

    public function test_watermark_detection_endpoint_requires_authentication()
    {
        $response = $this->postJson('/ai/watermark-detect', [
            'video_path' => 'test.mp4'
        ]);

        $response->assertStatus(401);
    }

    public function test_watermark_detection_with_invalid_video_path()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/ai/watermark-detect', [
                'video_path' => 'nonexistent.mp4'
            ]);

        $response->assertStatus(404)
                ->assertJson([
                    'success' => false,
                    'message' => 'Video file not found'
                ]);
    }

    public function test_watermark_detection_with_valid_parameters()
    {
        $user = User::factory()->create();

        // Create a test video file (minimal MP4 file would be ideal, but we'll simulate)
        $testVideoPath = storage_path('app/videos/test_video.mp4');
        
        // Create a dummy file for testing (in real scenario, you'd have an actual video)
        file_put_contents($testVideoPath, 'dummy video content');

        $response = $this->actingAs($user)
            ->postJson('/ai/watermark-detect', [
                'video_path' => 'videos/test_video.mp4',
                'sensitivity' => 'medium',
                'detection_mode' => 'balanced'
            ]);

        // Since our dummy file isn't a real video, the service should handle the error gracefully
        $response->assertStatus(500);
        
        // Clean up
        unlink($testVideoPath);
    }

    public function test_watermark_removal_endpoint_validation()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/ai/watermark-remove', [
                // Missing required fields
            ]);

        $response->assertStatus(422)
                ->assertJsonValidationErrors(['video_path', 'watermarks']);
    }

    public function test_watermark_removal_progress_tracking()
    {
        $user = User::factory()->create();
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

        $response = $this->actingAs($user)
            ->postJson('/ai/watermark-progress', [
                'removal_id' => $removalId
            ]);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true,
                    'data' => [
                        'removal_id' => $removalId,
                        'processing_status' => 'processing'
                    ]
                ]);
    }

    public function test_watermark_service_detection_methods()
    {
        $service = new AIWatermarkRemoverService();
        
        // Test with a non-existent file
        $result = $service->detectWatermarks('/nonexistent/path.mp4');
        
        $this->assertArrayHasKey('processing_status', $result);
        $this->assertEquals('failed', $result['processing_status']);
        $this->assertArrayHasKey('error', $result);
    }

    public function test_watermark_service_removal_methods()
    {
        $service = new AIWatermarkRemoverService();
        
        $watermarks = [
            [
                'id' => 'wm_test_1',
                'type' => 'logo',
                'location' => ['x' => 10, 'y' => 10, 'width' => 100, 'height' => 50]
            ]
        ];
        
        // Test with a non-existent file
        $result = $service->removeWatermarks('/nonexistent/path.mp4', $watermarks);
        
        $this->assertArrayHasKey('processing_status', $result);
        $this->assertArrayHasKey('removal_id', $result);
    }

    public function test_watermark_service_progress_retrieval()
    {
        $service = new AIWatermarkRemoverService();
        $removalId = 'test_removal_456';

        // Test getting progress for non-existent removal
        $result = $service->getRemovalProgress($removalId);
        
        $this->assertArrayHasKey('processing_status', $result);
        $this->assertEquals('not_found', $result['processing_status']);
    }

    public function test_watermark_optimization_settings()
    {
        $user = User::factory()->create();

        $watermarks = [
            [
                'id' => 'wm_1',
                'type' => 'logo',
                'confidence' => 85,
                'removal_difficulty' => 'medium'
            ]
        ];

        $response = $this->actingAs($user)
            ->postJson('/ai/watermark-optimize', [
                'watermarks' => $watermarks,
                'video_metadata' => [
                    'duration' => 120,
                    'width' => 1920,
                    'height' => 1080
                ]
            ]);

        $response->assertStatus(200)
                ->assertJson([
                    'success' => true
                ])
                ->assertJsonStructure([
                    'success',
                    'data' => [
                        'optimization_id',
                        'recommended_method',
                        'processing_strategy',
                        'quality_settings'
                    ]
                ]);
    }

    protected function tearDown(): void
    {
        // Clean up any test files
        Storage::deleteDirectory('temp');
        
        parent::tearDown();
    }
} 