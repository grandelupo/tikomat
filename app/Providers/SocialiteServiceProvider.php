<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Socialite\Facades\Socialite;
use SocialiteProviders\Twitter\Provider as TwitterProvider;
use SocialiteProviders\Google\Provider as GoogleProvider;
use SocialiteProviders\Dropbox\Provider as DropboxProvider;

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
