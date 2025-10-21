<?php

namespace App\Providers;

use App\Models\Channel;
use App\Models\Video;
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

        // Custom route model binding for videos scoped to current user
        Route::bind('video', function ($value, $route) {
            // Only apply user scoping if we have an authenticated user
            if (auth()->check()) {
                $video = Video::where('id', $value)
                    ->where('user_id', auth()->id())
                    ->first();
                
                if (!$video) {
                    throw new ModelNotFoundException();
                }
                
                return $video;
            }
            
            // Fallback to default behavior if no auth
            return Video::findOrFail($value);
        });

        // Custom route model binding for video targets scoped to current user
        Route::bind('target', function ($value, $route) {
            \Log::info('VideoTarget route model binding', [
                'target_id' => $value,
                'user_id' => auth()->id(),
                'authenticated' => auth()->check(),
                'route_name' => $route->getName(),
            ]);
            
            // Only apply user scoping if we have an authenticated user
            if (auth()->check()) {
                $target = \App\Models\VideoTarget::with('video')
                    ->whereHas('video', function ($query) {
                        $query->where('user_id', auth()->id());
                    })
                    ->where('id', $value)
                    ->first();
                
                \Log::info('VideoTarget query result', [
                    'target_id' => $value,
                    'found' => $target ? true : false,
                    'target_video_user_id' => $target?->video?->user_id,
                    'current_user_id' => auth()->id(),
                ]);
                
                if (!$target) {
                    \Log::warning('VideoTarget not found or unauthorized', [
                        'target_id' => $value,
                        'user_id' => auth()->id(),
                    ]);
                    throw new ModelNotFoundException();
                }
                
                return $target;
            }
            
            // Fallback to default behavior if no auth
            return \App\Models\VideoTarget::findOrFail($value);
        });
    }
}
