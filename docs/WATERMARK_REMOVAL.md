# AI Watermark Removal Service

## Overview
The AI Watermark Removal Service provides advanced watermark detection and removal capabilities for video files using the centralized FFMpegService for all video processing operations.

## Recent Fixes (2025-01-28)

### Encoding Issues Resolution
**Problem**: Users were experiencing "Encoding failed" errors when trying to remove watermarks.

**Root Cause**: The original implementation had several issues:
- Incorrect filter chain application to PHP FFMpeg library
- Audio codec compatibility problems when using 'copy' mode
- Insufficient error handling and no fallback mechanisms
- PHP version compatibility issues with `match` expressions
- Mixed usage of command-line FFmpeg and PHP FFMpeg library

**Solutions Implemented**:

1. **Consistent FFMpegService Usage**: 
   - **All Operations**: Refactored to use centralized FFMpegService exclusively
   - **No Command-Line Execution**: Removed all direct command-line FFmpeg/ffprobe calls
   - **Centralized Configuration**: Uses the same FFmpeg configuration across the application

2. **Dual Processing Strategy**: 
   - **Advanced Method**: Uses PHP FFMpeg library with proper stream handling
   - **Fallback Method**: Also uses FFMpegService with more conservative settings

3. **Smart Audio Codec Handling**:
   - Detects original audio codec before processing
   - Uses audio copy mode only for compatible codecs (AAC, MP3, AC3)
   - Falls back to AAC re-encoding for incompatible audio formats
   - Handles video-only files gracefully

4. **Improved Error Handling**:
   - Multiple validation layers for input files
   - Automatic cleanup of partial output files
   - Comprehensive logging for debugging
   - Graceful degradation with meaningful error messages

5. **Enhanced Filter Application**:
   - Simplified, reliable delogo filters
   - Proper coordinate validation and normalization
   - Method-specific band size optimization
   - Post-processing artifact reduction

## Architecture

### FFMpegService Integration
The service follows the same pattern as `AIVideoAnalyzerService.php`:
- Uses dependency injection for `FFmpegService`
- Calls `$ffmpegService->createFFMpeg()` for video operations
- Calls `$ffmpegService->getFFProbe()` for metadata operations
- Handles FFmpeg unavailability gracefully with fallbacks

### Processing Flow
```php
// 1. Service instantiation with FFMpegService
$service = new AIWatermarkRemoverService($ffmpegService);

// 2. Video analysis using FFProbe
$ffprobe = $this->ffmpegService->getFFProbe();
$streams = $ffprobe->streams($videoPath);

// 3. Frame extraction using FFMpeg
$ffmpeg = $this->ffmpegService->createFFMpeg();
$video = $ffmpeg->open($videoPath);
$frame = $video->frame(TimeCode::fromSeconds($time));

// 4. Watermark removal with filters
$video->filters()->custom($filter);
$video->save($format, $outputPath);
```

## Watermark Detection

### Detection Process
1. **Video Validation**: Uses FFProbe to verify video streams
2. **Frame Extraction**: Uses FFMpeg to extract sample frames
3. **Pattern Analysis**: Analyzes frames for platform-specific watermarks
4. **Confidence Scoring**: Calculates detection confidence based on pattern matching

### Supported Platforms
- **TikTok**: Recognizes TikTok logos and text overlays
- **Sora**: Detects Sora AI watermarks and generation text
- **Custom**: Generic watermark detection for unknown sources

### Detection Methods
- **Template Matching**: Uses platform-specific patterns
- **Edge Detection**: Analyzes pixel density and variations
- **Color Analysis**: Examines color consistency and variance
- **Position Analysis**: Focuses on common watermark locations

## Watermark Removal

### Processing Methods

1. **Inpainting** (Default)
   - Uses AI-style content filling
   - Best for complex watermarks
   - Band size: 15 pixels

2. **Temporal Coherence**
   - Frame-by-frame consistency analysis
   - Best for moving watermarks
   - Band size: 20 pixels

3. **Content-Aware Fill**
   - Intelligent background reconstruction
   - Best for simple text overlays
   - Band size: 12 pixels

