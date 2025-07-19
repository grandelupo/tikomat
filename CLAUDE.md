# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Social Media Video Publisher** - A Laravel + React SaaS platform for AI-powered video optimization and multi-platform publishing to YouTube, Instagram, TikTok, Facebook, Snapchat, Pinterest, and X/Twitter.

## Tech Stack

- **Backend**: Laravel 12 (PHP 8.2+)
- **Frontend**: React 19 + TypeScript + Inertia.js
- **Database**: SQLite (dev) / MySQL (prod)
- **Queue**: Laravel Queues with Redis
- **AI**: OpenAI GPT-4 integration
- **Video Processing**: FFmpeg
- **Authentication**: Laravel Sanctum + Socialite
- **Payments**: Laravel Cashier (Stripe)
- **Styling**: Tailwind CSS + Radix UI (Shadcn)

## Development Commands

### Setup & Installation
```bash
# Install dependencies
composer install
npm install

# Environment setup
cp .env.example .env
php artisan key:generate

# Database setup
php artisan migrate
php artisan db:seed --class=CreateDefaultChannelsSeeder

# Install FFmpeg (macOS)
brew install ffmpeg
```

### Development Workflow
```bash
# Start all services (Laravel, Vite, Queue, Logs)
composer dev

# Or run individually:
php artisan serve          # Laravel server (port 8000)
npm run dev               # Vite dev server (port 5173)
php artisan queue:work    # Queue worker
php artisan pail          # Real-time logs

# Code quality
npm run lint             # ESLint
npm run types            # TypeScript check
npm run format           # Prettier format
composer test            # PHPUnit/Pest tests
```

### Production Build
```bash
composer install --optimize-autoloader --no-dev
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Project Structure

### Backend (Laravel)
```
app/
├── Console/Commands/     # Artisan commands (video processing, cleanup)
├── Http/Controllers/     # RESTful controllers
├── Jobs/                # Queue jobs for video processing
├── Models/              # Eloquent models
├── Services/            # Business logic services
├── Policies/            # Authorization policies
└── Providers/           # Service providers
```

**Key Models:**
- `User` - Multi-tenant users with subscriptions
- `Channel` - Workspace/organization unit
- `Video` - Video metadata and processing state
- `VideoTarget` - Platform-specific publishing targets
- `SocialAccount` - OAuth tokens for platform connections
- `Workflow` - Automation workflows

**Key Services:**
- `VideoUploadService` - Orchestrates multi-platform publishing
- `AISubtitleGeneratorService` - AI-powered subtitle generation
- `AIContentOptimizationService` - Platform-specific content optimization
- `FFmpegService` - Video processing utilities

### Frontend (React + Inertia)
```
resources/js/
├── pages/               # Inertia.js page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Videos/         # Video management
│   ├── AI/             # AI tools
│   └── Workflow/       # Automation
├── components/          # Reusable React components
│   ├── ui/             # Shadcn UI components
│   └── AI*.tsx         # AI-powered components
├── hooks/              # Custom React hooks
└── layouts/            # Page layouts
```

## Key Workflows

### Video Upload & Publishing
1. User uploads video via React frontend
2. Video stored in `storage/app/private/videos/`
3. Queue job `ProcessVideoUploads` processes video
4. Platform-specific jobs created for each target
5. Real-time status updates via polling

### AI Processing Pipeline
1. `ProcessSubtitleGeneration` - AI subtitle creation
2. `AIThumbnailOptimizerService` - Thumbnail generation
3. `AIContentOptimizationService` - Platform-specific optimization
4. `RenderVideoWithSubtitlesJob` - Final video rendering

### OAuth Flow
1. User connects social accounts via Socialite
2. Tokens encrypted and stored in `social_accounts`
3. Platform-specific API calls for publishing
4. Token refresh handled automatically

## Environment Configuration

### Required OAuth Keys (.env)
```env
# YouTube/Google
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Instagram/Facebook
INSTAGRAM_CLIENT_ID=xxx
INSTAGRAM_CLIENT_SECRET=xxx

# TikTok
TIKTOK_CLIENT_ID=xxx
TIKTOK_CLIENT_SECRET=xxx

# OpenAI
OPENAI_API_KEY=xxx

# FFmpeg
FFMPEG_PATH=/usr/local/bin/ffmpeg
FFPROBE_PATH=/usr/local/bin/ffprobe
```

### Database
- **Dev**: SQLite file at `database/database.sqlite`
- **Test**: In-memory SQLite (`:memory:`)
- **Prod**: MySQL/PostgreSQL recommended

## Testing

```bash
# Run all tests
composer test

# Run specific test suites
./vendor/bin/pest tests/Feature
./vendor/bin/pest tests/Unit

# Run with coverage
./vendor/bin/pest --coverage
```

## Queues & Background Processing

**Queue Connection**: Database (dev) / Redis (prod)
**Key Jobs**:
- `ProcessVideoUploads` - Main video processing
- `UploadVideoTo*` - Platform-specific uploads
- `ProcessSubtitleGeneration` - AI subtitle creation
- `RenderVideoWithSubtitlesJob` - Final rendering

## Common Development Tasks

### Adding New Platform
1. Add platform enum values in database migrations
2. Create platform-specific job classes
3. Add OAuth configuration in config/services.php
4. Update VideoTarget model validation
5. Add platform UI components

### Adding New AI Feature
1. Create service in `app/Services/AI*Service.php`
2. Add corresponding React component in `resources/js/components/`
3. Create queue job for processing
4. Add database columns if needed

### Database Changes
```bash
php artisan make:migration add_new_field_to_videos
php artisan migrate
```

### Adding New Routes
```php
// In routes/web.php
Route::middleware(['auth'])->group(function () {
    Route::get('/new-feature', [NewFeatureController::class, 'index']);
});
```

## File Storage Structure

**Video Storage**:
- Original uploads: `storage/app/private/videos/`
- Processed videos: `storage/app/private/videos/rendered/`
- Thumbnails: `storage/app/private/thumbnails/`
- Subtitles: `storage/app/subtitles/`
- Watermark cutouts: `public/watermark-cutouts/`

## Debugging & Troubleshooting

### Common Issues
1. **FFmpeg not found**: Check `FFMPEG_PATH` in .env
2. **Queue not processing**: Ensure `php artisan queue:work` is running
3. **OAuth failures**: Check redirect URLs in platform settings
4. **Video processing stuck**: Check `storage/logs/laravel.log`

### Debug Tools
- Laravel logs: `storage/logs/laravel.log`
- Queue monitoring: `php artisan queue:monitor`
- Real-time logs: `php artisan pail`
- OAuth logs: `storage/logs/oauth-*.log`

## Deployment Notes

- Ensure FFmpeg is installed on production server
- Configure queue workers with Supervisor
- Set up scheduled tasks for cleanup: `php artisan schedule:run`
- Configure cloud storage for production file serving
- Set up proper SSL certificates for OAuth callbacks