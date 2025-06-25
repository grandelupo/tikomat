# Workflow Automation Setup Guide

## How Workflows Work

Tikomat's workflow system automatically detects new videos on source platforms and syncs them to target platforms. Here's how it works:

### 1. Workflow Components

- **Workflows**: Define automation rules (e.g., "YouTube → Instagram + TikTok")
- **Source Platform**: Where new videos are detected (e.g., YouTube)
- **Target Platforms**: Where videos are automatically published (e.g., Instagram, TikTok)
- **Video Detection**: Periodically checks source platforms for new content
- **Video Targets**: Created automatically for each target platform
- **Upload Jobs**: Process video targets to publish content

### 2. Workflow Process Flow

```
1. User creates workflow: "YouTube → Instagram + TikTok"
2. Scheduler runs every 5 minutes
3. System checks YouTube for new videos since last run
4. For each new video found:
   - Creates Video record in database
   - Creates VideoTarget for Instagram (status: pending)
   - Creates VideoTarget for TikTok (status: pending)
5. Upload processor runs every minute
6. Processes pending VideoTargets
7. Dispatches upload jobs to queue
8. Jobs upload videos to target platforms
```

### 3. Database Structure

```sql
workflows:
- id, user_id, channel_id
- name, description
- source_platform (youtube, instagram, etc.)
- target_platforms (JSON array)
- is_active, last_run_at, videos_processed

videos:
- id, user_id, channel_id
- title, description, duration
- original_file_path (null for workflow-detected videos)

video_targets:
- id, video_id, platform
- status (pending, processing, success, failed)
- platform_video_id, platform_url
- publish_at, published_at
```

## Laravel Scheduler Setup

### 1. Commands Available

```bash
# Process workflows (detect new videos and create targets)
php artisan workflows:process

# Process pending video uploads
php artisan videos:process-uploads

# Run with dry-run mode (testing)
php artisan workflows:process --dry-run
php artisan videos:process-uploads --dry-run
```

### 2. Scheduler Configuration

The scheduler is configured in `app/Console/Kernel.php`:

```php
// Process workflows every 5 minutes
$schedule->command('workflows:process')
         ->everyFiveMinutes()
         ->withoutOverlapping()
         ->runInBackground();

// Process video uploads every minute  
$schedule->command('videos:process-uploads')
         ->everyMinute()
         ->withoutOverlapping()
         ->runInBackground();
```

### 3. Setting Up Cron Job

#### On Linux/macOS:

1. Open crontab:
```bash
crontab -e
```

2. Add this line:
```bash
* * * * * cd /path/to/your/project && php artisan schedule:run >> /dev/null 2>&1
```

3. Replace `/path/to/your/project` with your actual project path.

#### On Windows:

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily, repeat every 1 minute
4. Set action: Start a program
5. Program: `php`
6. Arguments: `artisan schedule:run`
7. Start in: Your project directory

### 4. Verifying Scheduler

Check if scheduler is running:

```bash
# Check Laravel logs
tail -f storage/logs/laravel.log

# Test scheduler manually
php artisan schedule:run

# List scheduled commands
php artisan schedule:list
```

### 5. Queue Configuration

Workflows use Laravel queues for processing uploads. Configure your queue:

#### Database Queue (Default):
```bash
# Run queue worker
php artisan queue:work

# Or use supervisor for production
```

#### Redis Queue (Recommended for Production):
```env
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

## Development Mode

For development/testing, the system uses fake tokens and simulates video detection:

```php
// In SocialAccount model, fake tokens trigger simulation
'access_token' => 'fake_token_for_development'
```

This allows testing workflows without real API connections.

## Monitoring Workflows

### 1. Workflow Status

Check workflow activity in the admin panel:
- Last run time
- Videos processed count
- Success/failure rates

### 2. Logs

Monitor these log entries:
```bash
# Workflow processing
grep "Processing workflow" storage/logs/laravel.log

# Video detection
grep "Detecting new videos" storage/logs/laravel.log

# Upload jobs
grep "upload job" storage/logs/laravel.log
```

### 3. Database Queries

```sql
-- Check active workflows
SELECT * FROM workflows WHERE is_active = 1;

-- Check recent workflow activity
SELECT * FROM workflows WHERE last_run_at > NOW() - INTERVAL 1 HOUR;

-- Check pending video targets
SELECT * FROM video_targets WHERE status = 'pending';

-- Check workflow success rates
SELECT 
    w.name,
    w.videos_processed,
    COUNT(vt.id) as total_targets,
    SUM(CASE WHEN vt.status = 'success' THEN 1 ELSE 0 END) as successful
FROM workflows w
LEFT JOIN videos v ON v.channel_id = w.channel_id
LEFT JOIN video_targets vt ON vt.video_id = v.id
WHERE w.is_active = 1
GROUP BY w.id;
```

## Troubleshooting

### 1. Workflows Not Running

- Check cron job is set up correctly
- Verify `php artisan schedule:run` works manually
- Check Laravel logs for errors
- Ensure database connection is working

### 2. No Videos Detected

- Verify social accounts are connected
- Check API tokens are not expired
- Review platform-specific API limits
- Check `last_run_at` timestamp in workflows table

### 3. Upload Jobs Failing

- Check queue worker is running
- Verify platform API credentials
- Review upload job logs
- Check video file accessibility

### 4. Performance Issues

- Monitor queue length: `php artisan queue:monitor`
- Check database indexes on workflows table
- Consider using Redis for queues
- Implement job batching for large workflows

## API Rate Limits

Each platform has different rate limits:

- **YouTube**: 10,000 units/day (uploads cost ~1600 units each)
- **Instagram**: 200 calls/hour per user
- **TikTok**: 1000 requests/day per app
- **Facebook**: 200 calls/hour per user
- **X (Twitter)**: 300 requests/15 minutes

The system handles rate limiting by:
- Spacing out API calls
- Implementing exponential backoff
- Queuing uploads during off-peak hours
- Monitoring API usage

## Security Considerations

1. **Token Storage**: Access tokens are encrypted in database
2. **API Credentials**: Store in environment variables
3. **File Access**: Uploaded videos are stored securely
4. **User Permissions**: Workflows only access user's own content
5. **Rate Limiting**: Prevents API abuse

## Production Deployment

1. Set up proper queue workers with Supervisor
2. Configure Redis for queues and caching
3. Set up log rotation
4. Monitor disk space for video storage
5. Implement health checks for scheduler
6. Set up alerts for failed workflows
7. Regular backup of workflows and video metadata

## Example Workflow Creation

```php
// Create a workflow via API or admin panel
$workflow = Workflow::create([
    'user_id' => $user->id,
    'channel_id' => $channel->id,
    'name' => 'YouTube to Social Media',
    'description' => 'Auto-sync YouTube videos to Instagram and TikTok',
    'source_platform' => 'youtube',
    'target_platforms' => ['instagram', 'tiktok'],
    'is_active' => true,
]);
```

This workflow will:
1. Check YouTube every 5 minutes for new videos
2. Create video records for new content
3. Generate upload targets for Instagram and TikTok
4. Process uploads automatically via queue jobs 