<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\VideoController;
use App\Http\Controllers\SocialAccountController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // Videos
    Route::resource('videos', VideoController::class);
    Route::post('video-targets/{target}/retry', [VideoController::class, 'retryTarget'])
        ->name('video-targets.retry');
    
    // Social Account Management
    Route::get('auth/{platform}', [SocialAccountController::class, 'redirect'])
        ->name('social.redirect');
    Route::get('auth/{platform}/callback', [SocialAccountController::class, 'callback'])
        ->name('social.callback');
    Route::delete('social/{platform}', [SocialAccountController::class, 'disconnect'])
        ->name('social.disconnect');
    
    // Development: Simulate OAuth connection
    Route::post('simulate-oauth/{platform}', [SocialAccountController::class, 'simulateConnection'])
        ->name('social.simulate');
});

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
