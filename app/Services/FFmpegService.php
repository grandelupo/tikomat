<?php

namespace App\Services;

use FFMpeg\FFMpeg;
use FFMpeg\FFProbe;
use Illuminate\Support\Facades\Log;

class FFmpegService
{
    protected ?FFMpeg $ffmpeg = null;
    protected ?FFProbe $ffprobe = null;
    protected array $configuration;

    public function __construct()
    {
        $this->configuration = $this->getConfiguration();
        $this->initializeFFmpeg();
    }

    /**
     * Get standardized FFmpeg configuration
     */
    protected function getConfiguration(): array
    {
        return [
            'ffmpeg.binaries'  => [
                env('FFMPEG_PATH', '/usr/local/bin/ffmpeg'),
                '/usr/local/bin/ffmpeg',
                '/usr/bin/ffmpeg',
                'ffmpeg'
            ],
            'ffprobe.binaries' => [
                env('FFPROBE_PATH', '/usr/local/bin/ffprobe'),
                '/usr/local/bin/ffprobe',
                '/usr/bin/ffprobe',
                'ffprobe'
            ],
            'timeout'          => 3600, // The timeout for the underlying process
            'ffmpeg.threads'   => 12,   // The number of threads that FFMpeg should use
        ];
    }

    /**
     * Initialize FFMpeg and FFProbe instances
     */
    protected function initializeFFmpeg(): void
    {
        try {
            $this->ffmpeg = FFMpeg::create($this->configuration);
            $this->ffprobe = FFProbe::create($this->configuration);
            
            Log::info('FFMpeg initialized successfully', [
                'ffmpeg_path' => env('FFMPEG_PATH', '/usr/local/bin/ffmpeg'),
                'ffprobe_path' => env('FFPROBE_PATH', '/usr/local/bin/ffprobe'),
            ]);
        } catch (\Exception $e) {
            Log::warning('FFMpeg not available: ' . $e->getMessage());
            $this->ffmpeg = null;
            $this->ffprobe = null;
        }
    }

    /**
     * Get FFMpeg instance
     */
    public function getFFMpeg(): ?FFMpeg
    {
        return $this->ffmpeg;
    }

    /**
     * Get FFProbe instance
     */
    public function getFFProbe(): ?FFProbe
    {
        return $this->ffprobe;
    }

    /**
     * Check if FFMpeg is available
     */
    public function isAvailable(): bool
    {
        return $this->ffmpeg !== null && $this->ffprobe !== null;
    }

    /**
     * Get configuration array
     */
    public function getConfig(): array
    {
        return $this->configuration;
    }

    /**
     * Create a new FFMpeg instance with the standard configuration
     */
    public function createFFMpeg(): ?FFMpeg
    {
        try {
            return FFMpeg::create($this->configuration);
        } catch (\Exception $e) {
            Log::warning('Failed to create FFMpeg instance: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Create a new FFProbe instance with the standard configuration
     */
    public function createFFProbe(): ?FFProbe
    {
        try {
            return FFProbe::create($this->configuration);
        } catch (\Exception $e) {
            Log::warning('Failed to create FFProbe instance: ' . $e->getMessage());
            return null;
        }
    }
} 