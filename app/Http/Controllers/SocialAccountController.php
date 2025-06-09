<?php

namespace App\Http\Controllers;

use App\Models\SocialAccount;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;

class SocialAccountController extends Controller
{
    /**
     * Redirect to social media provider for authentication.
     */
    public function redirect(string $platform): RedirectResponse
    {
        if (!in_array($platform, ['youtube', 'instagram', 'tiktok'])) {
            return redirect()->route('dashboard')
                ->with('error', 'Invalid platform selected.');
        }

        // Check if OAuth credentials are configured
        if (!$this->isOAuthConfigured($platform)) {
            return redirect()->route('dashboard')
                ->with('error', 'OAuth credentials for ' . ucfirst($platform) . ' are not configured. Please check your .env file and add the required credentials.');
        }

        try {
            // Map platform to Socialite driver
            $driver = $this->mapPlatformToDriver($platform);

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
                    ->redirect();
            } elseif ($platform === 'tiktok') {
                // TikTok requires video upload and publish permissions
                return Socialite::driver($driver)
                    ->scopes([
                        'user.info.basic',
                        'video.upload',
                        'video.publish'
                    ])
                    ->redirect();
            }

            return Socialite::driver($driver)->redirect();
        } catch (\Exception $e) {
            \Log::error('OAuth redirect failed: ' . $e->getMessage());
            
            return redirect()->route('dashboard')
                ->with('error', 'Failed to initiate OAuth for ' . ucfirst($platform) . ': ' . $e->getMessage());
        }
    }

    /**
     * Handle callback from social media provider.
     */
    public function callback(string $platform, Request $request): RedirectResponse
    {
        if (!in_array($platform, ['youtube', 'instagram', 'tiktok'])) {
            return redirect()->route('dashboard')
                ->with('error', 'Invalid platform selected.');
        }

        try {
            $driver = $this->mapPlatformToDriver($platform);
            
            // Use same scopes for callback as redirect
            if ($platform === 'youtube') {
                $socialUser = Socialite::driver($driver)
                    ->scopes([
                        'https://www.googleapis.com/auth/youtube.upload',
                        'https://www.googleapis.com/auth/youtube',
                        'https://www.googleapis.com/auth/userinfo.profile',
                        'https://www.googleapis.com/auth/userinfo.email'
                    ])
                    ->user();
            } elseif ($platform === 'instagram') {
                $socialUser = Socialite::driver($driver)
                    ->scopes([
                        'instagram_content_publish',
                        'instagram_basic',
                        'pages_show_list',
                        'pages_read_engagement'
                    ])
                    ->user();
            } elseif ($platform === 'tiktok') {
                $socialUser = Socialite::driver($driver)
                    ->scopes([
                        'user.info.basic',
                        'video.upload',
                        'video.publish'
                    ])
                    ->user();
            } else {
                $socialUser = Socialite::driver($driver)->user();
            }

            // Store or update social account
            SocialAccount::updateOrCreate(
                [
                    'user_id' => Auth::id(),
                    'platform' => $platform,
                ],
                [
                    'access_token' => $socialUser->token,
                    'refresh_token' => $socialUser->refreshToken,
                    'token_expires_at' => $socialUser->expiresIn ? 
                        now()->addSeconds($socialUser->expiresIn) : null,
                ]
            );

            return redirect()->route('dashboard')
                ->with('success', ucfirst($platform) . ' account connected successfully!');

        } catch (\Exception $e) {
            \Log::error('OAuth callback failed: ' . $e->getMessage());
            
            return redirect()->route('dashboard')
                ->with('error', 'Failed to connect ' . ucfirst($platform) . ' account: ' . $e->getMessage());
        }
    }

    /**
     * Disconnect a social media account.
     */
    public function disconnect(string $platform): RedirectResponse
    {
        if (!in_array($platform, ['youtube', 'instagram', 'tiktok'])) {
            return redirect()->route('dashboard')
                ->with('error', 'Invalid platform selected.');
        }

        SocialAccount::where('user_id', Auth::id())
            ->where('platform', $platform)
            ->delete();

        return redirect()->route('dashboard')
            ->with('success', ucfirst($platform) . ' account disconnected successfully!');
    }

    /**
     * Simulate connection for development (when OAuth is not configured).
     */
    public function simulateConnection(string $platform): RedirectResponse
    {
        if (!in_array($platform, ['youtube', 'instagram', 'tiktok'])) {
            return redirect()->route('dashboard')
                ->with('error', 'Invalid platform selected.');
        }

        // Only allow in development environment
        if (!app()->environment('local')) {
            return redirect()->route('dashboard')
                ->with('error', 'This feature is only available in development mode.');
        }

        // Create a fake social account for testing
        SocialAccount::updateOrCreate(
            [
                'user_id' => Auth::id(),
                'platform' => $platform,
            ],
            [
                'access_token' => 'fake_token_for_development',
                'refresh_token' => 'fake_refresh_token',
                'token_expires_at' => now()->addDays(30),
            ]
        );

        return redirect()->route('dashboard')
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
}
