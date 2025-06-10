<?php

namespace App\Http\Controllers;

use App\Models\SocialAccount;
use App\Models\Channel;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;

class SocialAccountController extends Controller
{
    /**
     * Redirect to social media provider for authentication.
     */
    public function redirect(Channel $channel, string $platform, Request $request): RedirectResponse
    {
        // Ensure user owns this channel
        if ($channel->user_id !== $request->user()->id) {
            abort(403);
        }

        if (!in_array($platform, ['youtube', 'instagram', 'tiktok'])) {
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'Invalid platform selected.');
        }

        // Check if user can access this platform
        if (!$request->user()->canAccessPlatform($platform)) {
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'This platform is not available with your current plan.');
        }

        // Check if OAuth credentials are configured
        if (!$this->isOAuthConfigured($platform)) {
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'OAuth credentials for ' . ucfirst($platform) . ' are not configured. Please check your .env file and add the required credentials.');
        }

        try {
            // Map platform to Socialite driver
            $driver = $this->mapPlatformToDriver($platform);

            // Create state parameter with channel information
            $state = base64_encode(json_encode([
                'channel_slug' => $channel->slug,
                'user_id' => $request->user()->id,
                'platform' => $platform,
                'timestamp' => time()
            ]));

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
                    ->with(['state' => $state])
                    ->redirect();
            } elseif ($platform === 'instagram') {
                // Instagram requires content publishing permissions
                return Socialite::driver($driver)
                    ->scopes([
                        'instagram_content_publish',
                        'instagram_basic',
                        'pages_show_list',
                        'pages_read_engagement'
                    ])
                    ->with(['state' => $state])
                    ->redirect();
            } elseif ($platform === 'tiktok') {
                // TikTok requires video upload and publish permissions
                return Socialite::driver($driver)
                    ->scopes([
                        'user.info.basic',
                        'video.upload',
                        'video.publish'
                    ])
                    ->with(['state' => $state])
                    ->redirect();
            }

            return Socialite::driver($driver)
                ->with(['state' => $state])
                ->redirect();
        } catch (\Exception $e) {
            \Log::error('OAuth redirect failed: ' . $e->getMessage());
            
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'Failed to initiate OAuth for ' . ucfirst($platform) . ': ' . $e->getMessage());
        }
    }

    /**
     * Handle callback from social media provider.
     */
    public function callback(Channel $channel, string $platform, Request $request): RedirectResponse
    {
        // Ensure user owns this channel
        if ($channel->user_id !== $request->user()->id) {
            abort(403);
        }

        if (!in_array($platform, ['youtube', 'instagram', 'tiktok'])) {
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'Invalid platform selected.');
        }

        try {
            $driver = $this->mapPlatformToDriver($platform);
            
            \Log::info('OAuth callback for channel: ' . $channel->slug . ', platform: ' . $platform);
            
            // Get OAuth user data
            $socialUser = Socialite::driver($driver)->user();

            // Store or update social account
            SocialAccount::updateOrCreate(
                [
                    'user_id' => Auth::id(),
                    'channel_id' => $channel->id,
                    'platform' => $platform,
                ],
                [
                    'access_token' => $socialUser->token,
                    'refresh_token' => $socialUser->refreshToken,
                    'token_expires_at' => $socialUser->expiresIn ? 
                        now()->addSeconds($socialUser->expiresIn) : null,
                ]
            );

            \Log::info('OAuth connection successful for channel: ' . $channel->slug . ', platform: ' . $platform);

            return redirect()->route('channels.show', $channel->slug)
                ->with('success', ucfirst($platform) . ' account connected successfully!');

        } catch (\Exception $e) {
            \Log::error('OAuth callback failed for channel: ' . $channel->slug . ', platform: ' . $platform . ' - ' . $e->getMessage());
            
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'Failed to connect ' . ucfirst($platform) . ' account: ' . $e->getMessage());
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

        if (!in_array($platform, ['youtube', 'instagram', 'tiktok'])) {
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

        if (!in_array($platform, ['youtube', 'instagram', 'tiktok'])) {
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
        SocialAccount::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'channel_id' => $channel->id,
                'platform' => $platform,
            ],
            [
                'access_token' => 'fake_token_for_development',
                'refresh_token' => 'fake_refresh_token',
                'token_expires_at' => now()->addDays(30),
            ]
        );

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
            default => throw new \InvalidArgumentException('Unsupported platform: ' . $platform),
        };
    }

    /**
     * Handle general OAuth callback that determines which channel to connect based on state parameter.
     */
    public function generalCallback(string $platform, Request $request): RedirectResponse
    {
        if (!in_array($platform, ['youtube', 'instagram', 'tiktok'])) {
            return redirect()->route('dashboard')
                ->with('error', 'Invalid platform selected.');
        }

        \Log::info('General OAuth callback URL: ' . $request->fullUrl());
        \Log::info('General OAuth callback request data: ', $request->all());

        try {
            // Extract state parameter to get channel information
            $stateParam = $request->input('state');
            \Log::info('State parameter received: ' . $stateParam);
            
            if (!$stateParam) {
                throw new \Exception('Missing state parameter');
            }

            $stateData = json_decode(base64_decode($stateParam), true);
            \Log::info('Decoded state data: ', $stateData ?: []);
            
            if (!$stateData || !isset($stateData['channel_slug']) || !isset($stateData['user_id'])) {
                throw new \Exception('Invalid state parameter - missing required fields');
            }

            // Verify the user matches (security check)
            $currentUserId = Auth::id();
            \Log::info('Current user ID: ' . $currentUserId . ', State user ID: ' . $stateData['user_id']);
            
            if ($stateData['user_id'] !== $currentUserId) {
                throw new \Exception('State parameter user mismatch');
            }

            // Check if state is not too old (1 hour max)
            if (isset($stateData['timestamp']) && (time() - $stateData['timestamp']) > 3600) {
                throw new \Exception('State parameter expired');
            }

            // Find the channel
            \Log::info('Looking for channel with slug: ' . $stateData['channel_slug']);
            $channel = Channel::where('slug', $stateData['channel_slug'])
                ->where('user_id', Auth::id())
                ->first();

            if (!$channel) {
                throw new \Exception('Channel not found or access denied');
            }

            \Log::info('Found channel: ' . $channel->name . ' (ID: ' . $channel->id . ')');

            // Get OAuth user data
            $driver = $this->mapPlatformToDriver($platform);
            \Log::info('Using driver: ' . $driver . ' for platform: ' . $platform);
            
            $socialUser = Socialite::driver($driver)->stateless()->user();
            \Log::info('OAuth user retrieved successfully, token length: ' . strlen($socialUser->token));

            // Store or update social account
            $socialAccount = SocialAccount::updateOrCreate(
                [
                    'user_id' => Auth::id(),
                    'channel_id' => $channel->id,
                    'platform' => $platform,
                ],
                [
                    'access_token' => $socialUser->token,
                    'refresh_token' => $socialUser->refreshToken,
                    'token_expires_at' => $socialUser->expiresIn ? 
                        now()->addSeconds($socialUser->expiresIn) : null,
                ]
            );

            \Log::info('Social account created/updated successfully: ' . $socialAccount->id);

            return redirect()->route('channels.show', $channel->slug)
                ->with('success', ucfirst($platform) . ' account connected successfully!');

        } catch (\Exception $e) {
            \Log::error('General OAuth callback failed: ' . $e->getMessage(), [
                'exception' => $e,
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'platform' => $platform,
                'user_id' => Auth::id(),
                'request_data' => $request->all()
            ]);
            
            return redirect()->route('dashboard')
                ->with('error', 'Failed to connect ' . ucfirst($platform) . ' account: ' . $e->getMessage());
        }
    }
}