4. **Frequency Domain**
   - Spectral analysis and filtering
   - Fastest processing
   - Band size: 8 pixels

### Removal Process

#### Phase 1: Advanced Removal (Primary)
1. **FFMpeg Initialization**: Creates FFMpeg instance via FFMpegService
2. **Stream Analysis**: Uses FFProbe to detect video and audio streams
3. **Filter Application**: Applies watermark-specific delogo filters
4. **Standard Encoding**: Attempts optimal codec settings with audio copy when possible
5. **Conservative Encoding**: Falls back to re-encoding with conservative settings if standard fails

#### Phase 2: Fallback Removal (If Phase 1 fails)
1. **Conservative Fallback**: Uses minimal filters and very conservative encoding
2. **Ultra-Simple Fallback**: Just re-encodes with no filters for maximum compatibility
3. **Last Resort**: Simply copies the original file if all encoding attempts fail

#### Multi-Level Error Recovery

The service now implements a comprehensive 6-level fallback strategy:

1. **Standard Advanced Encoding**
   - Optimal quality settings
   - Audio copy when compatible
   - Full watermark removal filters

2. **Conservative Advanced Encoding**
   - Lower bitrate and conservative settings
   - Always re-encode audio as AAC
   - Full watermark removal filters

3. **Conservative Fallback**
   - Process only the first watermark
   - Ultra-conservative encoding settings
   - Baseline H.264 profile

4. **Ultra-Simple Fallback**
   - No watermark removal filters
   - Just basic re-encoding for compatibility
   - Maximum compatibility settings

5. **Last Resort Copy**
   - Simple file copy operation
   - No processing at all
   - Guarantees some output file

6. **Graceful Failure**
   - Clean error reporting
   - Temporary file cleanup
   - Detailed logging for debugging

## Configuration

### Environment Variables
```env
# FFmpeg paths (used by FFMpegService)
FFMPEG_PATH=/usr/local/bin/ffmpeg
FFPROBE_PATH=/usr/local/bin/ffprobe

# Processing settings
WATERMARK_MAX_CONCURRENT_JOBS=3
WATERMARK_PROCESSING_TIMEOUT=3600
```

### FFMpegService Configuration
The service inherits all configuration from the centralized FFMpegService:
- Automatic path detection and fallbacks
- Consistent timeout and thread settings
- Proper error handling and logging
- Cross-platform compatibility

## API Usage

### Detect Watermarks
```php
$service = app(AIWatermarkRemoverService::class);
$detection = $service->detectWatermarks('/path/to/video.mp4', [
    'sensitivity' => 'high',
    'platforms' => ['tiktok', 'sora']
]);
```

### Remove Watermarks
```php
$watermarks = $detection['detected_watermarks'];
$removal = $service->removeWatermarks('/path/to/video.mp4', $watermarks, [
    'method' => 'inpainting',
    'quality' => 'high'
]);
```

### Track Progress
```php
$progress = $service->getRemovalProgress($removal['removal_id']);
echo "Progress: " . $progress['progress']['percentage'] . "%";
```

## Error Handling

The service implements comprehensive error handling consistent with FFMpegService:

### Common Issues and Solutions

1. **"Encoding failed"**
   - **Cause**: Audio codec incompatibility
   - **Solution**: Service automatically tries AAC re-encoding
   - **Manual Fix**: Use `'audio_codec' => 'aac'` in options

2. **"FFMpeg not available"**
   - **Cause**: FFmpeg not installed or not in PATH
   - **Solution**: Install FFmpeg or set `FFMPEG_PATH` environment variable
   - **Note**: Uses same detection logic as other services

3. **"Video file not found"**
   - **Cause**: Invalid file path or permissions
   - **Solution**: Verify file exists and is readable

4. **"No video stream found"**
   - **Cause**: Corrupted or unsupported video file
   - **Solution**: Re-encode video or use supported format

### Debugging

Enable detailed logging by setting log level to `debug`:

```php
// In config/logging.php
'level' => 'debug'
```

Check logs for detailed watermark removal progress:
```bash
tail -f storage/logs/laravel.log | grep "watermark"
```

