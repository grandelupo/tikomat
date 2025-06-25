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
    public function getOAuthConfigStatus(string $platform): array
    {
        $driver = $this->mapPlatformToDriver($platform);
        $config = [
            'driver' => $driver,
            'client_id_configured' => !empty(config("services.{$driver}.client_id")),
            'client_secret_configured' => !empty(config("services.{$driver}.client_secret")),
            'redirect_configured' => !empty(config("services.{$driver}.redirect")),
        ];

        // Add platform-specific configuration checks
        if ($platform === 'instagram') {
            $config['facebook_client_id_configured'] = !empty(config("services.facebook.client_id"));
            $config['facebook_client_secret_configured'] = !empty(config("services.facebook.client_secret"));
            $config['instagram_redirect_url'] = config("services.instagram.redirect");
            $config['facebook_redirect_url'] = config("services.facebook.redirect");
        }

        return $config;
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
            'x' => 'x',
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

        // Platform-specific error handling
        if ($platform === 'instagram') {
            if (str_contains($message, 'Invalid platform app') || str_contains($message, 'Nieprawidłowe żądanie')) {
                return "Instagram app configuration error. This usually means the app is not properly set up in Facebook Developer Console or the redirect URL doesn't match. Please contact support.";
            }
            
            if (str_contains($message, 'invalid_scope') || str_contains($message, 'insufficient permissions')) {
                return "Instagram requires a Professional account (Business or Creator). Make sure your Instagram account is set to Professional mode in the Instagram app. Personal accounts are not supported with the new Instagram API.";
            }
        }

        // Generic fallback
        return "Unable to connect to {$platform}. Please try again or contact support if the issue persists.";
    }

    /**
     * Validate Instagram-specific configuration
     */
    public function validateInstagramConfiguration(): array
    {
        $issues = [];

        // Check Instagram credentials
        if (empty(config('services.instagram.client_id'))) {
            $issues[] = 'Instagram Client ID is not configured';
        }

        if (empty(config('services.instagram.client_secret'))) {
            $issues[] = 'Instagram Client Secret is not configured';
        }

        // Check Facebook credentials (often needed for Instagram)
        if (empty(config('services.facebook.client_id'))) {
            $issues[] = 'Facebook Client ID is not configured (may be required for Instagram)';
        }

        if (empty(config('services.facebook.client_secret'))) {
            $issues[] = 'Facebook Client Secret is not configured (may be required for Instagram)';
        }

        // Check redirect URLs
        $instagramRedirect = config('services.instagram.redirect');
        $facebookRedirect = config('services.facebook.redirect');

        if ($instagramRedirect && $facebookRedirect && $instagramRedirect !== $facebookRedirect) {
            $issues[] = 'Instagram and Facebook redirect URLs should typically match for Instagram Business API';
        }

        return $issues;
    }
} 