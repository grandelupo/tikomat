# FFmpeg Centralization Implementation

This document outlines the centralization of FFmpeg and FFprobe usage across the application to ensure consistent configuration and proper environment variable support.

## Overview

Previously, FFmpeg and FFprobe were used inconsistently across the application:
- Some services used direct command line execution (`shell_exec`, `exec`)
- Some services created FFMpeg/FFProbe instances with hardcoded paths
- Configuration was duplicated across multiple services
- Environment variables were not consistently used

## Changes Made

### 1. Created Centralized FFmpegService

**File**: `app/Services/FFmpegService.php`

This service provides:
- Standardized configuration using environment variables
- Centralized FFMpeg and FFProbe instance management
- Proper error handling and logging
- Methods to create new instances with consistent configuration

**Key Features**:
- Uses `FFMPEG_PATH` and `FFPROBE_PATH` environment variables
- Falls back to common installation paths
- Configurable timeout and thread settings
- Proper exception handling

### 2. Updated Services

#### VideoProcessingService
- **Before**: Created its own FFMpeg/FFProbe instances with hardcoded configuration
- **After**: Uses FFmpegService dependency injection
- **Changes**: Constructor now accepts FFmpegService, uses centralized instances

#### AIThumbnailOptimizerService
- **Before**: Used `FFMpeg::create()` without configuration
- **After**: Uses FFmpegService to create properly configured instances
- **Changes**: Added FFmpegService dependency, uses `createFFMpeg()` method

#### AIVideoAnalyzerService
- **Before**: Used `FFMpeg::create()` in multiple methods
- **After**: Uses FFmpegService for all FFMpeg operations
- **Changes**: Added FFmpegService dependency, updated all FFMpeg usage

#### AISubtitleGeneratorService
- **Before**: Used direct command line execution (`shell_exec`, `exec`)
- **After**: Uses FFMpeg/FFProbe classes through FFmpegService
- **Changes**: 
  - Replaced `ffprobe` command with FFProbe class
  - Replaced `ffmpeg` commands with FFMpeg class
  - Added proper error handling

#### AIWatermarkRemoverService
- **Before**: Used Symfony Process to execute FFmpeg commands
- **After**: Uses FFMpeg class through FFmpegService
- **Changes**: Replaced command line execution with FFMpeg filters

#### AIController
- **Before**: Used direct command line execution for video analysis
- **After**: Uses FFProbe and FFMpeg classes through FFmpegService
- **Changes**: Replaced `shell_exec` calls with proper class usage

### 3. Updated Console Commands

#### CheckSystemStatus
- **Before**: Used `exec('ffmpeg -version')` to check availability
- **After**: Uses FFmpegService to check availability
- **Changes**: Added FFmpegService dependency, uses `isAvailable()` method

#### CheckFFmpeg
- **Before**: Used Process class to check individual commands
- **After**: Uses FFmpegService for comprehensive checking
- **Changes**: Simplified logic, shows configuration details

## Environment Variables

The following environment variables are now supported:

```env
# Custom FFmpeg binary path (optional)
FFMPEG_PATH=/usr/local/bin/ffmpeg

# Custom FFprobe binary path (optional)
FFPROBE_PATH=/usr/local/bin/ffprobe
```

If not set, the service will try common installation paths:
- `/usr/local/bin/ffmpeg` and `/usr/local/bin/ffprobe`
- `/usr/bin/ffmpeg` and `/usr/bin/ffprobe`
- System PATH fallback

## Benefits

1. **Consistency**: All FFmpeg usage now uses the same configuration
2. **Environment Support**: Proper support for custom FFmpeg installations
3. **Error Handling**: Centralized error handling and logging
4. **Maintainability**: Single place to update FFmpeg configuration
5. **Security**: No more direct command line execution
6. **Performance**: Proper use of FFMpeg/FFProbe classes instead of shell commands

## Migration Guide

If you have custom FFmpeg installations, add to your `.env` file:

```env
FFMPEG_PATH=/path/to/your/ffmpeg
FFPROBE_PATH=/path/to/your/ffprobe
```

## Testing

To verify the changes work correctly:

1. Run the system check command:
   ```bash
   php artisan system:check-ffmpeg
   ```

2. Check system status:
   ```bash
   php artisan system:status
   ```

3. Test video processing functionality to ensure everything works as expected.

## Troubleshooting

If you encounter issues:

1. **FFmpeg not found**: Ensure FFmpeg is installed and the paths are correct
2. **Permission errors**: Check that the FFmpeg binaries are executable
3. **Configuration issues**: Verify environment variables are set correctly

## Future Improvements

- Add support for custom FFmpeg configurations per environment
- Implement FFmpeg version detection and compatibility checking
- Add support for multiple FFmpeg installations
- Consider adding FFmpeg performance monitoring 