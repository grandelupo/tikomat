<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\JobFailedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class NotificationSystemTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_receive_job_failure_notification()
    {
        $user = User::factory()->create();

        $notification = new JobFailedNotification(
            'TestJob',
            'Test error message',
            ['test_data' => true]
        );

        $user->notify($notification);

        $this->assertDatabaseHas('notifications', [
            'notifiable_type' => User::class,
            'notifiable_id' => $user->id,
            'type' => JobFailedNotification::class,
        ]);

        $notificationData = $user->notifications()->first()->data;
        $this->assertEquals('TestJob', $notificationData['job_name']);
        $this->assertEquals('Test error message', $notificationData['error_message']);
        $this->assertEquals('job_failed', $notificationData['type']);
    }

    public function test_notification_api_endpoints_work()
    {
        $user = User::factory()->create();
        
        // Create a test notification
        $user->notify(new JobFailedNotification(
            'TestJob',
            'Test error message'
        ));

        $this->actingAs($user);

        // Test getting notifications
        $response = $this->getJson('/api/notifications');
        $response->assertStatus(200);
        $response->assertJsonStructure([
            'notifications' => [
                '*' => [
                    'id',
                    'type',
                    'data',
                    'read_at',
                    'created_at',
                ]
            ],
            'pagination'
        ]);

        // Test getting unread count
        $response = $this->getJson('/api/notifications/unread-count');
        $response->assertStatus(200);
        $response->assertJson(['count' => 1]);

        // Test marking as read
        $notification = $user->notifications()->first();
        $response = $this->patchJson("/api/notifications/{$notification->id}/mark-as-read");
        $response->assertStatus(200);

        // Verify notification is marked as read
        $this->assertNotNull($notification->fresh()->read_at);

        // Test unread count is now 0
        $response = $this->getJson('/api/notifications/unread-count');
        $response->assertStatus(200);
        $response->assertJson(['count' => 0]);
    }

    public function test_mark_all_as_read_endpoint()
    {
        $user = User::factory()->create();
        
        // Create multiple test notifications
        for ($i = 0; $i < 3; $i++) {
            $user->notify(new JobFailedNotification(
                "TestJob{$i}",
                "Test error message {$i}"
            ));
        }

        $this->actingAs($user);

        // Verify we have 3 unread notifications
        $response = $this->getJson('/api/notifications/unread-count');
        $response->assertStatus(200);
        $response->assertJson(['count' => 3]);

        // Mark all as read
        $response = $this->patchJson('/api/notifications/mark-all-as-read');
        $response->assertStatus(200);

        // Verify all notifications are marked as read
        $this->assertEquals(0, $user->unreadNotifications()->count());
    }

    public function test_delete_notification_endpoint()
    {
        $user = User::factory()->create();
        
        $user->notify(new JobFailedNotification(
            'TestJob',
            'Test error message'
        ));

        $this->actingAs($user);

        $notification = $user->notifications()->first();
        
        // Delete the notification
        $response = $this->deleteJson("/api/notifications/{$notification->id}");
        $response->assertStatus(200);

        // Verify notification is deleted
        $this->assertDatabaseMissing('notifications', [
            'id' => $notification->id,
        ]);
    }

    public function test_unauthorized_access_is_prevented()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        
        // Create notification for user1
        $user1->notify(new JobFailedNotification(
            'TestJob',
            'Test error message'
        ));

        $notification = $user1->notifications()->first();

        // Try to access user1's notification as user2
        $this->actingAs($user2);

        $response = $this->patchJson("/api/notifications/{$notification->id}/mark-as-read");
        $response->assertStatus(403);

        $response = $this->deleteJson("/api/notifications/{$notification->id}");
        $response->assertStatus(403);
    }
} 