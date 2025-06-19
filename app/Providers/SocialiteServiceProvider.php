<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Socialite\Facades\Socialite;
use SocialiteProviders\Twitter\Provider as TwitterProvider;
use SocialiteProviders\Google\Provider as GoogleProvider;
use SocialiteProviders\Dropbox\Provider as DropboxProvider;
use SocialiteProviders\Facebook\Provider as FacebookProvider;
use SocialiteProviders\Instagram\Provider as InstagramProvider;
use SocialiteProviders\TikTok\Provider as TikTokProvider;
use SocialiteProviders\Snapchat\Provider as SnapchatProvider;
use SocialiteProviders\Pinterest\Provider as PinterestProvider;

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
        // Register Twitter provider from SocialiteProviders
        Socialite::extend('twitter', function ($app) {
            $config = $app['config']['services.twitter'];
            return Socialite::buildProvider(TwitterProvider::class, $config);
        });

        // Register Facebook provider
        Socialite::extend('facebook', function ($app) {
            $config = $app['config']['services.facebook'];
            return Socialite::buildProvider(FacebookProvider::class, $config);
        });

        // Register Instagram provider
        Socialite::extend('instagram', function ($app) {
            $config = $app['config']['services.instagram'];
            return Socialite::buildProvider(InstagramProvider::class, $config);
        });

        // Register TikTok provider
        Socialite::extend('tiktok', function ($app) {
            $config = $app['config']['services.tiktok'];
            return Socialite::buildProvider(TikTokProvider::class, $config);
        });

        // Register Snapchat provider
        Socialite::extend('snapchat', function ($app) {
            $config = $app['config']['services.snapchat'];
            return Socialite::buildProvider(SnapchatProvider::class, $config);
        });

        // Register Pinterest provider
        Socialite::extend('pinterest', function ($app) {
            $config = $app['config']['services.pinterest'];
            return Socialite::buildProvider(PinterestProvider::class, $config);
        });

        // Register Google Drive provider (extended Google provider with drive scopes)
        Socialite::extend('google_drive', function ($app) {
            $config = $app['config']['services.google_drive'];
            return Socialite::buildProvider(GoogleProvider::class, $config);
        });

        // Register Dropbox provider
        Socialite::extend('dropbox', function ($app) {
            $config = $app['config']['services.dropbox'];
            return Socialite::buildProvider(DropboxProvider::class, $config);
        });
    }
}
