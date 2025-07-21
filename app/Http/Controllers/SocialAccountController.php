<?php

namespace App\Http\Controllers;

use App\Models\SocialAccount;
use App\Models\Channel;
use App\Services\OAuthErrorHandler;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
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
                
                // Force a fresh OAuth flow to get refresh token
                return $this->redirectToErrorPage(
                    $platform,
                    $channel->slug,
                    'Unable to maintain long-term access to YouTube. Please try connecting again and ensure you grant all requested permissions.',
                    'refresh_token_missing'
                );
            }

            // Handle Facebook page selection if platform is Facebook
            if ($platform === 'facebook') {
                \Log::info('Facebook OAuth callback - starting page selection', [
                    'channel_slug' => $channel->slug,
                    'user_id' => Auth::id(),
                    'has_token' => !empty($socialUser->token),
                    'has_refresh_token' => !empty($socialUser->refreshToken),
                ]);
                return $this->handleFacebookPageSelection($channel, $socialUser);
            }

            // Handle YouTube channel selection if platform is YouTube
            if ($platform === 'youtube') {
                \Log::info('YouTube OAuth callback - starting channel selection', [
                    'channel_slug' => $channel->slug,
                    'user_id' => Auth::id(),
                    'has_token' => !empty($socialUser->token),
                    'has_refresh_token' => !empty($socialUser->refreshToken),
                ]);
                return $this->handleYouTubeChannelSelection($channel, $socialUser);
            }

            // Store or update social account
            // First, delete any existing social account for this user+channel+platform combination
            // to avoid conflicts with the unique constraint and allow reconnection
            $deletedCount = SocialAccount::where('user_id', Auth::id())
                ->where('channel_id', $channel->id)
                ->where('platform', $platform)
                ->delete();

            \Log::info('Deleted existing social account for reconnection', [
                'user_id' => Auth::id(),
                'channel_id' => $channel->id,
                'platform' => $platform,
                'deleted_count' => $deletedCount,
            ]);

            // Check if this social account is already connected to another user
            $existingAccount = SocialAccount::where('platform', $platform)
                ->where('platform_channel_id', $socialUser->getId())
                ->where('user_id', '!=', Auth::id())
                ->first();

            if ($existingAccount) {
                $this->errorHandler->logConnectionFailure(
                    $platform, 
                    $channel->slug, 
                    new \Exception('Account already connected to another user'), 
                    $request,
                    ['existing_user_id' => $existingAccount->user_id]
                );
                
                return $this->redirectToErrorPage(
                    $platform,
                    $channel->slug,
                    'This ' . ucfirst($platform) . ' account is already connected to another Filmate account. Please use a different account or contact support if you believe this is an error.',
                    'account_already_connected'
                );
            }

            // Create new social account
            $socialAccount = $this->createSocialAccount($channel->id, $platform, $socialUser);

            \Log::info('Social account connected successfully', [
                'platform' => $platform,
                'channel_slug' => $channel->slug,
                'user_id' => Auth::id(),
                'social_account_id' => $socialAccount->id,
            ]);

            return redirect()->route('connections')->with('success', ucfirst($platform) . ' account connected successfully!');

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

        // Log the disconnect for debugging
        \Log::info('Disconnecting social account', [
            'user_id' => Auth::id(),
            'channel_id' => $channel->id,
            'channel_slug' => $channel->slug,
            'platform' => $platform,
        ]);

        // For YouTube/Google, also revoke permissions if possible
        if ($platform === 'youtube') {
            $this->revokeGooglePermissions(Auth::id(), $channel->id);
        }

        // Delete the social account
        $deletedCount = SocialAccount::where('user_id', Auth::id())
            ->where('channel_id', $channel->id)
            ->where('platform', $platform)
            ->delete();

        \Log::info('Social account disconnection completed', [
            'user_id' => Auth::id(),
            'channel_id' => $channel->id,
            'platform' => $platform,
            'deleted_count' => $deletedCount,
        ]);

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
        // First, delete any existing social account for this user+channel+platform combination
        // to avoid conflicts with the unique constraint
        SocialAccount::where('user_id', Auth::id())
            ->where('channel_id', $channel->id)
            ->where('platform', $platform)
            ->delete();
        
        // Now create the new social account
        $accountData = [
            'user_id' => Auth::id(),
            'channel_id' => $channel->id,
            'platform' => $platform,
            'access_token' => 'fake_token_for_development',
            'refresh_token' => 'fake_refresh_token',
            'token_expires_at' => now()->addDays(30),
            'profile_name' => 'Test ' . ucfirst($platform) . ' Account',
            'profile_avatar_url' => 'https://via.placeholder.com/100x100?text=' . strtoupper(substr($platform, 0, 2)),
            'profile_username' => 'test_' . $platform . '_user',
        ];

        // Add platform-specific test data
        if ($platform === 'youtube') {
            $accountData['platform_channel_id'] = 'UCtest123456789';
            $accountData['platform_channel_name'] = 'Test YouTube Channel';
            $accountData['platform_channel_handle'] = '@testyoutubechannel';
            $accountData['platform_channel_url'] = 'https://www.youtube.com/channel/UCtest123456789';
            $accountData['is_platform_channel_specific'] = true;
        } elseif ($platform === 'facebook') {
            $accountData['facebook_page_id'] = '123456789';
            $accountData['facebook_page_name'] = 'Test Facebook Page';
            $accountData['facebook_page_access_token'] = 'fake_page_token';
            $accountData['platform_channel_id'] = '123456789';
            $accountData['platform_channel_name'] = 'Test Facebook Page';
            $accountData['platform_channel_url'] = 'https://www.facebook.com/123456789';
            $accountData['is_platform_channel_specific'] = true;
        } elseif ($platform === 'instagram') {
            $accountData['platform_channel_id'] = 'test_instagram_123';
            $accountData['platform_channel_name'] = 'test_instagram_user';
            $accountData['platform_channel_handle'] = '@test_instagram_user';
            $accountData['platform_channel_url'] = 'https://www.instagram.com/test_instagram_user';
            $accountData['is_platform_channel_specific'] = true;
        }

        SocialAccount::create($accountData);

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
                
                // Force a fresh OAuth flow to get refresh token
                return $this->redirectToErrorPage(
                    $platform,
                    $channel->slug,
                    'Unable to maintain long-term access to YouTube. Please try connecting again and ensure you grant all requested permissions.',
                    'refresh_token_missing'
                );
            }

            // Handle Facebook page selection if platform is Facebook
            if ($platform === 'facebook') {
                \Log::info('Facebook OAuth general callback - starting page selection', [
                    'channel_slug' => $channel->slug,
                    'user_id' => Auth::id(),
                    'has_token' => !empty($socialUser->token),
                    'has_refresh_token' => !empty($socialUser->refreshToken),
                ]);
                return $this->handleFacebookPageSelection($channel, $socialUser);
            }

            // Handle YouTube channel selection if platform is YouTube
            if ($platform === 'youtube') {
                \Log::info('YouTube OAuth general callback - starting channel selection', [
                    'channel_slug' => $channel->slug,
                    'user_id' => Auth::id(),
                    'has_token' => !empty($socialUser->token),
                    'has_refresh_token' => !empty($socialUser->refreshToken),
                ]);
                return $this->handleYouTubeChannelSelection($channel, $socialUser);
            }

            // Store or update social account
            // First, delete any existing social account for this user+channel+platform combination
            // to avoid conflicts with the unique constraint and allow reconnection
            $deletedCount = SocialAccount::where('user_id', Auth::id())
                ->where('channel_id', $channel->id)
                ->where('platform', $platform)
                ->delete();

            \Log::info('Deleted existing social account for reconnection', [
                'user_id' => Auth::id(),
                'channel_id' => $channel->id,
                'platform' => $platform,
                'deleted_count' => $deletedCount,
            ]);
            
            // Now create the new social account
            $socialAccount = $this->createSocialAccount($channel->id, $platform, $socialUser);

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
            // Only revoke YouTube-specific permissions, not Google Drive
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

        // For YouTube/Google, revoke existing permissions first
        if ($platform === 'youtube') {
            $this->revokeGooglePermissions(Auth::id(), $channel->id);
        }

        // Delete existing social account for this platform
        SocialAccount::where('user_id', Auth::id())
            ->where('channel_id', $channel->id)
            ->where('platform', $platform)
            ->delete();

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
        // Extract state data to check for force parameter
        $stateData = json_decode(base64_decode($state), true);
        $forceReconnect = $stateData['force'] ?? false;
        
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
                    'prompt' => $forceReconnect ? 'select_account consent' : 'consent', // Force account selection on reconnect
                    'include_granted_scopes' => 'true'  // Include previously granted scopes
                ])
                ->redirect();
        } elseif ($platform === 'instagram') {
            // Instagram API with Instagram Login - NEW SCOPES (replacing deprecated ones)
            // These replace the old instagram_basic and instagram_content_publish scopes
            $scopes = [
                'instagram_business_basic',          // Replaces instagram_basic
                'instagram_business_content_publish', // Replaces instagram_content_publish
            ];
            return Socialite::driver($driver)
                ->scopes($scopes)
                ->setScopes($scopes)
                ->with([
                    'state' => $state,
                    'prompt' => 'select_account consent', // Force account selection
                    'auth_type' => 'rerequest',          // Force re-authorization for page selection
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
                    'pages_manage_posts',           // Required for posting to pages
                    'pages_read_engagement',        // Required for reading page data
                    'pages_show_list',              // Required for listing pages
                    'publish_video',                // Required for video uploads
                    'pages_manage_metadata',        // Required for managing page content
                    'pages_read_user_content',      // Required for reading page content
                    'business_management'           // Required for business selection
                ])
                ->with([
                    'state' => $state,
                    'auth_type' => 'rerequest',              // Force re-authorization to show page selection
                    'prompt' => 'select_account consent',    // Force account selection
                    'response_type' => 'code',               // Ensure we get authorization code
                    'display' => 'popup',                    // Use popup display for better UX
                ])
                ->redirect();
        } elseif ($platform === 'snapchat') {
            // Snapchat requires creative and media permissions
            return Socialite::driver($driver)
                ->scopes([])
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
            case 'refresh_token_missing':
                $actions[] = 'Click "Allow" on ALL permission screens (don\'t skip any)';
                $actions[] = 'Make sure to grant offline access when prompted';
                $actions[] = 'If you see "This app wants to access your account", click Allow';
                $actions[] = 'Try disconnecting any existing connections and reconnect';
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

    /**
     * Create social account with profile information.
     */
    protected function createSocialAccount(int $channelId, string $platform, $socialUser): SocialAccount
    {
        \Log::info('Creating social account', [
            'channel_id' => $channelId,
            'platform' => $platform,
            'has_token' => !empty($socialUser->token),
            'has_refresh_token' => !empty($socialUser->refreshToken),
            'profile_name' => $socialUser->name ?? $socialUser->nickname ?? null,
            'profile_email' => $socialUser->email ?? null,
        ]);

        // Check for duplicate social accounts (prevent trial bypass)
        $currentUserId = Auth::id();
        $isAdmin = Auth::user()->is_admin;

        // Check by platform channel ID if available
        if (!empty($socialUser->id)) {
            if (SocialAccount::isAccountAlreadyConnected($platform, $socialUser->id, $currentUserId)) {
                $existingOwner = SocialAccount::getAccountOwner($platform, $socialUser->id);
                
                if (!$isAdmin) {
                    throw new \Exception(
                        "This {$platform} account is already connected to another Filmate account. " .
                        "Each social media account can only be connected to one Filmate account to prevent trial period bypass."
                    );
                } else {
                    \Log::warning('Admin bypassing duplicate account restriction', [
                        'platform' => $platform,
                        'account_id' => $socialUser->id,
                        'existing_owner_id' => $existingOwner?->id,
                        'new_owner_id' => $currentUserId,
                    ]);
                }
            }
        }

        // Check by username if available
        if (!empty($socialUser->nickname)) {
            if (SocialAccount::isAccountAlreadyConnectedByUsername($platform, $socialUser->nickname, $currentUserId)) {
                $existingOwner = SocialAccount::getAccountOwnerByUsername($platform, $socialUser->nickname);
                
                if (!$isAdmin) {
                    throw new \Exception(
                        "This {$platform} account (@{$socialUser->nickname}) is already connected to another Filmate account. " .
                        "Each social media account can only be connected to one Filmate account to prevent trial period bypass."
                    );
                } else {
                    \Log::warning('Admin bypassing duplicate username restriction', [
                        'platform' => $platform,
                        'username' => $socialUser->nickname,
                        'existing_owner_id' => $existingOwner?->id,
                        'new_owner_id' => $currentUserId,
                    ]);
                }
            }
        }

        $accountData = [
            'user_id' => $currentUserId,
            'channel_id' => $channelId,
            'platform' => $platform,
            'access_token' => $socialUser->token,
            'refresh_token' => $socialUser->refreshToken,
            'token_expires_at' => $socialUser->expiresIn ? 
                now()->addSeconds($socialUser->expiresIn) : null,
            'profile_name' => $socialUser->name ?? $socialUser->nickname ?? null,
            'profile_avatar_url' => $socialUser->avatar ?? null,
            'profile_username' => $socialUser->nickname ?? null,
        ];

        // Add platform-specific data when available
        if ($platform === 'instagram' && property_exists($socialUser, 'user')) {
            // Instagram API provides additional user data
            $userData = $socialUser->user;
            if (is_array($userData)) {
                $accountData['platform_channel_id'] = $userData['id'] ?? null;
                $accountData['platform_channel_name'] = $userData['username'] ?? null;
                $accountData['platform_channel_handle'] = '@' . ($userData['username'] ?? '');
                $accountData['is_platform_channel_specific'] = true;
            }
        }

        try {
            $socialAccount = SocialAccount::create($accountData);
        } catch (\Illuminate\Database\QueryException $e) {
            // If we get a unique constraint violation, it means the old constraint still exists
            if (str_contains($e->getMessage(), 'Duplicate entry') && str_contains($e->getMessage(), 'social_accounts_user_id_platform_unique')) {
                \Log::error('Old unique constraint still exists, attempting to delete all accounts for this user and platform', [
                    'user_id' => $currentUserId,
                    'platform' => $platform,
                    'error' => $e->getMessage(),
                ]);
                
                // Delete ALL accounts for this user and platform (not just this channel)
                // This is a fallback when the old constraint still exists
                $deletedCount = SocialAccount::where('user_id', $currentUserId)
                    ->where('platform', $platform)
                    ->delete();
                
                \Log::info('Deleted all accounts for user and platform due to constraint issue', [
                    'user_id' => $currentUserId,
                    'platform' => $platform,
                    'deleted_count' => $deletedCount,
                ]);
                
                // Try creating again
                $socialAccount = SocialAccount::create($accountData);
            } else {
                // Re-throw if it's a different error
                throw $e;
            }
        }

        \Log::info('Social account created successfully', [
            'social_account_id' => $socialAccount->id,
            'platform' => $platform,
            'channel_id' => $channelId,
        ]);

        return $socialAccount;
    }

    /**
     * Handle Facebook page selection flow.
     */
    protected function handleFacebookPageSelection(Channel $channel, $socialUser): RedirectResponse
    {
        try {
            // Log that we're starting the Facebook page selection process
            \Log::info('Starting Facebook page selection', [
                'channel_slug' => $channel->slug,
                'has_access_token' => !empty($socialUser->token),
                'token_length' => strlen($socialUser->token ?? ''),
            ]);

            // Get user's Facebook pages using latest Graph API version
            $response = Http::get('https://graph.facebook.com/v21.0/me/accounts', [
                'access_token' => $socialUser->token,
                'fields' => 'id,name,access_token,category,tasks',
                'limit' => 100  // Ensure we get all pages
            ]);

            \Log::info('Facebook API response', [
                'status' => $response->status(),
                'successful' => $response->successful(),
                'body_preview' => substr($response->body(), 0, 200),
            ]);

            if (!$response->successful()) {
                throw new \Exception('Failed to fetch Facebook pages: ' . $response->body());
            }

            $data = $response->json();
            $pages = $data['data'] ?? [];

            // Validate that all page IDs are numeric
            $invalidPages = collect($pages)->filter(function($page) {
                return empty($page['id']) || !is_numeric($page['id']) || !ctype_digit($page['id']);
            });
            
            if ($invalidPages->isNotEmpty()) {
                \Log::error('Invalid Facebook page IDs received from API', [
                    'channel_slug' => $channel->slug,
                    'invalid_pages' => $invalidPages->toArray(),
                ]);
                throw new \Exception('Invalid Facebook page data received from API. Please try connecting again.');
            }

            // Additional validation: check for invalid patterns in page IDs
            $invalidPatternPages = collect($pages)->filter(function($page) {
                $invalidPatterns = ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'snapchat', 'pinterest'];
                foreach ($invalidPatterns as $pattern) {
                    if (stripos($page['id'], $pattern) !== false) {
                        return true;
                    }
                }
                return false;
            });
            
            if ($invalidPatternPages->isNotEmpty()) {
                \Log::error('Facebook page IDs contain invalid platform names', [
                    'channel_slug' => $channel->slug,
                    'invalid_pages' => $invalidPatternPages->toArray(),
                ]);
                throw new \Exception('Invalid Facebook page data received from API (contains platform names). Please try connecting again.');
            }

            \Log::info('Facebook pages retrieved', [
                'page_count' => count($pages),
                'pages' => array_map(function($page) {
                    return [
                        'id' => $page['id'], 
                        'name' => $page['name'],
                        'category' => $page['category'] ?? 'Unknown',
                        'tasks' => $page['tasks'] ?? [],
                        'has_video_upload_task' => in_array('CREATE_CONTENT', $page['tasks'] ?? []),
                        'has_manage_task' => in_array('MANAGE', $page['tasks'] ?? []),
                    ];
                }, $pages),
            ]);

            // If user has no pages, show error
            if (empty($pages)) {
                \Log::warning('No Facebook pages found for user');
                return $this->redirectToErrorPage(
                    'facebook',
                    $channel->slug,
                    'No Facebook pages found. You need to have admin access to at least one Facebook page to connect your account.',
                    'no_pages_found'
                );
            }

            // Always show page selection interface, even for single page
            // This ensures users are always aware of which page they're connecting

            // Store user data temporarily in session for page selection
            session([
                'facebook_oauth_data' => [
                    'channel_slug' => $channel->slug,
                    'access_token' => $socialUser->token,
                    'refresh_token' => $socialUser->refreshToken,
                    'expires_in' => $socialUser->expiresIn,
                    'pages' => $pages,
                ]
            ]);

            \Log::info('Redirecting to Facebook page selection', [
                'route' => 'facebook.page-selection',
                'channel_slug' => $channel->slug,
            ]);

            // Redirect to page selection view
            return redirect()->route('facebook.page-selection', $channel->slug);

        } catch (\Exception $e) {
            \Log::error('Facebook page selection failed', [
                'error' => $e->getMessage(),
                'channel_slug' => $channel->slug,
            ]);
            
            return $this->redirectToErrorPage(
                'facebook',
                $channel->slug,
                'Failed to retrieve Facebook pages: ' . $e->getMessage(),
                'page_fetch_failed'
            );
        }
    }

    /**
     * Show Facebook page selection page.
     */
    public function showFacebookPageSelection(Channel $channel, Request $request)
    {
        // Ensure user owns this channel
        if ($channel->user_id !== $request->user()->id) {
            abort(403);
        }

        // Get OAuth data from session
        $oauthData = session('facebook_oauth_data');
        
        if (!$oauthData || $oauthData['channel_slug'] !== $channel->slug) {
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'Facebook connection session expired. Please try connecting again.');
        }

        return Inertia::render('FacebookPageSelection', [
            'channel' => [
                'id' => $channel->id,
                'name' => $channel->name,
                'slug' => $channel->slug,
            ],
            'pages' => $oauthData['pages'],
        ]);
    }

    /**
     * Handle Facebook page selection submission.
     */
    public function selectFacebookPage(Channel $channel, Request $request): RedirectResponse
    {
        // Ensure user owns this channel
        if ($channel->user_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'page_id' => 'required|string',
        ]);

        // Get OAuth data from session
        $oauthData = session('facebook_oauth_data');
        
        if (!$oauthData || $oauthData['channel_slug'] !== $channel->slug) {
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'Facebook connection session expired. Please try connecting again.');
        }

        // Find the selected page
        $selectedPage = collect($oauthData['pages'])->firstWhere('id', $request->page_id);
        
        if (!$selectedPage) {
            return redirect()->back()
                ->with('error', 'Invalid page selection. Please try again.');
        }

        // Validate that the selected page ID is numeric and doesn't contain invalid patterns
        $pageId = $selectedPage['id'];
        if (!is_numeric($pageId) || !ctype_digit($pageId)) {
            \Log::error('Invalid Facebook page ID selected by user', [
                'user_id' => Auth::id(),
                'channel_slug' => $channel->slug,
                'invalid_page_id' => $pageId,
                'page_id_type' => gettype($pageId),
                'page_id_length' => strlen($pageId),
            ]);
            return redirect()->back()
                ->with('error', 'Invalid Facebook page ID selected. Please try connecting again.');
        }

        // Check for invalid patterns in page ID
        $invalidPatterns = ['instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'snapchat', 'pinterest'];
        foreach ($invalidPatterns as $pattern) {
            if (stripos($pageId, $pattern) !== false) {
                \Log::error('Facebook page ID contains invalid platform name', [
                    'user_id' => Auth::id(),
                    'channel_slug' => $channel->slug,
                    'invalid_page_id' => $pageId,
                    'detected_pattern' => $pattern,
                ]);
                return redirect()->back()
                    ->with('error', "Invalid Facebook page ID detected (contains '{$pattern}'). Please try connecting again.");
            }
        }

        // Create social user object
        $socialUser = (object) [
            'token' => $oauthData['access_token'],
            'refreshToken' => $oauthData['refresh_token'],
            'expiresIn' => $oauthData['expires_in'],
        ];

        // Complete the connection
        $result = $this->completeFacebookConnection($channel, $socialUser, $selectedPage);

        // Clear session data
        session()->forget('facebook_oauth_data');

        return $result;
    }

    /**
     * Complete Facebook connection with selected page.
     */
    protected function completeFacebookConnection(Channel $channel, $socialUser, array $selectedPage): RedirectResponse
    {
        try {
            // Check if this Facebook page is already connected to another user
            $existingAccount = SocialAccount::where('platform', 'facebook')
                ->where('facebook_page_id', $selectedPage['id'])
                ->where('user_id', '!=', Auth::id())
                ->first();

            if ($existingAccount) {
                $this->errorHandler->logConnectionFailure(
                    'facebook', 
                    $channel->slug, 
                    new \Exception('Facebook page already connected to another user'), 
                    request(),
                    ['existing_user_id' => $existingAccount->user_id]
                );
                
                return $this->redirectToErrorPage(
                    'facebook',
                    $channel->slug,
                    'This Facebook page is already connected to another Filmate account. Please use a different page or contact support if you believe this is an error.',
                    'facebook_page_already_connected'
                );
            }

            // Delete any existing Facebook account for this user+channel combination
            // This ensures we can reconnect the same Facebook account to different channels
            $deletedCount = SocialAccount::where('user_id', Auth::id())
                ->where('channel_id', $channel->id)
                ->where('platform', 'facebook')
                ->delete();

            \Log::info('Deleted existing Facebook account for reconnection', [
                'user_id' => Auth::id(),
                'channel_id' => $channel->id,
                'deleted_count' => $deletedCount,
            ]);

            // Create new social account with Facebook page details
            $socialAccount = new SocialAccount();
            $socialAccount->user_id = Auth::id();
            $socialAccount->channel_id = $channel->id;
            $socialAccount->platform = 'facebook';
            $socialAccount->access_token = $socialUser->token;
            $socialAccount->refresh_token = $socialUser->refreshToken;
            $socialAccount->token_expires_at = $socialUser->expiresIn ? now()->addSeconds($socialUser->expiresIn) : null;
            $socialAccount->facebook_page_id = $selectedPage['id'];
            $socialAccount->facebook_page_name = $selectedPage['name'];
            $socialAccount->facebook_page_access_token = $selectedPage['access_token'];
            $socialAccount->profile_name = $selectedPage['name'];
            $socialAccount->platform_channel_id = $selectedPage['id'];
            $socialAccount->platform_channel_name = $selectedPage['name'];
            $socialAccount->platform_channel_url = "https://facebook.com/{$selectedPage['id']}";
            $socialAccount->is_platform_channel_specific = true;
            
            try {
                $socialAccount->save();
            } catch (\Illuminate\Database\QueryException $e) {
                // If we get a unique constraint violation, it means the old constraint still exists
                if (str_contains($e->getMessage(), 'Duplicate entry') && str_contains($e->getMessage(), 'social_accounts_user_id_platform_unique')) {
                    \Log::error('Old unique constraint still exists, attempting to delete all Facebook accounts for this user', [
                        'user_id' => Auth::id(),
                        'platform' => 'facebook',
                        'error' => $e->getMessage(),
                    ]);
                    
                    // Delete ALL Facebook accounts for this user (not just this channel)
                    // This is a fallback when the old constraint still exists
                    $deletedCount = SocialAccount::where('user_id', Auth::id())
                        ->where('platform', 'facebook')
                        ->delete();
                    
                    \Log::info('Deleted all Facebook accounts for user due to constraint issue', [
                        'user_id' => Auth::id(),
                        'deleted_count' => $deletedCount,
                    ]);
                    
                    // Try saving again
                    $socialAccount->save();
                } else {
                    // Re-throw if it's a different error
                    throw $e;
                }
            }

            \Log::info('Facebook page connected successfully', [
                'platform' => 'facebook',
                'channel_slug' => $channel->slug,
                'user_id' => Auth::id(),
                'social_account_id' => $socialAccount->id,
                'facebook_page_id' => $selectedPage['id'],
                'facebook_page_name' => $selectedPage['name'],
            ]);

            return redirect()->route('connections')->with('success', 'Facebook page "' . $selectedPage['name'] . '" connected successfully!');

        } catch (\Exception $e) {
            $this->errorHandler->logConnectionFailure('facebook', $channel->slug, $e, request());
            
            return $this->redirectToErrorPage(
                'facebook', 
                $channel->slug, 
                'Failed to connect Facebook page. Please try again.',
                'facebook_connection_failure'
            );
        }
    }

    /**
     * Handle YouTube channel selection flow.
     */
    protected function handleYouTubeChannelSelection(Channel $channel, $socialUser): RedirectResponse
    {
        try {
            // Log that we're starting the YouTube channel selection process
            \Log::info('Starting YouTube channel selection', [
                'channel_slug' => $channel->slug,
                'user_id' => Auth::id(),
                'has_token' => !empty($socialUser->token),
                'has_refresh_token' => !empty($socialUser->refreshToken),
            ]);

            // Get user's YouTube channels using YouTube Data API v3
            $response = Http::get('https://www.googleapis.com/youtube/v3/channels', [
                'access_token' => $socialUser->token,
                'part' => 'id,snippet,statistics',
                'mine' => 'true',
                'maxResults' => 100  // Ensure we get all channels
            ]);

            \Log::info('YouTube API response', [
                'status' => $response->status(),
                'successful' => $response->successful(),
                'body_preview' => substr($response->body(), 0, 200),
            ]);

            if (!$response->successful()) {
                throw new \Exception('Failed to fetch YouTube channels: ' . $response->body());
            }

            $data = $response->json();
            $channels = $data['items'] ?? [];

            \Log::info('YouTube channels retrieved', [
                'channel_count' => count($channels),
                'channels' => array_map(function($ytChannel) {
                    return [
                        'id' => $ytChannel['id'],
                        'name' => $ytChannel['snippet']['title'] ?? 'Unknown',
                        'handle' => $ytChannel['snippet']['customUrl'] ?? null,
                    ];
                }, $channels),
            ]);

            // If user has no channels, show error
            if (empty($channels)) {
                \Log::warning('No YouTube channels found for user');
                return $this->redirectToErrorPage(
                    'youtube',
                    $channel->slug,
                    'No YouTube channels found. You need to have access to at least one YouTube channel to connect your account.',
                    'no_channels_found'
                );
            }

            // Always show channel selection interface, even for single channel
            // This ensures users are always aware of which channel they're connecting

            // Store user data temporarily in session for channel selection
            session([
                'youtube_oauth_data' => [
                    'channel_slug' => $channel->slug,
                    'access_token' => $socialUser->token,
                    'refresh_token' => $socialUser->refreshToken,
                    'expires_in' => $socialUser->expiresIn,
                    'user_profile' => [
                        'name' => $socialUser->name,
                        'email' => $socialUser->email,
                        'avatar' => $socialUser->avatar,
                    ],
                    'channels' => $channels,
                ]
            ]);

            \Log::info('YouTube OAuth data stored in session', [
                'channel_slug' => $channel->slug,
                'channels_count' => count($channels),
                'session_key' => 'youtube_oauth_data',
            ]);

            // Redirect to YouTube channel selection page
            return redirect()->route('youtube.channel-selection', $channel->slug);

        } catch (\Exception $e) {
            \Log::error('YouTube channel selection failed', [
                'channel_slug' => $channel->slug,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return $this->redirectToErrorPage(
                'youtube',
                $channel->slug,
                'Failed to retrieve YouTube channels: ' . $e->getMessage(),
                'channel_selection_failed'
            );
        }
    }

    /**
     * Show YouTube channel selection page.
     */
    public function showYouTubeChannelSelection(Channel $channel, Request $request)
    {
        // Ensure user owns this channel
        if ($channel->user_id !== $request->user()->id) {
            abort(403);
        }

        // Get OAuth data from session
        $oauthData = session('youtube_oauth_data');
        
        if (!$oauthData || $oauthData['channel_slug'] !== $channel->slug) {
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'YouTube connection session expired. Please try connecting again.');
        }

        return Inertia::render('SocialAccount/YouTubeChannelSelection', [
            'channel' => [
                'id' => $channel->id,
                'name' => $channel->name,
                'slug' => $channel->slug,
            ],
            'youtubeChannels' => $oauthData['channels'],
            'userProfile' => $oauthData['user_profile'],
        ]);
    }

    /**
     * Complete YouTube channel connection after user selects a channel.
     */
    public function selectYouTubeChannel(Channel $channel, Request $request): RedirectResponse
    {
        // Ensure user owns this channel
        if ($channel->user_id !== $request->user()->id) {
            abort(403);
        }

        $request->validate([
            'youtube_channel_id' => 'required|string',
        ]);

        // Get OAuth data from session
        $oauthData = session('youtube_oauth_data');

        if (!$oauthData || $oauthData['channel_slug'] !== $channel->slug) {
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'YouTube connection session expired. Please try connecting again.');
        }

        // Find the selected YouTube channel
        $selectedChannel = collect($oauthData['channels'])->firstWhere('id', $request->youtube_channel_id);

        if (!$selectedChannel) {
            return redirect()->back()
                ->with('error', 'Invalid YouTube channel selection. Please try again.');
        }

        // Create social user object
        $socialUser = (object) [
            'token' => $oauthData['access_token'],
            'refreshToken' => $oauthData['refresh_token'],
            'expiresIn' => $oauthData['expires_in'],
            'name' => $oauthData['user_profile']['name'],
            'email' => $oauthData['user_profile']['email'],
            'avatar' => $oauthData['user_profile']['avatar'],
        ];

        // Complete the connection
        $result = $this->completeYouTubeChannelConnection($channel, $socialUser, $selectedChannel);

        // Clear session data
        session()->forget('youtube_oauth_data');

        return $result;
    }

    /**
     * Complete YouTube channel connection with selected channel.
     */
    protected function completeYouTubeChannelConnection(Channel $channel, $socialUser, array $selectedChannel): RedirectResponse
    {
        try {
            // Check if this YouTube channel is already connected to another user
            $existingAccount = SocialAccount::where('platform', 'youtube')
                ->where('platform_channel_id', $selectedChannel['id'])
                ->where('user_id', '!=', Auth::id())
                ->first();

            if ($existingAccount) {
                $this->errorHandler->logConnectionFailure(
                    'youtube', 
                    $channel->slug, 
                    new \Exception('YouTube channel already connected to another user'), 
                    request(),
                    ['existing_user_id' => $existingAccount->user_id]
                );
                
                return $this->redirectToErrorPage(
                    'youtube',
                    $channel->slug,
                    'This YouTube channel is already connected to another Filmate account. Please use a different channel or contact support if you believe this is an error.',
                    'youtube_channel_already_connected'
                );
            }

            // Delete any existing YouTube account for this user+channel combination
            // This ensures we can reconnect the same YouTube account to different channels
            $deletedCount = SocialAccount::where('user_id', Auth::id())
                ->where('channel_id', $channel->id)
                ->where('platform', 'youtube')
                ->delete();

            \Log::info('Deleted existing YouTube account for reconnection', [
                'user_id' => Auth::id(),
                'channel_id' => $channel->id,
                'deleted_count' => $deletedCount,
            ]);

            // Create new social account with YouTube channel details
            $socialAccount = new SocialAccount();
            $socialAccount->user_id = Auth::id();
            $socialAccount->channel_id = $channel->id;
            $socialAccount->platform = 'youtube';
            $socialAccount->access_token = $socialUser->token;
            $socialAccount->refresh_token = $socialUser->refreshToken;
            $socialAccount->token_expires_at = $socialUser->expiresIn ? now()->addSeconds($socialUser->expiresIn) : null;
            $socialAccount->profile_name = $selectedChannel['snippet']['title'] ?? 'Unknown Channel';
            $socialAccount->profile_username = $selectedChannel['snippet']['customUrl'] ?? null;
            $socialAccount->platform_channel_id = $selectedChannel['id'];
            $socialAccount->platform_channel_name = $selectedChannel['snippet']['title'] ?? 'Unknown Channel';
            $socialAccount->platform_channel_handle = $selectedChannel['snippet']['customUrl'] ?? null;
            $socialAccount->platform_channel_url = "https://youtube.com/channel/{$selectedChannel['id']}";
            $socialAccount->platform_channel_data = [
                'subscriber_count' => $selectedChannel['statistics']['subscriberCount'] ?? 0,
                'video_count' => $selectedChannel['statistics']['videoCount'] ?? 0,
                'view_count' => $selectedChannel['statistics']['viewCount'] ?? 0,
            ];
            $socialAccount->is_platform_channel_specific = true;
            
            try {
                $socialAccount->save();
            } catch (\Illuminate\Database\QueryException $e) {
                // If we get a unique constraint violation, it means the old constraint still exists
                if (str_contains($e->getMessage(), 'Duplicate entry') && str_contains($e->getMessage(), 'social_accounts_user_id_platform_unique')) {
                    \Log::error('Old unique constraint still exists, attempting to delete all YouTube accounts for this user', [
                        'user_id' => Auth::id(),
                        'platform' => 'youtube',
                        'error' => $e->getMessage(),
                    ]);
                    
                    // Delete ALL YouTube accounts for this user (not just this channel)
                    // This is a fallback when the old constraint still exists
                    $deletedCount = SocialAccount::where('user_id', Auth::id())
                        ->where('platform', 'youtube')
                        ->delete();
                    
                    \Log::info('Deleted all YouTube accounts for user due to constraint issue', [
                        'user_id' => Auth::id(),
                        'deleted_count' => $deletedCount,
                    ]);
                    
                    // Try saving again
                    $socialAccount->save();
                } else {
                    // Re-throw if it's a different error
                    throw $e;
                }
            }

            \Log::info('YouTube channel connected successfully', [
                'platform' => 'youtube',
                'channel_slug' => $channel->slug,
                'user_id' => Auth::id(),
                'social_account_id' => $socialAccount->id,
                'youtube_channel_id' => $selectedChannel['id'],
                'youtube_channel_title' => $selectedChannel['snippet']['title'] ?? 'Unknown Channel',
            ]);

            return redirect()->route('connections')->with('success', 'YouTube channel "' . ($selectedChannel['snippet']['title'] ?? 'Unknown Channel') . '" connected successfully!');

        } catch (\Exception $e) {
            $this->errorHandler->logConnectionFailure('youtube', $channel->slug, $e, request());
            
            return $this->redirectToErrorPage(
                'youtube', 
                $channel->slug, 
                'Failed to connect YouTube channel. Please try again.',
                'youtube_connection_failure'
            );
        }
    }
}