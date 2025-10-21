<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\User;
use GuzzleHttp\RequestOptions;
use SocialiteProviders\Google\Provider as GoogleProvider;
use SocialiteProviders\Dropbox\Provider as DropboxProvider;
use SocialiteProviders\Facebook\Provider as FacebookProvider;
use SocialiteProviders\Instagram\Provider as InstagramProvider;
use SocialiteProviders\TikTok\Provider as TikTokProvider;
use SocialiteProviders\Snapchat\Provider as SnapchatProvider;
use SocialiteProviders\Pinterest\Provider as PinterestProvider;
use SocialiteProviders\Manager\SocialiteWasCalled;

class XProvider extends AbstractProvider
{
    protected function getAuthUrl($state)
    {
        return $this->buildAuthUrlFromBase('https://x.com/i/oauth2/authorize', $state);
    }

    protected function getTokenUrl()
    {
        return 'https://api.x.com/2/oauth2/token';
    }

    protected function getUserByToken($token)
    {
        $response = $this->getHttpClient()->get('https://api.x.com/2/users/me?user.fields=profile_image_url', [
            'headers' => [
                'Authorization' => 'Bearer '.$token,
                'Accept' => 'application/json',
            ],
        ]);

        return json_decode($response->getBody(), true);
    }

    protected function mapUserToObject(array $user)
    {
        return (new User)->setRaw($user)->map([
            'id'       => $user['data']['id'],
            'name'     => $user['data']['name'],
            'nickname' => $user['data']['username'],
            'email'    => null, // X API v2 doesn't provide email by default
            'avatar'   => $user['data']['profile_image_url'] ?? null,
        ]);
    }

    protected function getCodeFields($state = null)
    {
        $fields = [
            'response_type' => 'code',
            'client_id' => $this->clientId,
            'redirect_uri' => $this->redirectUrl,
            'scope' => $this->formatScopes($this->getScopes(), $this->scopeSeparator),
            'state' => $state,
            'code_challenge' => $this->getCodeChallenge(),
            'code_challenge_method' => 'S256',
        ];

        return array_merge($fields, $this->parameters);
    }

    protected function getCodeChallenge()
    {
        $codeVerifier = $this->getCodeVerifier();
        return rtrim(strtr(base64_encode(hash('sha256', $codeVerifier, true)), '+/', '-_'), '=');
    }

    protected function getCodeVerifier()
    {
        if (!session()->has('oauth2_pkce_verifier')) {
            session()->put('oauth2_pkce_verifier', bin2hex(random_bytes(32)));
        }
        return session()->get('oauth2_pkce_verifier');
    }

    public function getAccessTokenResponse($code)
    {
        $response = $this->getHttpClient()->post($this->getTokenUrl(), [
            RequestOptions::HEADERS => ['Accept' => 'application/json'],
            RequestOptions::FORM_PARAMS => $this->getTokenFields($code),
        ]);

        return json_decode($response->getBody(), true);
    }

    protected function getTokenFields($code)
    {
        return [
            'grant_type' => 'authorization_code',
            'client_id' => $this->clientId,
            'client_secret' => $this->clientSecret,
            'code' => $code,
            'redirect_uri' => $this->redirectUrl,
            'code_verifier' => session()->get('oauth2_pkce_verifier'),
        ];
    }

    public function getScopes()
    {
        return ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];
    }
}

class SocialiteServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Register X (Twitter) provider for OAuth 2.0
        Socialite::extend('x', function ($app) {
            $config = $app['config']['services.x'];
            return new XProvider(
                $app['request'], 
                $config['client_id'], 
                $config['client_secret'], 
                $config['redirect']
            );
        });

        // Set up event listener for SocialiteProviders
        $this->app['events']->listen(
            \SocialiteProviders\Manager\SocialiteWasCalled::class,
            function (\SocialiteProviders\Manager\SocialiteWasCalled $event) {
                // Add SocialiteProviders
                $event->extendSocialite('snapchat', \SocialiteProviders\Snapchat\Provider::class);
                $event->extendSocialite('pinterest', \SocialiteProviders\Pinterest\Provider::class);
                $event->extendSocialite('tiktok', \SocialiteProviders\TikTok\Provider::class);
                $event->extendSocialite('facebook', \SocialiteProviders\Facebook\Provider::class);
                $event->extendSocialite('instagram', \SocialiteProviders\Instagram\Provider::class);
                $event->extendSocialite('dropbox', \SocialiteProviders\Dropbox\Provider::class);
                $event->extendSocialite('google', \SocialiteProviders\Google\Provider::class);
            }
        );

        // Register Google Drive provider (extended Google provider with drive scopes)
        Socialite::extend('google_drive', function ($app) {
            $config = $app['config']['services.google_drive'];
            return Socialite::buildProvider(GoogleProvider::class, $config);
        });
    }
}
