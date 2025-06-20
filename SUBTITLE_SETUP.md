# AI Subtitle Generator Setup Guide

This guide explains how to set up the real audio analysis and subtitle generation feature that uses OpenAI's Whisper API for accurate speech-to-text transcription.

## Prerequisites

1. **FFmpeg**: Must be installed on your server for audio extraction and video processing
2. **OpenAI API Key**: Required for audio transcription via Whisper API
3. **Queue System**: Recommended for background processing of longer videos

## Installation Steps

### 1. Install FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**CentOS/RHEL:**
```bash
sudo yum install epel-release
sudo yum install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
Download from https://ffmpeg.org/download.html and add to PATH

### 2. Configure OpenAI API

Add your OpenAI API key to your `.env` file:

```env
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_REQUEST_TIMEOUT=120
```

Get your API key from: https://platform.openai.com/api-keys

### 3. Set Up Queue System (Recommended)

For production environments, configure a queue system to handle long-running subtitle generation jobs:

**Option A: Database Queue (Simple)**
```env
QUEUE_CONNECTION=database
```

Then run:
```bash
php artisan queue:table
php artisan migrate
php artisan queue:work
```

**Option B: Redis Queue (Recommended)**
```env
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
```

### 4. Create Required Directories

Make sure these directories exist and are writable:

```bash
mkdir -p storage/app/temp
mkdir -p storage/app/subtitles  
mkdir -p storage/app/videos/processed
chmod 755 storage/app/temp
chmod 755 storage/app/subtitles
chmod 755 storage/app/videos/processed
```

## Features

### Real Audio Analysis
- Extracts audio from video using FFmpeg
- Uses OpenAI Whisper API for accurate speech-to-text
- Supports 12+ languages with confidence scores
- Provides word-level timing for precise synchronization

### Subtitle Formats
- **SRT**: Standard SubRip format
- **VTT**: WebVTT for web players
- **ASS**: Advanced SubStation Alpha with styling

### Video Processing
- Burns subtitles directly into video files
- Multiple styling options (Simple, Modern, Neon, etc.)
- Customizable positioning and fonts
- Original video remains unchanged

### Quality Metrics
- Accuracy scores based on AI confidence
- Timing precision analysis
- Word recognition statistics

## Usage

1. **Generate Subtitles**: Upload a video and click "Generate Subtitles"
2. **Review & Edit**: Check timing and accuracy in the Timing tab
3. **Customize Style**: Choose from preset styles or customize fonts/colors
4. **Apply to Video**: Burn subtitles into the video for permanent embedding
5. **Export**: Download SRT files or the processed video

## API Costs

OpenAI Whisper API pricing (as of 2024):
- **$0.006 per minute** of audio transcribed
- Example: 10-minute video = ~$0.06

## Troubleshooting

### Common Issues

**"FFmpeg not found"**
- Ensure FFmpeg is installed and in your system PATH
- Test with: `ffmpeg -version`

**"OpenAI API error"**
- Verify your API key is correct and has credits
- Check network connectivity to OpenAI

**"Video file not found"**
- Ensure video files are properly uploaded to storage
- Check file permissions and paths

**"Processing timeout"**
- Increase `OPENAI_REQUEST_TIMEOUT` in .env
- Use queue system for longer videos

### Performance Tips

1. **Use Queue Workers**: Process subtitles in background
2. **Optimize Video Size**: Smaller files process faster
3. **Cache Results**: Generated subtitles are cached for reuse
4. **Monitor API Usage**: Track OpenAI API costs

## Security Considerations

- Keep your OpenAI API key secure
- Limit file upload sizes to prevent abuse
- Use proper authentication for subtitle endpoints
- Regularly rotate API keys

## Support

For issues with:
- **FFmpeg**: Check FFmpeg documentation
- **OpenAI API**: Check OpenAI status page
- **Queue System**: Laravel queue documentation 