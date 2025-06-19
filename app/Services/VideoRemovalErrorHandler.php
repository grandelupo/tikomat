<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class VideoRemovalErrorHandler
{
    /**
     * Handle and categorize video removal errors.
     */
    public function handleError(\Throwable $exception, string $platform, int $targetId): array
    {
        $errorMessage = $exception->getMessage();
        $errorType = $this->categorizeError($exception, $platform);
        
        Log::error('Video removal error categorized', [
            'target_id' => $targetId,
            'platform' => $platform,
            'error_type' => $errorType,
            'original_error' => $errorMessage,
        ]);

        return [
            'type' => $errorType,
            'message' => $this->getUserFriendlyMessage($errorType, $platform),
            'suggestions' => $this->getRecoverySuggestions($errorType, $platform),
            'technical_details' => $errorMessage,
            'severity' => $this->getErrorSeverity($errorType),
        ];
    }

    /**
     * Categorize the error type.
     */
    protected function categorizeError(\Throwable $exception, string $platform): string
    {
        $message = strtolower($exception->getMessage());

        // Authentication errors
        if (str_contains($message, 'authentication failed') || 
            str_contains($message, 'unauthorized') ||
            str_contains($message, 'invalid token') ||
            str_contains($message, 'expired token')) {
            return 'authentication';
        }

        // Permission errors
        if (str_contains($message, 'insufficient permissions') ||
            str_contains($message, 'forbidden') ||
            str_contains($message, 'access denied')) {
            return 'permissions';
        }

        // Video not found errors
        if (str_contains($message, 'not found') ||
            str_contains($message, '404') ||
            str_contains($message, 'does not exist')) {
            return 'not_found';
        }

        // Rate limiting errors
        if (str_contains($message, 'rate limit') ||
            str_contains($message, 'too many requests') ||
            str_contains($message, 'quota exceeded')) {
            return 'rate_limit';
        }

        // Network/connectivity errors
        if (str_contains($message, 'connection') ||
            str_contains($message, 'network') ||
            str_contains($message, 'timeout') ||
            str_contains($message, 'unreachable')) {
            return 'network';
        }

        // Platform-specific errors
        if (str_contains($message, 'api error') ||
            str_contains($message, 'service unavailable') ||
            str_contains($message, 'internal server error')) {
            return 'platform_error';
        }

        // Account connection errors
        if (str_contains($message, 'account not connected') ||
            str_contains($message, 'no access token')) {
            return 'account_not_connected';
        }

        // Default to unknown
        return 'unknown';
    }

    /**
     * Get user-friendly error message.
     */
    protected function getUserFriendlyMessage(string $errorType, string $platform): string
    {
        $platformName = ucfirst($platform);

        return match($errorType) {
            'authentication' => "Your {$platformName} account authentication has expired. Please reconnect your account to remove videos.",
            'permissions' => "Your {$platformName} account doesn't have permission to delete this video. Please check your account settings.",
            'not_found' => "The video was not found on {$platformName}. It may have already been deleted or the link is broken.",
            'rate_limit' => "{$platformName} is temporarily limiting requests. Please try again in a few minutes.",
            'network' => "Unable to connect to {$platformName}. Please check your internet connection and try again.",
            'platform_error' => "{$platformName} is experiencing technical difficulties. Please try again later.",
            'account_not_connected' => "Your {$platformName} account is not connected. Please connect your account first.",
            'unknown' => "An unexpected error occurred while removing the video from {$platformName}.",
            default => "Failed to remove video from {$platformName}.",
        };
    }

    /**
     * Get recovery suggestions for the error.
     */
    protected function getRecoverySuggestions(string $errorType, string $platform): array
    {
        $platformName = ucfirst($platform);

        return match($errorType) {
            'authentication' => [
                "Reconnect your {$platformName} account in the Connections page",
                "Make sure you have the latest permissions enabled",
                "Try logging out and back into {$platformName}",
            ],
            'permissions' => [
                "Check your {$platformName} account permissions",
                "Make sure you own the video you're trying to delete",
                "Reconnect your account with full permissions",
            ],
            'not_found' => [
                "The video may have already been deleted manually",
                "Check if the video still exists on {$platformName}",
                "No further action needed if the video is already gone",
            ],
            'rate_limit' => [
                "Wait 15-30 minutes before trying again",
                "Avoid making multiple deletion requests at once",
                "Try again during off-peak hours",
            ],
            'network' => [
                "Check your internet connection",
                "Try again in a few minutes",
                "Contact support if the problem persists",
            ],
            'platform_error' => [
                "Try again in 10-15 minutes",
                "Check {$platformName}'s status page for outages",
                "Contact support if the issue continues",
            ],
            'account_not_connected' => [
                "Go to the Connections page and connect your {$platformName} account",
                "Make sure to grant all required permissions",
                "Try the deletion again after connecting",
            ],
            'unknown' => [
                "Try the operation again",
                "Check the logs for more details",
                "Contact support if the problem persists",
            ],
            default => [
                "Try again later",
                "Contact support if the issue continues",
            ],
        };
    }

    /**
     * Get error severity level.
     */
    protected function getErrorSeverity(string $errorType): string
    {
        return match($errorType) {
            'not_found' => 'info',           // Video already gone, not really an error
            'rate_limit' => 'warning',       // Temporary, will resolve itself
            'network' => 'warning',          // Usually temporary
            'authentication', 'permissions', 'account_not_connected' => 'error', // User action required
            'platform_error', 'unknown' => 'critical', // May need technical intervention
            default => 'error',
        };
    }

    /**
     * Check if the error is retryable.
     */
    public function isRetryable(string $errorType): bool
    {
        return in_array($errorType, [
            'rate_limit',
            'network',
            'platform_error',
        ]);
    }

    /**
     * Get recommended retry delay in seconds.
     */
    public function getRetryDelay(string $errorType): int
    {
        return match($errorType) {
            'rate_limit' => 1800,      // 30 minutes
            'network' => 300,          // 5 minutes
            'platform_error' => 600,   // 10 minutes
            default => 0,              // Not retryable
        };
    }
} 