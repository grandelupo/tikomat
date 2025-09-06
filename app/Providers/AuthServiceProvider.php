<?php

namespace App\Providers;

use App\Models\Channel;
use App\Models\Video;
use App\Policies\ChannelPolicy;
use App\Policies\VideoPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Video::class => VideoPolicy::class,
        Channel::class => ChannelPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        //
    }
}
