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
        \Log::info('Starting thumbnail generation', [
            'video_path' => $videoPath,
            'file_exists' => file_exists($videoPath),
            'file_size' => file_exists($videoPath) ? filesize($videoPath) : 0,
        ]);

        // Create thumbnails directory if it doesn't exist
        $thumbnailsDir = storage_path('app/public/thumbnails');
        if (!file_exists($thumbnailsDir)) {
            mkdir($thumbnailsDir, 0755, true);
            \Log::info('Created thumbnails directory', ['dir' => $thumbnailsDir]);
        }

        // Generate unique filename if not provided
        if (!$outputFileName) {
            $outputFileName = Str::uuid() . '.jpg';
        }

        $thumbnailPath = $thumbnailsDir . '/' . $outputFileName;

        \Log::info('Thumbnail generation settings', [
            'output_file' => $outputFileName,
            'thumbnail_path' => $thumbnailPath,
            'thumbnails_dir_writable' => is_writable($thumbnailsDir),
        ]);

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
            \Log::info('Running FFmpeg command', [
                'command' => $process->getCommandLine(),
                'timeout' => $process->getTimeout(),
            ]);

            $process->mustRun();
            
            \Log::info('FFmpeg command completed successfully', [
                'output' => $process->getOutput(),
                'thumbnail_exists' => file_exists($thumbnailPath),
                'thumbnail_size' => file_exists($thumbnailPath) ? filesize($thumbnailPath) : 0,
            ]);
            
            // Return the public URL path
            return '/storage/thumbnails/' . $outputFileName;
        } catch (ProcessFailedException $exception) {
            // Log the error
            \Log::error('FFmpeg thumbnail generation failed', [
                'error' => $exception->getMessage(),
                'error_output' => $process->getErrorOutput(),
                'command' => $process->getCommandLine(),
            ]);
            
            // Try alternative approach - extract frame at 10% of video duration
            return $this->generateThumbnailAlternative($videoPath, $outputFileName);
        }
    }

    /**
     * Alternative thumbnail generation method.
     */
    private function generateThumbnailAlternative(string $videoPath, string $outputFileName): string
    {
        \Log::info('Starting alternative thumbnail generation');
        
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
            
            \Log::info('Alternative method - video duration retrieved', ['duration' => $duration]);
            
            // Extract thumbnail at 10% of video duration (but at least 1 second)
            $seekTime = max(1, $duration * 0.1);
            $seekTimeFormatted = gmdate('H:i:s', $seekTime);

            \Log::info('Alternative method - generating at seek time', [
                'seek_time' => $seekTime,
                'seek_formatted' => $seekTimeFormatted,
            ]);

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
            
            \Log::info('Alternative FFmpeg completed successfully', [
                'thumbnail_exists' => file_exists($thumbnailPath),
                'thumbnail_size' => file_exists($thumbnailPath) ? filesize($thumbnailPath) : 0,
            ]);
            
            return '/storage/thumbnails/' . $outputFileName;
            
        } catch (ProcessFailedException $exception) {
            \Log::error('Alternative FFmpeg thumbnail generation failed', [
                'error' => $exception->getMessage(),
                'error_output' => $process->getErrorOutput(),
            ]);
            
            // Return default thumbnail path
            return $this->createDefaultThumbnail($outputFileName);
        }
    }

    /**
     * Create a default thumbnail when FFmpeg fails.
     */
    private function createDefaultThumbnail(string $outputFileName): string
    {
        \Log::info('Creating default thumbnail (FFmpeg not available)', ['filename' => $outputFileName]);
        
        // Create a simple colored rectangle as default thumbnail
        $thumbnailPath = storage_path('app/public/thumbnails/' . $outputFileName);
        
        // Create a 320x240 gray image using GD library or return placeholder
        if (function_exists('imagecreate')) {
            \Log::info('Creating thumbnail with GD library');
            
            $image = imagecreate(320, 240);
            $darkGray = imagecolorallocate($image, 64, 64, 64);
            $lightGray = imagecolorallocate($image, 192, 192, 192);
            $white = imagecolorallocate($image, 255, 255, 255);
            
            // Fill background
            imagefill($image, 0, 0, $darkGray);
            
            // Draw border
            imagerectangle($image, 0, 0, 319, 239, $lightGray);
            
            // Add play button symbol (triangle)
            $playButton = [
                130, 100,  // Top point
                130, 140,  // Bottom left
                170, 120   // Right point
            ];
            imagefilledpolygon($image, $playButton, 3, $white);
            
            // Add text
            imagestring($image, 3, 125, 150, 'VIDEO', $white);
            imagestring($image, 2, 110, 170, 'Preview not available', $lightGray);
            
            // Save image
            if (imagejpeg($image, $thumbnailPath, 85)) {
                imagedestroy($image);
                \Log::info('Default thumbnail created successfully', [
                    'path' => $thumbnailPath,
                    'size' => filesize($thumbnailPath),
                ]);
                return '/storage/thumbnails/' . $outputFileName;
            }
            
            imagedestroy($image);
        }
        
        // If GD library is not available, try to copy a placeholder image
        $placeholderPath = public_path('placeholder-video.jpg');
        if (file_exists($placeholderPath)) {
            if (copy($placeholderPath, $thumbnailPath)) {
                \Log::info('Copied placeholder thumbnail');
                return '/storage/thumbnails/' . $outputFileName;
            }
        }
        
        \Log::warning('Could not create default thumbnail - no GD library or placeholder available');
        
        // Return empty string if we can't create a thumbnail
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