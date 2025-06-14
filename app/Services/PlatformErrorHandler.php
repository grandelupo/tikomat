<?php

namespace App\Services;

use App\Models\VideoTarget;
use Illuminate\Support\Facades\Log;

class PlatformErrorHandler
{
    /**
     * Handle platform-specific errors and return user-friendly messages.
     */
    public function handleError(VideoTarget $target, \Exception $e): string
    {
        $errorMessage = $e->getMessage();
        $platform = $target->platform;

        // Log the original error
        Log::error("Platform upload error", [
            'platform' => $platform,
            'video_id' => $target->video_id,
            'error' => $errorMessage,
            'trace' => $e->getTraceAsString()
        ]);

        // Handle platform-specific errors
        switch ($platform) {
            case 'youtube':
                return $this->handleYouTubeError($errorMessage);
            case 'instagram':
                return $this->handleInstagramError($errorMessage);
            case 'tiktok':
                return $this->handleTikTokError($errorMessage);
            default:
                return "An error occurred while uploading to {$platform}. Please try again later.";
        }
    }

    /**
     * Handle YouTube-specific errors.
     */
    protected function handleYouTubeError(string $errorMessage): string
    {
        // YouTube API error codes and messages
        $errorMap = [
            'quotaExceeded' => 'YouTube upload limit reached. Please try again later.',
            'invalidVideo' => 'The video format is not supported by YouTube.',
            'videoTooLong' => 'The video exceeds YouTube\'s maximum duration limit.',
            'videoTooLarge' => 'The video file is too large for YouTube.',
            'duplicateVideo' => 'This video appears to be a duplicate of an existing video.',
            'invalidMetadata' => 'The video title or description contains invalid content.',
            'accountSuspended' => 'Your YouTube account has been suspended. Please check your account status.',
            'copyright' => 'The video contains copyrighted content that cannot be uploaded.',
            'ageRestriction' => 'The video content requires age verification.',
        ];

        // Check for specific error patterns
        foreach ($errorMap as $key => $message) {
            if (stripos($errorMessage, $key) !== false) {
                return $message;
            }
        }

        // Check for quota exceeded
        if (stripos($errorMessage, 'quota') !== false || stripos($errorMessage, 'limit') !== false) {
            return $errorMap['quotaExceeded'];
        }

        return "An error occurred while uploading to YouTube. Please try again later.";
    }

    /**
     * Handle Instagram-specific errors.
     */
    protected function handleInstagramError(string $errorMessage): string
    {
        $errorMap = [
            'rateLimit' => 'Instagram rate limit reached. Please try again later.',
            'invalidVideo' => 'The video format is not supported by Instagram.',
            'videoTooLong' => 'The video exceeds Instagram\'s maximum duration limit.',
            'videoTooLarge' => 'The video file is too large for Instagram.',
            'invalidMetadata' => 'The video caption contains invalid content.',
            'accountSuspended' => 'Your Instagram account has been suspended. Please check your account status.',
            'copyright' => 'The video contains copyrighted content that cannot be uploaded.',
            'ageRestriction' => 'The video content requires age verification.',
        ];

        foreach ($errorMap as $key => $message) {
            if (stripos($errorMessage, $key) !== false) {
                return $message;
            }
        }

        return "An error occurred while uploading to Instagram. Please try again later.";
    }

    /**
     * Handle TikTok-specific errors.
     */
    protected function handleTikTokError(string $errorMessage): string
    {
        $errorMap = [
            'rateLimit' => 'TikTok rate limit reached. Please try again later.',
            'invalidVideo' => 'The video format is not supported by TikTok.',
            'videoTooLong' => 'The video exceeds TikTok\'s maximum duration limit.',
            'videoTooLarge' => 'The video file is too large for TikTok.',
            'invalidMetadata' => 'The video description contains invalid content.',
            'accountSuspended' => 'Your TikTok account has been suspended. Please check your account status.',
            'copyright' => 'The video contains copyrighted content that cannot be uploaded.',
            'ageRestriction' => 'The video content requires age verification.',
        ];

        foreach ($errorMap as $key => $message) {
            if (stripos($errorMessage, $key) !== false) {
                return $message;
            }
        }

        return "An error occurred while uploading to TikTok. Please try again later.";
    }

    /**
     * Get retry recommendations based on the error.
     */
    public function getRetryRecommendations(string $errorMessage): array
    {
        $recommendations = [];

        if (stripos($errorMessage, 'quota') !== false || stripos($errorMessage, 'limit') !== false) {
            $recommendations[] = 'Wait a few hours before trying again';
            $recommendations[] = 'Consider upgrading your plan for higher upload limits';
        }

        if (stripos($errorMessage, 'format') !== false || stripos($errorMessage, 'invalid') !== false) {
            $recommendations[] = 'Ensure your video is in a supported format (MP4, MOV)';
            $recommendations[] = 'Check that your video meets the platform\'s requirements';
        }

        if (stripos($errorMessage, 'size') !== false || stripos($errorMessage, 'large') !== false) {
            $recommendations[] = 'Try compressing your video to a smaller size';
            $recommendations[] = 'Consider using a lower resolution or bitrate';
        }

        if (stripos($errorMessage, 'copyright') !== false) {
            $recommendations[] = 'Ensure you have rights to use all content in the video';
            $recommendations[] = 'Remove any copyrighted music or content';
        }

        if (stripos($errorMessage, 'account') !== false || stripos($errorMessage, 'suspended') !== false) {
            $recommendations[] = 'Check your platform account status';
            $recommendations[] = 'Verify your account credentials';
        }

        return $recommendations;
    }
} 