## Benefits of FFMpegService Integration

1. **Consistency**: Same FFmpeg configuration across all services
2. **Reliability**: Centralized error handling and path detection
3. **Maintainability**: Single place to update FFmpeg settings
4. **Performance**: Optimized FFmpeg usage patterns
5. **Security**: No direct command-line execution
6. **Compatibility**: Works with custom FFmpeg installations

## Quality Assessment

### Metrics
- **Overall Score**: 0-100 rating of removal quality
- **Artifact Detection**: Level of introduced artifacts
- **Edge Preservation**: How well edges are maintained
- **Color Consistency**: Color uniformity after processing
- **Temporal Stability**: Frame-to-frame consistency

### Optimization Tips

1. **Input Quality**: Higher resolution videos produce better results
2. **Watermark Position**: Corner watermarks are easier to remove
3. **Video Content**: Complex backgrounds may introduce artifacts
4. **Processing Method**: Choose method based on watermark type
5. **Multiple Passes**: Consider multiple processing passes for complex cases

## Performance

### Processing Times (Approximate)
- **Detection**: 30-60 seconds per video
- **Simple Removal**: 2-5 minutes per watermark
- **Complex Removal**: 5-15 minutes per watermark
- **Quality Assessment**: 1-3 minutes

### Resource Usage
- **CPU**: 50-90% during processing
- **Memory**: 512MB - 4GB depending on video size
- **Disk**: 500MB - 2GB temporary space
- **GPU**: Optional, improves processing speed

## Testing

Run the watermark service tests:
```bash
php artisan test tests/Unit/WatermarkServiceTest.php
```

The test suite includes:
- Input validation tests
- Filter generation tests
- Progress tracking tests
- Error handling tests
- Coordinate normalization tests
- FFMpegService integration tests

All tests should pass to ensure the service is working correctly.

## Troubleshooting

### Common Solutions

1. **Check FFMpeg availability**:
   ```bash
   php artisan system:check-ffmpeg
   ```

2. **Increase timeout** for large files:
   ```php
   $options['timeout'] = 7200; // 2 hours
   ```

3. **Force audio re-encoding** if copy fails:
   ```php
   $options['force_audio_reencode'] = true;
   ```

4. **Use fallback method** directly:
   ```php
   $options['force_fallback'] = true;
   ```

5. **Adjust quality settings** for faster processing:
   ```php
   $options['quality'] = 'fast';
   ```

### Handling "Encoding failed" Errors

The service now automatically handles encoding failures with a 6-level fallback strategy. However, if you still encounter issues:

1. **Monitor the logs** to see which level fails:
   ```bash
   tail -f storage/logs/laravel.log | grep -E "(Advanced|Fallback|Conservative|Ultra-simple)"
   ```

2. **Check video file integrity**:
   ```bash
   ffprobe -v error /path/to/your/video.mp4
   ```

3. **Test with a simple video file** first:
   - Use a small MP4 file (< 10MB)
   - Ensure it has standard H.264/AAC codecs
   - No complex audio configurations

4. **If all methods fail**, the service will:
   - Attempt a simple file copy as last resort
   - Log detailed error information
   - Clean up any temporary files
   - Return a meaningful error message

5. **Manual encoding test**:
   ```bash
   ffmpeg -i input.mp4 -c:v libx264 -preset ultrafast -profile:v baseline -c:a aac output.mp4
   ```

### Error Recovery Behavior

When encoding fails, you'll see this progression in the logs:

```
1. "Trying standard advanced encoding" → may fail
2. "Trying conservative advanced encoding" → may fail  
3. "Trying conservative fallback with minimal filters" → may fail
4. "Trying ultra-simple fallback - copy with basic re-encoding only" → may fail
5. "Last resort: copying original file as-is" → should always succeed
6. If even copy fails: "Even file copy failed" → filesystem issue
```

Each level uses increasingly conservative settings to maximize compatibility.

### Support

For additional support or issues:
1. Check the application logs
2. Verify FFmpeg installation using `system:check-ffmpeg`
3. Test with a smaller video file
4. Ensure FFMpegService is properly configured
5. Contact the development team with error details 