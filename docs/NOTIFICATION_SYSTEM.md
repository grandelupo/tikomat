# Notification System

This document describes the notification system implemented for failed jobs in the Filmate application.

## Overview

The notification system automatically creates notifications when jobs fail, allowing users to stay informed about processing issues. Notifications are displayed in a dropdown in the application header with a badge showing the unread count.

## Components

### Database Structure

- **notifications table**: Stores all notifications with the following fields:
  - `id` (UUID): Primary key
  - `type`: Notification class name
  - `notifiable_type`: Model class (e.g., User)
  - `notifiable_id`: Model ID
  - `data`: JSON data containing notification details
  - `read_at`: Timestamp when notification was read
  - `created_at`/`updated_at`: Timestamps

### Backend Components

1. **Notification Model** (`app/Models/Notification.php`)
   - Extends Laravel's DatabaseNotification
   - Provides scopes for unread/read notifications
   - Includes methods for marking as read/unread

2. **JobFailedNotification** (`app/Notifications/JobFailedNotification.php`)
   - Specific notification class for job failures
   - Includes job name, error message, and additional data
   - Supports both database and email channels

3. **JobFailedListener** (`app/Listeners/JobFailedListener.php`)
   - Automatically triggered when jobs fail
   - Extracts user information from job data
   - Creates notifications for specific users or admin users
   - Includes comprehensive error logging

4. **NotificationController** (`app/Http/Controllers/NotificationController.php`)
   - Handles API endpoints for notification management
   - Provides CRUD operations for notifications
   - Includes pagination and authorization checks

### Frontend Components

1. **NotificationDropdown** (`resources/js/components/NotificationDropdown.tsx`)
   - React component for displaying notifications
   - Includes unread count badge
   - Supports marking as read, deleting, and bulk operations
   - Auto-refreshes every 30 seconds

2. **Integration in AppHeader**
   - NotificationDropdown is integrated into the main app header
   - Positioned next to the search button and user menu

## API Endpoints

### Authentication Required
All endpoints require authentication via Laravel Sanctum.

- `GET /api/notifications` - Get paginated notifications
- `GET /api/notifications/unread-count` - Get unread notification count
- `PATCH /api/notifications/{id}/mark-as-read` - Mark specific notification as read
- `PATCH /api/notifications/mark-all-as-read` - Mark all notifications as read
- `DELETE /api/notifications/{id}` - Delete specific notification

## Job Integration

### Adding User ID to Jobs

To ensure notifications are sent to the correct user, jobs should include a `userId` property:

```php
class YourJob implements ShouldQueue
{
    public $userId;

    public function __construct(public Video $video)
    {
        $this->userId = $video->user_id;
    }

    public function getUserId(): ?int
    {
        return $this->userId;
    }
}
```

### Automatic Notification Creation

When a job fails, the `JobFailedListener` automatically:

1. Extracts the job name and error details
2. Attempts to find the user ID from the job data
3. Creates a notification for the specific user (if found) or all admin users
4. Logs the failure for debugging

## Testing

### Manual Testing

Use the provided Artisan command to test the notification system:

```bash
php artisan test:job-failure-notification [user_id]
```

### Automated Testing

Run the notification system tests:

```bash
php artisan test --filter=NotificationSystemTest
```

## Configuration

### Event Registration

The `JobFailedListener` is automatically registered in `app/Providers/EventServiceProvider.php`:

```php
protected $listen = [
    JobFailed::class => [
        JobFailedListener::class,
    ],
];
```

### CSRF Protection

API routes are protected with CSRF tokens. The frontend automatically includes the CSRF token in requests.

## Usage Examples

### Creating a Notification Manually

```php
use App\Notifications\JobFailedNotification;

$user->notify(new JobFailedNotification(
    'VideoUploadJob',
    'Failed to upload video to YouTube',
    ['video_id' => 123, 'platform' => 'youtube']
));
```

### Checking Unread Notifications

```php
$unreadCount = $user->unreadNotifications()->count();
$notifications = $user->notifications()->unread()->get();
```

### Marking Notifications as Read

```php
$notification->markAsRead();
// or
$user->unreadNotifications()->update(['read_at' => now()]);
```

## Troubleshooting

### Notifications Not Appearing

1. Check that the `notifications` table exists and has been migrated
2. Verify that the `JobFailedListener` is registered in `EventServiceProvider`
3. Check the application logs for any errors in notification creation
4. Ensure the user has the `Notifiable` trait

### Frontend Issues

1. Check browser console for JavaScript errors
2. Verify CSRF token is being sent with requests
3. Check network tab for failed API requests
4. Ensure the NotificationDropdown component is properly imported

### Performance Considerations

- Notifications are paginated (20 per page) to prevent performance issues
- Unread count is cached and refreshed every 30 seconds
- Old notifications should be cleaned up periodically

## Future Enhancements

- Email notifications for critical failures
- Push notifications for mobile users
- Notification preferences per user
- Bulk notification management
- Notification categories and filtering 