<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use App\Services\FFmpegService;

class CheckFFmpeg extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'system:check-ffmpeg';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check if FFmpeg and FFprobe are available on the system';

    protected FFmpegService $ffmpegService;

    public function __construct(FFmpegService $ffmpegService)
    {
        parent::__construct();
        $this->ffmpegService = $ffmpegService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔍 Checking FFmpeg availability...');
        
        // Check FFmpeg using the centralized service
        $this->info('');
        $this->info('Checking FFmpeg:');
        $ffmpegAvailable = $this->ffmpegService->isAvailable();
        
        if ($ffmpegAvailable) {
            $this->info('✅ FFmpeg is available via FFmpegService');
            $config = $this->ffmpegService->getConfig();
            $this->line('   - FFmpeg path: ' . ($config['ffmpeg.binaries'][0] ?? 'default'));
            $this->line('   - FFProbe path: ' . ($config['ffprobe.binaries'][0] ?? 'default'));
            $this->line('   - Timeout: ' . $config['timeout'] . ' seconds');
            $this->line('   - Threads: ' . $config['ffmpeg.threads']);
        } else {
            $this->error('❌ FFmpeg is not available');
        }
        
        // Check GD Library
        $this->info('');
        $this->info('Checking GD Library (for fallback thumbnails):');
        $gdAvailable = function_exists('imagecreate');
        
        if ($gdAvailable) {
            $this->info('✅ GD Library is available');
            $gdInfo = gd_info();
            $this->line('   - Version: ' . ($gdInfo['GD Version'] ?? 'Unknown'));
            $this->line('   - JPEG Support: ' . ($gdInfo['JPEG Support'] ? 'Yes' : 'No'));
            $this->line('   - PNG Support: ' . ($gdInfo['PNG Support'] ? 'Yes' : 'No'));
        } else {
            $this->error('❌ GD Library is not available');
        }
        
        // Summary
        $this->info('');
        $this->info('📋 Summary:');
        
        if ($ffmpegAvailable) {
            $this->info('✅ FFmpeg is fully available - video processing will work normally');
        } elseif ($gdAvailable) {
            $this->warn('⚠️  FFmpeg not available but GD Library is present');
            $this->warn('   Videos will use fallback processing (estimated duration, placeholder thumbnails)');
        } else {
            $this->error('❌ Neither FFmpeg nor GD Library available');
            $this->error('   Video processing will have limited functionality');
        }
        
        // Installation suggestions
        if (!$ffmpegAvailable) {
            $this->info('');
            $this->info('💡 To install FFmpeg:');
            $this->line('   Ubuntu/Debian: sudo apt update && sudo apt install ffmpeg -y');
            $this->line('   CentOS/RHEL:   sudo yum install epel-release -y && sudo yum install ffmpeg -y');
            $this->line('   macOS:         brew install ffmpeg');
            $this->info('');
            $this->info('💡 Environment Variables:');
            $this->line('   Set FFMPEG_PATH and FFPROBE_PATH in your .env file if FFmpeg is installed in a custom location');
        }
        
        return self::SUCCESS;
    }
} 