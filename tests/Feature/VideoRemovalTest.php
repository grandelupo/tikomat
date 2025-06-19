<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Video;
use App\Models\VideoTarget;
use App\Models\Channel;
use App\Models\SocialAccount;
use App\Services\VideoUploadService;
use App\Services\VideoRemovalErrorHandler;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Log;

class VideoRemovalTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Channel $channel;
    protected Video $video;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test user and channel
        $this->user = User::factory()->create();
        $this->channel = Channel::factory()->create(['user_id' => $this->user->id]);
        $this->video = Video::factory()->create([
            'user_id' => $this->user->id,
            'channel_id' => $this->channel->id,
        ]);
    }

    public function test_can_delete_video_target_without_platform_video_id()
    {
        // Create a video target without platform video ID (failed upload)
        $target = VideoTarget::factory()->create([
            'video_id' => $this->video->id,
            'platform' => 'youtube',
            'status' => 'failed',
            'platform_video_id' => null,
        ]);

        $response = $this->actingAs($this->user)
            ->delete("/video-targets/{$target->id}");

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('video_targets', ['id' => $target->id]);
    }

    public function test_can_delete_successful_video_target_and_dispatch_removal_job()
    {
        Queue::fake();

        // Create a successful video target
        $target = VideoTarget::factory()->create([
            'video_id' => $this->video->id,
            'platform' => 'youtube',
            'status' => 'success',
            'platform_video_id' => 'test_youtube_id',
        ]);

        // Create social account for the platform
        SocialAccount::factory()->create([
            'user_id' => $this->user->id,
            'channel_id' => $this->channel->id,
            'platform' => 'youtube',
            'access_token' => 'fake_token_for_development',
        ]);

        $response = $this->actingAs($this->user)
            ->delete("/video-targets/{$target->id}");

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertDatabaseMissing('video_targets', ['id' => $target->id]);

        // Verify removal job was dispatched
        Queue::assertPushed(\App\Jobs\RemoveVideoFromYoutube::class);
    }

    public function test_cannot_delete_other_users_video_target()
    {
        $otherUser = User::factory()->create();
        $otherChannel = Channel::factory()->create(['user_id' => $otherUser->id]);
        $otherVideo = Video::factory()->create([
            'user_id' => $otherUser->id,
            'channel_id' => $otherChannel->id,
        ]);

        $target = VideoTarget::factory()->create([
            'video_id' => $otherVideo->id,
            'platform' => 'youtube',
            'status' => 'success',
        ]);

        $response = $this->actingAs($this->user)
            ->delete("/video-targets/{$target->id}");

        $response->assertForbidden();
        $this->assertDatabaseHas('video_targets', ['id' => $target->id]);
    }

    public function test_video_upload_service_dispatches_correct_removal_jobs()
    {
        Queue::fake();

        $uploadService = app(VideoUploadService::class);

        $platforms = ['youtube', 'instagram', 'tiktok', 'facebook', 'twitter', 'snapchat', 'pinterest'];
        $expectedJobs = [
            'youtube' => \App\Jobs\RemoveVideoFromYoutube::class,
            'instagram' => \App\Jobs\RemoveVideoFromInstagram::class,
            'tiktok' => \App\Jobs\RemoveVideoFromTiktok::class,
            'facebook' => \App\Jobs\RemoveVideoFromFacebook::class,
            'twitter' => \App\Jobs\RemoveVideoFromTwitter::class,
            'snapchat' => \App\Jobs\RemoveVideoFromSnapchat::class,
            'pinterest' => \App\Jobs\RemoveVideoFromPinterest::class,
        ];

        foreach ($platforms as $platform) {
            $target = VideoTarget::factory()->create([
                'video_id' => $this->video->id,
                'platform' => $platform,
                'status' => 'success',
                'platform_video_id' => "test_{$platform}_id",
            ]);

            $uploadService->dispatchRemovalJob($target);
            Queue::assertPushed($expectedJobs[$platform]);
        }
    }

    public function test_error_handler_categorizes_errors_correctly()
    {
        $errorHandler = app(VideoRemovalErrorHandler::class);

        $testCases = [
            ['Authentication failed', 'authentication'],
            ['Token expired', 'authentication'],
            ['Insufficient permissions', 'permissions'],
            ['Video not found', 'not_found'],
            ['Rate limit exceeded', 'rate_limit'],
            ['Connection timeout', 'network'],
            ['API error occurred', 'platform_error'],
            ['Account not connected', 'account_not_connected'],
            ['Random error message', 'unknown'],
        ];

        foreach ($testCases as [$message, $expectedType]) {
            $exception = new \Exception($message);
            $result = $errorHandler->handleError($exception, 'youtube', 1);
            
            $this->assertEquals($expectedType, $result['type'], "Failed for message: {$message}");
            $this->assertArrayHasKey('message', $result);
            $this->assertArrayHasKey('suggestions', $result);
            $this->assertArrayHasKey('severity', $result);
        }
    }

    public function test_error_handler_determines_retryability_correctly()
    {
        $errorHandler = app(VideoRemovalErrorHandler::class);

        $retryableTypes = ['rate_limit', 'network', 'platform_error'];
        $nonRetryableTypes = ['authentication', 'permissions', 'not_found', 'account_not_connected', 'unknown'];

        foreach ($retryableTypes as $type) {
            $this->assertTrue($errorHandler->isRetryable($type), "Type {$type} should be retryable");
            $this->assertGreaterThan(0, $errorHandler->getRetryDelay($type), "Type {$type} should have retry delay");
        }

        foreach ($nonRetryableTypes as $type) {
            $this->assertFalse($errorHandler->isRetryable($type), "Type {$type} should not be retryable");
            $this->assertEquals(0, $errorHandler->getRetryDelay($type), "Type {$type} should have no retry delay");
        }
    }

    public function test_handles_removal_job_dispatch_failure_gracefully()
    {
        // Create a target for an unsupported platform
        $target = VideoTarget::factory()->create([
            'video_id' => $this->video->id,
            'platform' => 'unsupported_platform',
            'status' => 'success',
            'platform_video_id' => 'test_id',
        ]);

        $response = $this->actingAs($this->user)
            ->delete("/video-targets/{$target->id}");

        // Should still delete the target from database even if job dispatch fails
        $response->assertRedirect();
        $response->assertSessionHas('warning'); // Should show warning about job dispatch failure
        $this->assertDatabaseMissing('video_targets', ['id' => $target->id]);
    }

    public function test_provides_appropriate_user_feedback_for_different_scenarios()
    {
        // Test 1: Failed video (no platform removal needed)
        $failedTarget = VideoTarget::factory()->create([
            'video_id' => $this->video->id,
            'platform' => 'youtube',
            'status' => 'failed',
            'platform_video_id' => null,
        ]);

        $response = $this->actingAs($this->user)
            ->delete("/video-targets/{$failedTarget->id}");

        $response->assertSessionHas('success');
        $this->assertStringContainsString('not successfully published', session('success'));

        // Test 2: Successful video without platform video ID
        $successWithoutIdTarget = VideoTarget::factory()->create([
            'video_id' => $this->video->id,
            'platform' => 'instagram',
            'status' => 'success',
            'platform_video_id' => null,
        ]);

        $response = $this->actingAs($this->user)
            ->delete("/video-targets/{$successWithoutIdTarget->id}");

        $response->assertSessionHas('success');
        $this->assertStringContainsString('No platform video ID found', session('success'));
    }
} 