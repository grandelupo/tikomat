<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

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

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔍 Checking FFmpeg availability...');
        
        // Check FFmpeg
        $this->info('');
        $this->info('Checking FFmpeg:');
        $ffmpegAvailable = $this->checkCommand('ffmpeg', ['-version']);
        
        // Check FFprobe
        $this->info('');
        $this->info('Checking FFprobe:');
        $ffprobeAvailable = $this->checkCommand('ffprobe', ['-version']);
        
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
        
        if ($ffmpegAvailable && $ffprobeAvailable) {
            $this->info('✅ FFmpeg is fully available - video processing will work normally');
        } elseif ($gdAvailable) {
            $this->warn('⚠️  FFmpeg not available but GD Library is present');
            $this->warn('   Videos will use fallback processing (estimated duration, placeholder thumbnails)');
        } else {
            $this->error('❌ Neither FFmpeg nor GD Library available');
            $this->error('   Video processing will have limited functionality');
        }
        
        // Installation suggestions
        if (!$ffmpegAvailable || !$ffprobeAvailable) {
            $this->info('');
            $this->info('💡 To install FFmpeg:');
            $this->line('   Ubuntu/Debian: sudo apt update && sudo apt install ffmpeg -y');
            $this->line('   CentOS/RHEL:   sudo yum install epel-release -y && sudo yum install ffmpeg -y');
            $this->line('   macOS:         brew install ffmpeg');
        }
        
        return self::SUCCESS;
    }
    
    /**
     * Check if a command is available.
     */
    private function checkCommand(string $command, array $args = []): bool
    {
        $process = new Process(array_merge([$command], $args));
        $process->setTimeout(10);
        
        try {
            $process->mustRun();
            $output = $process->getOutput();
            
            $this->info("✅ {$command} is available");
            
            // Extract version info
            if (preg_match('/version\s+([^\s]+)/', $output, $matches)) {
                $this->line("   Version: {$matches[1]}");
            }
            
            return true;
            
        } catch (ProcessFailedException $exception) {
            $this->error("❌ {$command} is not available");
            $this->line("   Error: " . $exception->getMessage());
            return false;
        }
    }
} 