<?php

use App\Http\Controllers\NotificationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Notification routes
Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{notification}/mark-as-read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/mark-all-as-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);
}); 