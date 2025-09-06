<?php

namespace App\Providers;

use App\Models\Channel;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Route;
use Laravel\Socialite\Facades\Socialite;
use SocialiteProviders\Twitter\Provider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Force HTTPS in production
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // Custom route model binding for channels scoped to current user
        Route::bind('channel', function ($value, $route) {
            // Only apply user scoping if we have an authenticated user
            if (auth()->check()) {
                $channel = Channel::where('slug', $value)
                    ->where('user_id', auth()->id())
                    ->first();
                
                if (!$channel) {
                    throw new ModelNotFoundException();
                }
                
                return $channel;
            }
            
            // Fallback to default behavior if no auth
            return Channel::where('slug', $value)->firstOrFail();
        });
    }
}
