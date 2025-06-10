<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;

class ThumbnailService
{
    /**
     * Generate thumbnail from video file.
     */
    public function generateThumbnail(string $videoPath, ?string $outputFileName = null): string
    {
        // Create thumbnails directory if it doesn't exist
        $thumbnailsDir = storage_path('app/public/thumbnails');
        if (!file_exists($thumbnailsDir)) {
            mkdir($thumbnailsDir, 0755, true);
        }

        // Generate unique filename if not provided
        if (!$outputFileName) {
            $outputFileName = Str::uuid() . '.jpg';
        }

        $thumbnailPath = $thumbnailsDir . '/' . $outputFileName;

        // Use FFmpeg to extract thumbnail at 2 seconds (to avoid black frames)
        $process = new Process([
            'ffmpeg',
            '-i', $videoPath,
            '-ss', '00:00:02',              // Seek to 2 seconds
            '-vframes', '1',                // Extract only 1 frame
            '-q:v', '2',                    // High quality
            '-vf', 'scale=320:240',         // Resize to thumbnail size
            '-y',                           // Overwrite output files
            $thumbnailPath
        ]);

        try {
            $process->mustRun();
            
            // Return the public URL path
            return '/storage/thumbnails/' . $outputFileName;
        } catch (ProcessFailedException $exception) {
            // Log the error
            \Log::error('FFmpeg thumbnail generation failed: ' . $exception->getMessage());
            
            // Try alternative approach - extract frame at 10% of video duration
            return $this->generateThumbnailAlternative($videoPath, $outputFileName);
        }
    }

    /**
     * Alternative thumbnail generation method.
     */
    private function generateThumbnailAlternative(string $videoPath, string $outputFileName): string
    {
        $thumbnailPath = storage_path('app/public/thumbnails/' . $outputFileName);

        // Get video duration first
        $durationProcess = new Process([
            'ffprobe',
            '-i', $videoPath,
            '-show_entries', 'format=duration',
            '-v', 'quiet',
            '-of', 'csv=p=0'
        ]);

        try {
            $durationProcess->mustRun();
            $duration = (float) trim($durationProcess->getOutput());
            
            // Extract thumbnail at 10% of video duration (but at least 1 second)
            $seekTime = max(1, $duration * 0.1);
            $seekTimeFormatted = gmdate('H:i:s', $seekTime);

            $process = new Process([
                'ffmpeg',
                '-i', $videoPath,
                '-ss', $seekTimeFormatted,
                '-vframes', '1',
                '-q:v', '2',
                '-vf', 'scale=320:240',
                '-y',
                $thumbnailPath
            ]);

            $process->mustRun();
            return '/storage/thumbnails/' . $outputFileName;
            
        } catch (ProcessFailedException $exception) {
            \Log::error('Alternative FFmpeg thumbnail generation failed: ' . $exception->getMessage());
            
            // Return default thumbnail path
            return $this->createDefaultThumbnail($outputFileName);
        }
    }

    /**
     * Create a default thumbnail when FFmpeg fails.
     */
    private function createDefaultThumbnail(string $outputFileName): string
    {
        // Create a simple colored rectangle as default thumbnail
        $thumbnailPath = storage_path('app/public/thumbnails/' . $outputFileName);
        
        // Create a 320x240 gray image using ImageMagick or return placeholder
        if (function_exists('imagecreate')) {
            $image = imagecreate(320, 240);
            $gray = imagecolorallocate($image, 128, 128, 128);
            $white = imagecolorallocate($image, 255, 255, 255);
            
            imagefill($image, 0, 0, $gray);
            imagestring($image, 5, 110, 115, 'VIDEO', $white);
            
            imagejpeg($image, $thumbnailPath, 80);
            imagedestroy($image);
            
            return '/storage/thumbnails/' . $outputFileName;
        }
        
        // Return null if we can't create a thumbnail
        return '';
    }

    /**
     * Get video information using FFprobe.
     */
    public function getVideoInfo(string $videoPath): array
    {
        $process = new Process([
            'ffprobe',
            '-i', $videoPath,
            '-show_entries', 'format=duration:stream=width,height,duration',
            '-v', 'quiet',
            '-of', 'json'
        ]);

        try {
            $process->mustRun();
            $output = json_decode($process->getOutput(), true);
            
            $format = $output['format'] ?? [];
            $streams = $output['streams'] ?? [];
            
            // Find video stream
            $videoStream = collect($streams)->first(function ($stream) {
                return isset($stream['codec_type']) && $stream['codec_type'] === 'video';
            });
            
            return [
                'duration' => (float) ($format['duration'] ?? 0),
                'width' => (int) ($videoStream['width'] ?? 0),
                'height' => (int) ($videoStream['height'] ?? 0),
                'has_video' => !empty($videoStream),
                'format' => pathinfo($videoPath, PATHINFO_EXTENSION),
            ];
            
        } catch (ProcessFailedException $exception) {
            \Log::error('FFprobe failed to get video info: ' . $exception->getMessage());
            
            return [
                'duration' => 0,
                'width' => 0,
                'height' => 0,
                'has_video' => false,
                'format' => pathinfo($videoPath, PATHINFO_EXTENSION),
            ];
        }
    }

    /**
     * Clean up old thumbnails.
     */
    public function cleanupOldThumbnails(int $daysOld = 30): int
    {
        $thumbnailsDir = storage_path('app/public/thumbnails');
        $deleted = 0;
        
        if (!is_dir($thumbnailsDir)) {
            return $deleted;
        }
        
        $cutoffTime = time() - ($daysOld * 24 * 60 * 60);
        
        foreach (glob($thumbnailsDir . '/*.jpg') as $file) {
            if (filemtime($file) < $cutoffTime) {
                if (unlink($file)) {
                    $deleted++;
                }
            }
        }
        
        return $deleted;
    }
} 