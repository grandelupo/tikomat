<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;
use Exception;
use Throwable;

class OAuthErrorHandler
{
    const LOG_CHANNEL = 'oauth';
    
    /**
     * Log OAuth provider errors with structured context
     */
    public function logProviderError(string $platform, Request $request, array $additionalContext = []): void
    {
        $context = [
            'platform' => $platform,
            'error_type' => 'oauth_provider_error',
            'provider_error' => $request->input('error'),
            'provider_error_description' => $request->input('error_description'),
            'provider_error_uri' => $request->input('error_uri'),
            'state' => $request->input('state'),
            'user_id' => auth()->id(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referer' => $request->header('referer'),
            'timestamp' => now()->toISOString(),
            'request_url' => $request->fullUrl(),
            'request_method' => $request->method(),
            'all_request_params' => $request->all(),
        ];

        $context = array_merge($context, $additionalContext);

        Log::channel(self::LOG_CHANNEL)->error(
            "OAuth Provider Error - {$platform}: " . ($request->input('error') ?? 'Unknown error'),
            $context
        );
    }

    /**
     * Log OAuth connection attempt
     */
    public function logConnectionAttempt(string $platform, string $channelSlug, array $additionalContext = []): void
    {
        $context = [
            'platform' => $platform,
            'channel_slug' => $channelSlug,
            'error_type' => 'oauth_connection_attempt',
            'user_id' => auth()->id(),
            'timestamp' => now()->toISOString(),
        ];

        $context = array_merge($context, $additionalContext);

        Log::channel(self::LOG_CHANNEL)->info(
            "OAuth Connection Attempt - {$platform} for channel {$channelSlug}",
            $context
        );
    }

    /**
     * Log OAuth connection success
     */
    public function logConnectionSuccess(string $platform, string $channelSlug, array $additionalContext = []): void
    {
        $context = [
            'platform' => $platform,
            'channel_slug' => $channelSlug,
            'error_type' => 'oauth_connection_success',
            'user_id' => auth()->id(),
            'timestamp' => now()->toISOString(),
        ];

        $context = array_merge($context, $additionalContext);

        Log::channel(self::LOG_CHANNEL)->info(
            "OAuth Connection Success - {$platform} for channel {$channelSlug}",
            $context
        );
    }

    /**
     * Log OAuth connection failure with full context
     */
    public function logConnectionFailure(
        string $platform, 
        string $channelSlug, 
        Throwable $exception, 
        Request $request,
        array $additionalContext = []
    ): void {
        $context = [
            'platform' => $platform,
            'channel_slug' => $channelSlug,
            'error_type' => 'oauth_connection_failure',
            'user_id' => auth()->id(),
            'exception_message' => $exception->getMessage(),
            'exception_class' => get_class($exception),
            'exception_file' => $exception->getFile(),
            'exception_line' => $exception->getLine(),
            'exception_trace' => $exception->getTraceAsString(),
            'provider_error' => $request->input('error'),
            'provider_error_description' => $request->input('error_description'),
            'provider_error_uri' => $request->input('error_uri'),
            'state' => $request->input('state'),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referer' => $request->header('referer'),
            'timestamp' => now()->toISOString(),
            'request_url' => $request->fullUrl(),
            'request_method' => $request->method(),
            'all_request_params' => $request->all(),
        ];

        $context = array_merge($context, $additionalContext);

        Log::channel(self::LOG_CHANNEL)->error(
            "OAuth Connection Failure - {$platform} for channel {$channelSlug}: " . $exception->getMessage(),
            $context
        );
    }

    /**
     * Log OAuth redirect failure
     */
    public function logRedirectFailure(
        string $platform, 
        string $channelSlug, 
        Throwable $exception, 
        Request $request,
        array $additionalContext = []
    ): void {
        $context = [
            'platform' => $platform,
            'channel_slug' => $channelSlug,
            'error_type' => 'oauth_redirect_failure',
            'user_id' => auth()->id(),
            'exception_message' => $exception->getMessage(),
            'exception_class' => get_class($exception),
            'exception_file' => $exception->getFile(),
            'exception_line' => $exception->getLine(),
            'exception_trace' => $exception->getTraceAsString(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'referer' => $request->header('referer'),
            'timestamp' => now()->toISOString(),
            'oauth_config_status' => $this->getOAuthConfigStatus($platform),
        ];

        $context = array_merge($context, $additionalContext);

        Log::channel(self::LOG_CHANNEL)->error(
            "OAuth Redirect Failure - {$platform} for channel {$channelSlug}: " . $exception->getMessage(),
            $context
        );
    }

    /**
     * Log configuration errors
     */
    public function logConfigurationError(string $platform, string $error, array $additionalContext = []): void
    {
        $context = [
            'platform' => $platform,
            'error_type' => 'oauth_configuration_error',
            'user_id' => auth()->id(),
            'configuration_error' => $error,
            'timestamp' => now()->toISOString(),
            'oauth_config_status' => $this->getOAuthConfigStatus($platform),
        ];

        $context = array_merge($context, $additionalContext);

        Log::channel(self::LOG_CHANNEL)->error(
            "OAuth Configuration Error - {$platform}: {$error}",
            $context
        );
    }

    /**
     * Get OAuth configuration status for debugging
     */
    private function getOAuthConfigStatus(string $platform): array
    {
        $driver = $this->mapPlatformToDriver($platform);
        
        return [
            'driver' => $driver,
            'client_id_configured' => !empty(config("services.{$driver}.client_id")),
            'client_secret_configured' => !empty(config("services.{$driver}.client_secret")),
            'redirect_configured' => !empty(config("services.{$driver}.redirect")),
        ];
    }

    /**
     * Map platform name to Socialite driver
     */
    private function mapPlatformToDriver(string $platform): string
    {
        return match ($platform) {
            'youtube' => 'google',
            'instagram' => 'instagram',
            'tiktok' => 'tiktok',
            'facebook' => 'facebook',
            'snapchat' => 'snapchat',
            'pinterest' => 'pinterest',
            'twitter' => 'twitter',
            default => $platform,
        };
    }

    /**
     * Format error message for user display
     */
    public function formatUserErrorMessage(string $platform, Throwable $exception, Request $request = null): string
    {
        // Check for common OAuth provider errors
        if ($request && $request->input('error')) {
            $providerError = $request->input('error');
            $description = $request->input('error_description', '');

            return match ($providerError) {
                'access_denied' => "You cancelled the authorization process for {$platform}. Please try connecting again.",
                'invalid_request' => "There was an issue with the authorization request for {$platform}. Please try again.",
                'unauthorized_client' => "The application is not authorized to access {$platform}. Please contact support.",
                'unsupported_response_type' => "There's a configuration issue with {$platform} integration. Please contact support.",
                'invalid_scope' => "The requested permissions for {$platform} are not valid. Please contact support.",
                'server_error' => "{$platform} is experiencing server issues. Please try again later.",
                'temporarily_unavailable' => "{$platform} is temporarily unavailable. Please try again later.",
                default => "Authentication with {$platform} failed: {$description}"
            };
        }

        // Check for common application errors
        $message = $exception->getMessage();
        
        if (str_contains($message, 'client_id')) {
            return "Configuration error: {$platform} integration is not properly configured. Please contact support.";
        }
        
        if (str_contains($message, 'refresh_token')) {
            return "Unable to maintain long-term access to {$platform}. You may need to reconnect periodically.";
        }
        
        if (str_contains($message, 'expired')) {
            return "The authorization request has expired. Please try connecting to {$platform} again.";
        }
        
        if (str_contains($message, 'mismatch')) {
            return "Security validation failed. Please try connecting to {$platform} again.";
        }

        // Generic fallback
        return "Unable to connect to {$platform}. Please try again or contact support if the issue persists.";
    }
} 