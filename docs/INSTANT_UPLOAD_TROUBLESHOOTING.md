# Instant Upload Troubleshooting Guide

## Problem: Videos Appear Unprocessed After AI Job Completes

### Symptoms
- Video shows title "Processing..." indefinitely
- No AI-generated metadata appears
- Upload seems stuck in processing state

### Potential Causes & Solutions

## 1. Queue System Not Running

**Symptoms:**
- Jobs are dispatched but never executed
- No processing logs in Laravel log files
- Videos remain in "Processing..." state indefinitely

**Solution:**
```bash
# Check if queue workers are running
php artisan queue:work

# For production, ensure queue workers are running as daemon processes
# Check supervisor or similar process manager configuration
```

**Verification:**
```bash
# Check pending jobs
php artisan queue:failed
php artisan queue:monitor
```

## 2. AI Services Failing

**Symptoms:**
- Error logs show AI service failures
- Processing starts but fails during analysis

**Debugging:**
```bash
# Check Laravel logs
tail -f storage/logs/laravel.log

# Process specific video manually for debugging
php artisan videos:process-instant-uploads --video-id=123

# Dry run to see what would be processed
php artisan videos:process-instant-uploads --dry-run
```

**Solution:**
The improved job now includes fallback mechanisms:
- If video analysis fails, uses fallback content
- If watermark detection fails, skips watermark removal
- If subtitle generation fails, continues without subtitles
- Always creates video targets for publishing

## 3. File Path Issues

**Symptoms:**
- "Video file not found" errors in logs
- Processing fails immediately

**Check:**
```bash
# Verify video file exists
ls -la storage/app/videos/

# Check permissions
chmod -R 755 storage/app/videos/
chown -R www-data:www-data storage/app/videos/
```

## 4. Memory or Time Limits

**Symptoms:**
- Processing starts but times out
- Memory exhaustion errors
- Large video files fail

**Solution:**
```php
// In config/queue.php, increase timeout
'timeout' => 900, // 15 minutes

// In php.ini
memory_limit = 512M
max_execution_time = 900
```

## 5. Database Issues

**Symptoms:**
- Video record not updating
- Targets not being created

**Check:**
```sql
-- Check video status
SELECT id, title, description, created_at FROM videos WHERE title = 'Processing...';

-- Check video targets
SELECT vt.*, v.title FROM video_targets vt 
JOIN videos v ON v.id = vt.video_id 
WHERE v.title = 'Processing...';
```

## Debugging Steps

### Step 1: Check for Pending Videos
```bash
php artisan videos:process-instant-uploads --dry-run
```

### Step 2: Process Videos Manually
```bash
# Process all pending videos
php artisan videos:process-instant-uploads

# Process specific video
php artisan videos:process-instant-uploads --video-id=123
```

### Step 3: Check Logs
```bash
# Watch logs in real-time
tail -f storage/logs/laravel.log | grep "instant upload"

# Check for specific errors
grep -n "ERROR" storage/logs/laravel.log | grep "instant"
```

### Step 4: Verify Services
```bash
# Test AI services independently
php artisan tinker

# In tinker:
$service = app(\App\Services\AIVideoAnalyzerService::class);
$result = $service->analyzeVideo('/path/to/video.mp4');
var_dump($result);
```

## Common Error Messages & Solutions

### "Video file not found for AI processing"
**Cause:** File path issue or permissions
**Solution:** 
- Check file exists in storage/app/videos/
- Verify file permissions
- Ensure storage symlink is created: `php artisan storage:link`

### "Video analysis failed, using fallback"
**Cause:** AI analysis service failed
**Solution:** 
- Check AI service configuration
- Verify external API connections
- Review AI service logs
- Fallback content will still be generated

### "No platforms available for instant upload"
**Cause:** No connected social media platforms
**Solution:**
- Connect at least one platform in channel settings
- Verify OAuth tokens are valid
- Check user subscription allows selected platforms

### "Watermark detection failed"
**Cause:** Watermark service error
**Solution:**
- Check watermark service configuration
- Verify required dependencies (OpenCV, FFmpeg)
- Processing will continue without watermark removal

### "Subtitle generation failed"  
**Cause:** Subtitle service error
**Solution:**
- Check audio processing dependencies
- Verify OpenAI API keys
- Processing will continue without subtitles

## Performance Optimization

### For Large Videos
```php
// Increase processing limits in ProcessInstantUploadWithAI
ini_set('memory_limit', '1G');
ini_set('max_execution_time', 1800); // 30 minutes
```

### For High Volume
```bash
# Run multiple queue workers
php artisan queue:work --queue=default --tries=3 &
php artisan queue:work --queue=default --tries=3 &
php artisan queue:work --queue=default --tries=3 &
```

## Monitoring & Health Checks

### Queue Health
```bash
# Monitor queue status
php artisan queue:monitor default:5,high:10

# Check failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all
```

### Processing Success Rate
```sql
-- Check processing success rate
SELECT 
    COUNT(*) as total_uploads,
    SUM(CASE WHEN title != 'Processing...' THEN 1 ELSE 0 END) as processed,
    ROUND(SUM(CASE WHEN title != 'Processing...' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate
FROM videos 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

### Log Analysis
```bash
# Processing time analysis
grep "Instant upload AI processing completed" storage/logs/laravel.log | tail -20

# Error frequency
grep "Instant upload AI processing failed" storage/logs/laravel.log | wc -l
```

## Prevention

### 1. Monitoring Setup
- Set up log monitoring for processing failures
- Monitor queue depth and processing times
- Alert on high failure rates

### 2. Resource Management
- Ensure adequate server resources
- Monitor disk space for video storage
- Set appropriate queue timeouts

### 3. Graceful Degradation
- The system now includes comprehensive fallback mechanisms
- Videos will always get published even if AI processing fails
- Users receive meaningful content even in failure scenarios

### 4. Regular Maintenance
```bash
# Clean up old failed jobs
php artisan queue:prune-failed --hours=48

# Monitor storage usage
du -sh storage/app/videos/

# Check for stuck processes
ps aux | grep "queue:work"
```

## Quick Recovery

If videos are stuck in processing:

1. **Immediate:** Process manually
   ```bash
   php artisan videos:process-instant-uploads
   ```

2. **Reset stuck videos** (use with caution):
   ```sql
   UPDATE videos 
   SET title = 'Recovered Video', 
       description = 'This video was recovered from processing.'
   WHERE title = 'Processing...' 
   AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR);
   ```

3. **Restart queue workers:**
   ```bash
   php artisan queue:restart
   ```

This troubleshooting guide should help identify and resolve issues with the instant upload feature. 