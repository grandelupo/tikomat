<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\VideoController;
use App\Http\Controllers\SocialAccountController;
use App\Http\Controllers\ChannelController;
use App\Http\Controllers\ConnectionsController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\LegalController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\TutorialController;
use App\Http\Controllers\CloudStorageController;
use App\Http\Controllers\WorkflowController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'auth' => [
            'user' => Auth::user(),
        ],
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Connections
    Route::get('connections', [ConnectionsController::class, 'index'])->name('connections');
    
    // Stats
    Route::get('stats', [StatsController::class, 'index'])->name('stats');
    
    // Channel routes
    Route::get('channels/{channel:slug}', [DashboardController::class, 'channel'])->name('channels.show');
    Route::resource('channels', ChannelController::class)->except(['show']);
    
    // Video routes (scoped to channels)
    Route::get('channels/{channel:slug}/videos/create', [VideoController::class, 'create'])->name('videos.create');
    Route::post('channels/{channel:slug}/videos', [VideoController::class, 'store'])->name('videos.store');
    Route::get('videos', [VideoController::class, 'index'])->name('videos.index');
    Route::resource('videos', VideoController::class)->except(['create', 'store', 'index']);
    Route::post('video-targets/{target}/retry', [VideoController::class, 'retryTarget'])
        ->name('video-targets.retry');
    
    // Workflow routes
    Route::resource('workflow', WorkflowController::class);
    
    // Social Account Management (scoped to channels)
    Route::get('channels/{channel:slug}/auth/{platform}', [SocialAccountController::class, 'redirect'])
        ->name('social.redirect');
    Route::get('channels/{channel:slug}/auth/{platform}/callback', [SocialAccountController::class, 'callback'])
        ->name('social.callback');
    Route::delete('channels/{channel:slug}/social/{platform}', [SocialAccountController::class, 'disconnect'])
        ->name('social.disconnect');
    Route::post('channels/{channel:slug}/social/{platform}/force-reconnect', [SocialAccountController::class, 'forceReconnect'])
        ->name('social.force-reconnect');
    
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

    // Tutorial routes
    Route::post('tutorials/complete', [TutorialController::class, 'complete'])->name('tutorials.complete');
    Route::post('tutorials/reset', [TutorialController::class, 'reset'])->name('tutorials.reset');
    Route::get('tutorials/config/{page}', [TutorialController::class, 'config'])->name('tutorials.config');
    
    // Cloud Storage routes
    Route::prefix('cloud-storage')->name('cloud-storage.')->group(function () {
        Route::get('{provider}/auth', [CloudStorageController::class, 'redirect'])->name('auth');
        Route::get('{provider}/callback', [CloudStorageController::class, 'callback'])->name('callback');
        Route::get('{provider}/files', [CloudStorageController::class, 'listFiles'])->name('files');
        Route::post('{provider}/import', [CloudStorageController::class, 'importFile'])->name('import');
        Route::delete('{provider}/disconnect', [CloudStorageController::class, 'disconnect'])->name('disconnect');
        Route::get('connected', [CloudStorageController::class, 'getConnectedAccounts'])->name('connected');
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

// Chat routes
Route::middleware('auth')->group(function () {
    Route::get('/chat', [ChatController::class, 'index'])->name('chat.index');
    Route::post('/chat', [ChatController::class, 'store'])->name('chat.store');
});

// Legal and contact routes
Route::get('/privacy', [LegalController::class, 'privacy'])->name('legal.privacy');
Route::get('/terms', [LegalController::class, 'terms'])->name('legal.terms');
Route::get('/contact', [ContactController::class, 'show'])->name('contact.show');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
