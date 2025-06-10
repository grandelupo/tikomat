<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\VideoController;
use App\Http\Controllers\SocialAccountController;
use App\Http\Controllers\ChannelController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\SubscriptionController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Stats
    Route::get('stats', [StatsController::class, 'index'])->name('stats');
    
    // Channel routes
    Route::get('channels/{channel:slug}', [DashboardController::class, 'channel'])->name('channels.show');
    Route::resource('channels', ChannelController::class)->except(['show']);
    
    // Video routes (scoped to channels)
    Route::get('channels/{channel:slug}/videos/create', [VideoController::class, 'create'])->name('videos.create');
    Route::post('channels/{channel:slug}/videos', [VideoController::class, 'store'])->name('videos.store');
    Route::resource('videos', VideoController::class)->except(['create', 'store']);
    Route::post('video-targets/{target}/retry', [VideoController::class, 'retryTarget'])
        ->name('video-targets.retry');
    
    // Social Account Management (scoped to channels)
    Route::get('channels/{channel:slug}/auth/{platform}', [SocialAccountController::class, 'redirect'])
        ->name('social.redirect');
    Route::get('channels/{channel:slug}/auth/{platform}/callback', [SocialAccountController::class, 'callback'])
        ->name('social.callback');
    Route::delete('channels/{channel:slug}/social/{platform}', [SocialAccountController::class, 'disconnect'])
        ->name('social.disconnect');
    
    // General OAuth callbacks (for OAuth providers that need exact URLs)
    Route::get('auth/{platform}/callback', [SocialAccountController::class, 'generalCallback'])
        ->name('social.general-callback');
    
    // Development: Simulate OAuth connection
    Route::post('channels/{channel:slug}/simulate-oauth/{platform}', [SocialAccountController::class, 'simulateConnection'])
        ->name('social.simulate');
    
    // Subscription routes
    Route::prefix('subscription')->name('subscription.')->group(function () {
        Route::get('plans', [SubscriptionController::class, 'plans'])->name('plans');
        Route::post('checkout', [SubscriptionController::class, 'checkout'])->name('checkout');
        Route::get('success', [SubscriptionController::class, 'success'])->name('success');
        Route::get('billing', [SubscriptionController::class, 'billing'])->name('billing');
        Route::post('cancel', [SubscriptionController::class, 'cancel'])->name('cancel');
        Route::post('resume', [SubscriptionController::class, 'resume'])->name('resume');
        Route::post('add-channel', [SubscriptionController::class, 'addChannel'])->name('add-channel');
        
        // Development: Simulate subscription
        Route::post('simulate', [SubscriptionController::class, 'simulateSubscription'])->name('simulate');
    });
});

// Stripe webhooks (outside auth middleware)
Route::post('stripe/webhook', '\Laravel\Cashier\Http\Controllers\WebhookController@handleWebhook');

// Public video access (needed for Instagram API)
Route::get('storage/videos/{filename}', function ($filename) {
    $path = storage_path('app/videos/' . $filename);
    
    if (!file_exists($path)) {
        abort(404);
    }
    
    return response()->file($path, [
        'Content-Type' => 'video/mp4'
    ]);
})->name('video.public');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
