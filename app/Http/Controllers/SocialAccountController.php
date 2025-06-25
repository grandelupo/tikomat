<?php

namespace App\Http\Controllers;

use App\Models\SocialAccount;
use App\Models\Channel;
use App\Services\OAuthErrorHandler;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class SocialAccountController extends Controller
{
    protected OAuthErrorHandler $errorHandler;

    public function __construct(OAuthErrorHandler $errorHandler)
    {
        $this->errorHandler = $errorHandler;
    }

    /**
     * Redirect to social media provider for authentication.
     */
    public function redirect(Channel $channel, string $platform, Request $request): RedirectResponse
    {
        try {
            // Ensure user owns this channel
            if ($channel->user_id !== $request->user()->id) {
                abort(403);
            }

            if (!in_array($platform, ['youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'pinterest', 'x'])) {
                $this->errorHandler->logConfigurationError($platform, 'Invalid platform selected');
                return $this->redirectToErrorPage($platform, $channel->slug, 'Invalid platform selected.');
            }

            // Check if user can access this platform
            if (!$request->user()->canAccessPlatform($platform)) {
                $this->errorHandler->logConfigurationError($platform, 'Platform not available with current plan', [
                    'user_plan' => $request->user()->subscription?->stripe_price ?? 'free',
                    'channel_slug' => $channel->slug,
                ]);
                return $this->redirectToErrorPage(
                    $platform, 
                    $channel->slug, 
                    'This platform is not available with your current plan.',
                    'subscription_limitation'
                );
            }

            // Check if OAuth credentials are configured
            if (!$this->isOAuthConfigured($platform)) {
                $configError = 'OAuth credentials not configured';
                
                // Special handling for Instagram
                if ($platform === 'instagram') {
                    $instagramIssues = $this->errorHandler->validateInstagramConfiguration();
                    if (!empty($instagramIssues)) {
                        $configError = 'Instagram configuration issues: ' . implode(', ', $instagramIssues);
                    }
                }
                
                $this->errorHandler->logConfigurationError($platform, $configError);
                return $this->redirectToErrorPage(
                    $platform, 
                    $channel->slug, 
                    'OAuth credentials for ' . ucfirst($platform) . ' are not configured properly. Please contact support.',
                    'configuration_error'
                );
            }

            // Log connection attempt
            $this->errorHandler->logConnectionAttempt($platform, $channel->slug, [
                'force_reconnect' => $request->boolean('force'),
                'user_agent' => $request->userAgent(),
            ]);

            // Check if this is a force reconnect (revoke existing permissions)
            $forceReconnect = $request->boolean('force');
            
            if ($forceReconnect && $platform === 'youtube') {
                $this->revokeGooglePermissions($request->user()->id, $channel->id);
            }

            // Map platform to Socialite driver
            $driver = $this->mapPlatformToDriver($platform);

            // Create state parameter with channel information
            $state = base64_encode(json_encode([
                'channel_slug' => $channel->slug,
                'user_id' => $request->user()->id,
                'platform' => $platform,
                'timestamp' => time(),
                'force' => $forceReconnect
            ]));

            // Request appropriate scopes based on platform
            return $this->buildOAuthRedirect($driver, $platform, $state);

        } catch (\Exception $e) {
            $this->errorHandler->logRedirectFailure($platform, $channel->slug, $e, $request);
            
            return $this->redirectToErrorPage(
                $platform, 
                $channel->slug, 
                $this->errorHandler->formatUserErrorMessage($platform, $e, $request),
                'redirect_failure'
            );
        }
    }

    /**
     * Handle callback from social media provider.
     */
    public function callback(Channel $channel, string $platform, Request $request): RedirectResponse
    {
        try {
            // Ensure user owns this channel
            if ($channel->user_id !== $request->user()->id) {
                abort(403);
            }

            if (!in_array($platform, ['youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'pinterest', 'x'])) {
                $this->errorHandler->logConfigurationError($platform, 'Invalid platform selected in callback');
                return $this->redirectToErrorPage($platform, $channel->slug, 'Invalid platform selected.');
            }

            // Check for OAuth provider errors first
            if ($request->input('error')) {
                $this->errorHandler->logProviderError($platform, $request, [
                    'channel_slug' => $channel->slug,
                ]);
                
                return $this->redirectToErrorPage(
                    $platform, 
                    $channel->slug, 
                    $this->errorHandler->formatUserErrorMessage($platform, new \Exception($request->input('error_description', $request->input('error'))), $request),
                    $request->input('error')
                );
            }

            $driver = $this->mapPlatformToDriver($platform);
            
            // Get OAuth user data
            $socialUser = Socialite::driver($driver)->user();

            // Validate we have the required tokens
            if (empty($socialUser->token)) {
                throw new \Exception('No access token received from ' . ucfirst($platform));
            }

            // For Google/YouTube, we need a refresh token for long-term access
            if ($platform === 'youtube' && empty($socialUser->refreshToken)) {
                $this->errorHandler->logConnectionFailure(
                    $platform, 
                    $channel->slug, 
                    new \Exception('No refresh token received'), 
                    $request,
                    ['warning' => 'refresh_token_missing']
                );
                
                // This is a warning, not a failure - continue with the connection
            }

            // Store or update social account
            // First, delete any existing social account for this user+platform combination
            // to avoid conflicts with the old unique constraint
            SocialAccount::where('user_id', Auth::id())
                ->where('platform', $platform)
                ->delete();
            
            // Now create the new social account
            $socialAccount = SocialAccount::create([
                'user_id' => Auth::id(),
                'channel_id' => $channel->id,
                'platform' => $platform,
                'access_token' => $socialUser->token,
                'refresh_token' => $socialUser->refreshToken,
                'token_expires_at' => $socialUser->expiresIn ? 
                    now()->addSeconds($socialUser->expiresIn) : null,
            ]);

            $this->errorHandler->logConnectionSuccess($platform, $channel->slug, [
                'social_account_id' => $socialAccount->id,
                'has_refresh_token' => !empty($socialAccount->refresh_token),
                'expires_at' => $socialAccount->token_expires_at?->toISOString() ?? 'never',
            ]);

            return redirect()->route('channels.show', $channel->slug)
                ->with('success', ucfirst($platform) . ' account connected successfully!');

        } catch (\Exception $e) {
            $this->errorHandler->logConnectionFailure($platform, $channel->slug, $e, $request);
            
            return $this->redirectToErrorPage(
                $platform, 
                $channel->slug, 
                $this->errorHandler->formatUserErrorMessage($platform, $e, $request),
                'callback_failure'
            );
        }
    }

    /**
     * Disconnect a social media account.
     */
    public function disconnect(Channel $channel, string $platform, Request $request): RedirectResponse
    {
        // Ensure user owns this channel
        if ($channel->user_id !== $request->user()->id) {
            abort(403);
        }

        if (!in_array($platform, ['youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'pinterest', 'x'])) {
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'Invalid platform selected.');
        }

        SocialAccount::where('user_id', Auth::id())
            ->where('channel_id', $channel->id)
            ->where('platform', $platform)
            ->delete();

        return redirect()->route('channels.show', $channel->slug)
            ->with('success', ucfirst($platform) . ' account disconnected successfully!');
    }

    /**
     * Simulate connection for development (when OAuth is not configured).
     */
    public function simulateConnection(Channel $channel, string $platform, Request $request): RedirectResponse
    {
        // Ensure user owns this channel
        if ($channel->user_id !== $request->user()->id) {
            abort(403);
        }

        if (!in_array($platform, ['youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'pinterest', 'x'])) {
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'Invalid platform selected.');
        }

        // Check if user can access this platform
        if (!$request->user()->canAccessPlatform($platform)) {
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'This platform is not available with your current plan.');
        }

        // Only allow in development environment
        if (!app()->environment('local')) {
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'This feature is only available in development mode.');
        }

        // Create a fake social account for testing
        // First, delete any existing social account for this user+platform combination
        // to avoid conflicts with the old unique constraint
        SocialAccount::where('user_id', Auth::id())
            ->where('platform', $platform)
            ->delete();
        
        // Now create the new social account
        SocialAccount::create([
            'user_id' => Auth::id(),
            'channel_id' => $channel->id,
            'platform' => $platform,
            'access_token' => 'fake_token_for_development',
            'refresh_token' => 'fake_refresh_token',
            'token_expires_at' => now()->addDays(30),
        ]);

        return redirect()->route('channels.show', $channel->slug)
            ->with('success', ucfirst($platform) . ' account connected successfully! (Development Mode)');
    }

    /**
     * Check if OAuth credentials are configured for a platform.
     */
    protected function isOAuthConfigured(string $platform): bool
    {
        $driver = $this->mapPlatformToDriver($platform);
        
        $clientId = config("services.{$driver}.client_id");
        $clientSecret = config("services.{$driver}.client_secret");
        
        return !empty($clientId) && !empty($clientSecret);
    }

    /**
     * Map platform name to Socialite driver.
     */
    protected function mapPlatformToDriver(string $platform): string
    {
        return match ($platform) {
            'youtube' => 'google',
            'instagram' => 'instagram',
            'tiktok' => 'tiktok',
            'facebook' => 'facebook',
            'snapchat' => 'snapchat',
            'pinterest' => 'pinterest',
            'x' => 'x',
            default => throw new \InvalidArgumentException('Unsupported platform: ' . $platform),
        };
    }

    /**
     * Handle general OAuth callback that determines which channel to connect based on state parameter.
     */
    public function generalCallback(string $platform, Request $request): RedirectResponse
    {
        try {
            if (!in_array($platform, ['youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'pinterest', 'x'])) {
                $this->errorHandler->logConfigurationError($platform, 'Invalid platform selected in general callback');
                return $this->redirectToErrorPage($platform, 'unknown', 'Invalid platform selected.');
            }

            // Check for OAuth provider errors first
            if ($request->input('error')) {
                $this->errorHandler->logProviderError($platform, $request);
                return $this->redirectToErrorPage(
                    $platform, 
                    'unknown', 
                    $this->errorHandler->formatUserErrorMessage($platform, new \Exception($request->input('error_description', $request->input('error'))), $request),
                    $request->input('error')
                );
            }

            // Extract state parameter to get channel information
            $stateParam = $request->input('state');
            
            if (!$stateParam) {
                throw new \Exception('Missing state parameter');
            }

            $stateData = json_decode(base64_decode($stateParam), true);
            
            if (!$stateData || !isset($stateData['channel_slug']) || !isset($stateData['user_id'])) {
                throw new \Exception('Invalid state parameter - missing required fields');
            }

            // Verify the user matches (security check)
            $currentUserId = Auth::id();
            
            if ($stateData['user_id'] !== $currentUserId) {
                throw new \Exception('State parameter user mismatch');
            }

            // Check if state is not too old (1 hour max)
            if (isset($stateData['timestamp']) && (time() - $stateData['timestamp']) > 3600) {
                throw new \Exception('State parameter expired');
            }

            // Find the channel
            $channel = Channel::where('slug', $stateData['channel_slug'])
                ->where('user_id', Auth::id())
                ->first();

            if (!$channel) {
                throw new \Exception('Channel not found or access denied');
            }

            // Get OAuth user data
            $driver = $this->mapPlatformToDriver($platform);
            
            // Validate OAuth configuration before attempting user retrieval
            $clientId = config("services.{$driver}.client_id");
            $clientSecret = config("services.{$driver}.client_secret");
            $redirectUrl = config("services.{$driver}.redirect");
            
            if (empty($clientId)) {
                throw new \Exception("OAuth client ID is not configured for {$driver}.");
            }
            
            if (empty($clientSecret)) {
                throw new \Exception("OAuth client secret is not configured for {$driver}.");
            }
            
            if (empty($redirectUrl)) {
                throw new \Exception("OAuth redirect URL is not configured for {$driver}.");
            }
            
            $socialUser = Socialite::driver($driver)->stateless()->user();

            // Validate we have the required tokens
            if (empty($socialUser->token)) {
                throw new \Exception('No access token received from ' . ucfirst($platform));
            }

            // For Google/YouTube, we need a refresh token for long-term access
            if ($platform === 'youtube' && empty($socialUser->refreshToken)) {
                $this->errorHandler->logConnectionFailure(
                    $platform, 
                    $channel->slug, 
                    new \Exception('No refresh token received'), 
                    $request,
                    ['warning' => 'refresh_token_missing']
                );
                
                // This is a warning, not a failure - continue with the connection
            }

            // Store or update social account
            // First, delete any existing social account for this user+platform combination
            // to avoid conflicts with the old unique constraint
            SocialAccount::where('user_id', Auth::id())
                ->where('platform', $platform)
                ->delete();
            
            // Now create the new social account
            $socialAccount = SocialAccount::create([
                'user_id' => Auth::id(),
                'channel_id' => $channel->id,
                'platform' => $platform,
                'access_token' => $socialUser->token,
                'refresh_token' => $socialUser->refreshToken,
                'token_expires_at' => $socialUser->expiresIn ? 
                    now()->addSeconds($socialUser->expiresIn) : null,
            ]);

            $this->errorHandler->logConnectionSuccess($platform, $channel->slug, [
                'social_account_id' => $socialAccount->id,
                'has_refresh_token' => !empty($socialAccount->refresh_token),
                'expires_at' => $socialAccount->token_expires_at?->toISOString() ?? 'never',
                'callback_type' => 'general',
            ]);

            return redirect()->route('channels.show', $channel->slug)
                ->with('success', ucfirst($platform) . ' account connected successfully!');

        } catch (\Exception $e) {
            $channelSlug = $stateData['channel_slug'] ?? 'unknown';
            
            $this->errorHandler->logConnectionFailure($platform, $channelSlug, $e, $request, [
                'callback_type' => 'general',
            ]);
            
            return $this->redirectToErrorPage(
                $platform, 
                $channelSlug, 
                $this->errorHandler->formatUserErrorMessage($platform, $e, $request),
                'general_callback_failure'
            );
        }
    }

    /**
     * Revoke Google permissions to force fresh consent.
     */
    private function revokeGooglePermissions(int $userId, int $channelId): void
    {
        try {
            $socialAccount = SocialAccount::where('user_id', $userId)
                ->where('channel_id', $channelId)
                ->where('platform', 'youtube')
                ->first();

            if ($socialAccount && $socialAccount->access_token && $socialAccount->access_token !== 'fake_token_for_development') {
                \Log::info('Revoking Google permissions', [
                    'user_id' => $userId,
                    'channel_id' => $channelId,
                    'social_account_id' => $socialAccount->id,
                ]);

                // Revoke the token via Google API
                $client = new \Google\Client();
                $client->setClientId(config('services.google.client_id'));
                $client->setClientSecret(config('services.google.client_secret'));
                $client->revokeToken($socialAccount->access_token);

                // Delete the social account to force fresh connection
                $socialAccount->delete();
                
                \Log::info('Google permissions revoked successfully');
            }
        } catch (\Exception $e) {
            \Log::error('Failed to revoke Google permissions: ' . $e->getMessage());
            // Continue anyway - we'll still get fresh consent
        }
    }

    /**
     * Force reconnect route for problematic accounts.
     */
    public function forceReconnect(Channel $channel, string $platform, Request $request): RedirectResponse
    {
        // Ensure user owns this channel
        if ($channel->user_id !== $request->user()->id) {
            abort(403);
        }

        // Redirect to regular OAuth with force=true parameter
        return redirect()->route('social.redirect', [
            'channel' => $channel->slug,
            'platform' => $platform,
            'force' => 'true'
        ]);
    }

    /**
     * Build OAuth redirect with platform-specific scopes and parameters
     */
    protected function buildOAuthRedirect(string $driver, string $platform, string $state): RedirectResponse
    {
        // Request appropriate scopes based on platform
        if ($platform === 'youtube') {
            // YouTube requires specific scopes for video uploading
            return Socialite::driver($driver)
                ->scopes([
                    'https://www.googleapis.com/auth/youtube.upload',
                    'https://www.googleapis.com/auth/youtube',
                    'https://www.googleapis.com/auth/userinfo.profile',
                    'https://www.googleapis.com/auth/userinfo.email'
                ])
                ->with([
                    'state' => $state,
                    'access_type' => 'offline',        // Required for refresh token
                    'prompt' => 'select_account consent', // Force account selection and consent
                    'include_granted_scopes' => 'true'  // Include previously granted scopes
                ])
                ->redirect();
        } elseif ($platform === 'instagram') {
            // Instagram API with Instagram Login - NEW SCOPES (replacing deprecated ones)
            // These replace the old instagram_basic and instagram_content_publish scopes
            return Socialite::driver($driver)
                ->scopes([
                    'instagram_business_basic',          // Replaces instagram_basic
                    'instagram_business_content_publish', // Replaces instagram_content_publish
                    'instagram_business_manage_comments', // For comment management
                    'pages_show_list',                   // Still required for Facebook pages
                    'pages_read_engagement'              // Still required for engagement data
                ])
                ->with([
                    'state' => $state,
                    'prompt' => 'select_account consent' // Force account selection
                ])
                ->redirect();
        } elseif ($platform === 'tiktok') {
            // TikTok requires video upload and publish permissions
            return Socialite::driver($driver)
                ->scopes([
                    'user.info.basic',
                    'video.upload',
                    'video.publish'
                ])
                ->with([
                    'state' => $state,
                    'prompt' => 'select_account consent' // Force account selection
                ])
                ->redirect();
        } elseif ($platform === 'facebook') {
            // Facebook requires pages and video publishing permissions
            return Socialite::driver($driver)
                ->scopes([
                    'pages_manage_posts',
                    'pages_read_engagement',
                    'pages_show_list',
                    'publish_video'
                ])
                ->with([
                    'state' => $state,
                    'prompt' => 'select_account consent'
                ])
                ->redirect();
        } elseif ($platform === 'snapchat') {
            // Snapchat requires creative and media permissions
            return Socialite::driver($driver)
                ->scopes([
                    'snapchat-marketing-api',
                    'snapchat-profile-api'
                ])
                ->with([
                    'state' => $state,
                    'prompt' => 'select_account consent'
                ])
                ->redirect();
        } elseif ($platform === 'pinterest') {
            // Pinterest requires board and pin creation permissions
            return Socialite::driver($driver)
                ->scopes([
                    'boards:read',
                    'boards:write',
                    'pins:read',
                    'pins:write'
                ])
                ->with([
                    'state' => $state,
                    'prompt' => 'select_account consent'
                ])
                ->redirect();
        } elseif ($platform === 'x') {
            // X (Twitter) API v2 with proper scopes and PKCE
            return Socialite::driver($driver)
                ->scopes(['tweet.read', 'tweet.write', 'users.read', 'offline.access'])
                ->with([
                    'state' => $state,
                    'force_login' => true, // Force X login prompt
                ])
                ->redirect();
        }

        // Fallback for any other cases
        return Socialite::driver($driver)
            ->with([
                'state' => $state,
                'access_type' => 'offline',
                'prompt' => 'select_account consent'
            ])
            ->redirect();
    }

    /**
     * Redirect to error page with structured error information
     */
    protected function redirectToErrorPage(
        string $platform, 
        string $channelSlug, 
        string $errorMessage, 
        string $errorCode = null
    ): RedirectResponse {
        $channel = Channel::where('slug', $channelSlug)->first();
        
        return redirect()->route('oauth.error', [
            'platform' => $platform,
            'channel' => $channelSlug,
            'channel_name' => $channel?->name,
            'message' => $errorMessage,
            'code' => $errorCode,
            'suggested_actions' => implode('|', $this->getSuggestedActions($platform, $errorCode)),
        ]);
    }

    /**
     * Get suggested actions based on platform and error code
     */
    protected function getSuggestedActions(string $platform, ?string $errorCode): array
    {
        $actions = [];

        // Error-specific actions
        switch ($errorCode) {
            case 'access_denied':
                $actions[] = 'Click "Allow" or "Authorize" when prompted by ' . ucfirst($platform);
                $actions[] = 'Make sure you have the necessary permissions on your ' . ucfirst($platform) . ' account';
                break;
            case 'configuration_error':
                $actions[] = 'Contact support to resolve the configuration issue';
                break;
            case 'subscription_limitation':
                $actions[] = 'Upgrade your subscription to access this platform';
                $actions[] = 'Check your subscription status in the billing section';
                break;
            default:
                $actions[] = 'Try connecting again';
                $actions[] = 'Make sure you have a stable internet connection';
        }

        // Platform-specific actions
        switch ($platform) {
            case 'youtube':
                $actions[] = 'Ensure your Google account has YouTube access enabled';
                $actions[] = 'If you have multiple Google accounts, make sure you select the correct one';
                break;
            case 'facebook':
                $actions[] = 'Make sure you have admin access to the Facebook page';
                $actions[] = 'Verify your Facebook account is in good standing';
                break;
            case 'instagram':
                $actions[] = 'Ensure your Instagram account is a Professional account (Business or Creator)';
                $actions[] = 'Personal Instagram accounts are not supported - convert to Professional in Instagram app';
                break;
        }

        return array_unique($actions);
    }
}
