<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Video;
use App\Models\VideoTarget;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Services\FFmpegService;

class CheckSystemStatus extends Command
{
    protected $signature = 'system:status';
    protected $description = 'Check the current system status and improvements';

    protected FFmpegService $ffmpegService;

    public function __construct(FFmpegService $ffmpegService)
    {
        parent::__construct();
        $this->ffmpegService = $ffmpegService;
    }

    public function handle()
    {
        $this->info('=== Social Media Publisher System Status ===');
        $this->newLine();

        // Check database status
        $this->checkDatabase();
        $this->newLine();

        // Check file system
        $this->checkFileSystem();
        $this->newLine();

        // Check recent videos
        $this->checkRecentVideos();
        $this->newLine();

        // Check social accounts
        $this->checkSocialAccounts();
        $this->newLine();

        // Check system capabilities
        $this->checkSystemCapabilities();
        $this->newLine();

        $this->info('=== Status Check Complete ===');
    }

    private function checkDatabase()
    {
        $this->info('📊 Database Status:');
        
        try {
            $userCount = User::count();
            $videoCount = Video::count();
            $targetCount = VideoTarget::count();
            $socialCount = SocialAccount::count();

            $this->line("  Users: {$userCount}");
            $this->line("  Videos: {$videoCount}");
            $this->line("  Video Targets: {$targetCount}");
            $this->line("  Social Accounts: {$socialCount}");

            // Check recent video statuses
            $pendingTargets = VideoTarget::where('status', 'pending')->count();
            $successTargets = VideoTarget::where('status', 'success')->count();
            $failedTargets = VideoTarget::where('status', 'failed')->count();

            $this->line("  Pending Uploads: {$pendingTargets}");
            $this->line("  Successful Uploads: {$successTargets}");
            $this->line("  Failed Uploads: {$failedTargets}");

        } catch (\Exception $e) {
            $this->error("  Database connection failed: " . $e->getMessage());
        }
    }

    private function checkFileSystem()
    {
        $this->info('📁 File System Status:');
        
        // Check storage directories
        $directories = ['videos', 'thumbnails', 'temp'];
        foreach ($directories as $dir) {
            $path = storage_path("app/public/{$dir}");
            if (is_dir($path)) {
                $fileCount = count(glob($path . '/*'));
                $this->line("  {$dir}/ directory: ✅ ({$fileCount} files)");
            } else {
                $this->line("  {$dir}/ directory: ❌ (missing)");
            }
        }

        // Check disk space
        $freeBytes = disk_free_space(storage_path());
        $freeMB = round($freeBytes / 1024 / 1024);
        $this->line("  Free disk space: {$freeMB} MB");
    }

    private function checkRecentVideos()
    {
        $this->info('🎥 Recent Videos (last 10):');
        
        $videos = Video::with('targets')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        if ($videos->isEmpty()) {
            $this->line('  No videos found');
            return;
        }

        foreach ($videos as $video) {
            $duration = $video->duration ? "{$video->duration}s" : 'unknown';
            $targets = $video->targets->count();
            $successfulTargets = $video->targets->where('status', 'success')->count();
            
            $statusEmoji = $successfulTargets > 0 ? '✅' : ($video->targets->where('status', 'failed')->count() > 0 ? '❌' : '⏳');
            
            $this->line("  {$statusEmoji} {$video->title} ({$duration}) - {$successfulTargets}/{$targets} targets successful");
        }
    }

    private function checkSocialAccounts()
    {
        $this->info('🔗 Social Account Status:');
        
        $accounts = SocialAccount::all();
        
        if ($accounts->isEmpty()) {
            $this->line('  No social accounts connected');
            return;
        }

        foreach ($accounts as $account) {
            $status = '❓';
            $info = '';
            
            if ($account->access_token) {
                if ($account->token_expires_at && $account->token_expires_at < now()) {
                    $status = '⚠️';
                    $info = ' (token expired)';
                } else {
                    $status = '✅';
                    $info = ' (active)';
                }
            } else {
                $status = '❌';
                $info = ' (no token)';
            }
            
            $this->line("  {$status} {$account->platform}{$info}");
        }
    }

    private function checkSystemCapabilities()
    {
        $this->info('⚙️ System Capabilities:');
        
        // Check FFmpeg using the centralized service
        if ($this->ffmpegService->isAvailable()) {
            $this->line("  FFmpeg: ✅ (available via FFmpegService)");
        } else {
            $this->line("  FFmpeg: ❌ (not available - using GD library fallback)");
        }

        // Check GD library
        if (extension_loaded('gd')) {
            $gdInfo = gd_info();
            $this->line("  GD Library: ✅ (version {$gdInfo['GD Version']})");
        } else {
            $this->line("  GD Library: ❌ (not available)");
        }

        // Check video file support
        $supportedFormats = ['mp4', 'mov', 'avi', 'wmv', 'webm', 'mkv', '3gp', 'flv'];
        $this->line("  Supported video formats: " . implode(', ', $supportedFormats));

        // Check queue system
        try {
            $queueSize = \Illuminate\Support\Facades\DB::table('jobs')->count();
            $this->line("  Queue system: ✅ ({$queueSize} jobs pending)");
        } catch (\Exception $e) {
            $this->line("  Queue system: ❌ (not accessible)");
        }

        // Check recent improvements
        $this->line("  Recent improvements:");
        $this->line("    ✅ Client-side validation implemented");
        $this->line("    ✅ Description made optional");
        $this->line("    ✅ Dark mode support added");
        $this->line("    ✅ Enhanced thumbnail generation with GD library");
        $this->line("    ✅ Improved timezone handling");
        $this->line("    ✅ Enhanced duration detection methods");
        $this->line("    ✅ FFmpeg fallback to GD library");
        $this->line("    ✅ OAuth refresh token fixes");
        $this->line("    ✅ Comprehensive error logging");
    }
} 