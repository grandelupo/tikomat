<?php

namespace App\Http\Controllers;

use App\Models\CloudStorage;
use App\Services\GoogleDriveService;
use App\Services\DropboxService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Exception;

class CloudStorageController extends Controller
{
    /**
     * Redirect to cloud storage provider for authentication.
     */
    public function redirect(string $provider): RedirectResponse
    {
        if (!in_array($provider, ['google_drive', 'dropbox'])) {
            return redirect()->route('dashboard')
                ->with('error', 'Invalid cloud storage provider.');
        }

        try {
            if ($provider === 'google_drive') {
                return Socialite::driver('google_drive')
                    ->scopes([
                        'https://www.googleapis.com/auth/drive.readonly',
                        'https://www.googleapis.com/auth/userinfo.profile',
                        'https://www.googleapis.com/auth/userinfo.email'
                    ])
                    ->with([
                        'access_type' => 'offline',
                        'prompt' => 'select_account consent',
                    ])
                    ->redirect();
            } elseif ($provider === 'dropbox') {
                return Socialite::driver('dropbox')
                    ->scopes(['files.content.read'])
                    ->redirect();
            }
        } catch (Exception $e) {
            Log::error('Cloud storage OAuth redirect failed: ' . $e->getMessage());
            return redirect()->route('dashboard')
                ->with('error', 'Failed to initiate authentication with ' . ucfirst($provider));
        }
    }

    /**
     * Handle callback from cloud storage provider.
     */
    public function callback(string $provider): RedirectResponse
    {
        if (!in_array($provider, ['google_drive', 'dropbox'])) {
            return redirect()->route('dashboard')
                ->with('error', 'Invalid cloud storage provider.');
        }

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();

            // Store or update cloud storage account
            CloudStorage::updateOrCreate(
                [
                    'user_id' => Auth::id(),
                    'provider' => $provider,
                ],
                [
                    'access_token' => $socialUser->token,
                    'refresh_token' => $socialUser->refreshToken,
                    'token_expires_at' => $socialUser->expiresIn ? 
                        now()->addSeconds($socialUser->expiresIn) : null,
                    'provider_user_id' => $socialUser->getId(),
                    'provider_email' => $socialUser->getEmail(),
                    'provider_name' => $socialUser->getName(),
                ]
            );

            return redirect()->route('dashboard')
                ->with('success', ucfirst(str_replace('_', ' ', $provider)) . ' connected successfully!');

        } catch (Exception $e) {
            Log::error('Cloud storage OAuth callback failed: ' . $e->getMessage());
            return redirect()->route('dashboard')
                ->with('error', 'Failed to connect ' . ucfirst(str_replace('_', ' ', $provider)) . ': ' . $e->getMessage());
        }
    }

    /**
     * Get list of video files from cloud storage.
     */
    public function listFiles(string $provider, Request $request): JsonResponse
    {
        if (!in_array($provider, ['google_drive', 'dropbox'])) {
            return response()->json(['error' => 'Invalid provider'], 400);
        }

        $cloudStorage = CloudStorage::where('user_id', Auth::id())
            ->where('provider', $provider)
            ->first();

        if (!$cloudStorage) {
            return response()->json(['error' => 'Cloud storage not connected'], 401);
        }

        try {
            if ($provider === 'google_drive') {
                $service = new GoogleDriveService();
                $service->setAccessToken($cloudStorage->access_token, $cloudStorage->refresh_token);
                
                $maxResults = $request->input('limit', 20);
                $pageToken = $request->input('pageToken');
                
                $result = $service->listVideoFiles($maxResults, $pageToken);
                
                return response()->json([
                    'files' => $result['files'],
                    'nextPageToken' => $result['nextPageToken'],
                    'provider' => 'google_drive'
                ]);
                
            } elseif ($provider === 'dropbox') {
                $service = new DropboxService();
                $service->setAccessToken($cloudStorage->access_token);
                
                $path = $request->input('path', '');
                $limit = $request->input('limit', 20);
                
                $result = $service->listVideoFiles($path, $limit);
                
                return response()->json([
                    'files' => $result['files'],
                    'hasMore' => $result['has_more'],
                    'cursor' => $result['cursor'],
                    'provider' => 'dropbox'
                ]);
            }
        } catch (Exception $e) {
            Log::error('Cloud storage list files failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load files: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Import a video file from cloud storage.
     */
    public function importFile(string $provider, Request $request): JsonResponse
    {
        $request->validate([
            'file_id' => 'required|string',
            'file_name' => 'required|string',
        ]);

        if (!in_array($provider, ['google_drive', 'dropbox'])) {
            return response()->json(['error' => 'Invalid provider'], 400);
        }

        $cloudStorage = CloudStorage::where('user_id', Auth::id())
            ->where('provider', $provider)
            ->first();

        if (!$cloudStorage) {
            return response()->json(['error' => 'Cloud storage not connected'], 401);
        }

        try {
            // Create unique filename
            $fileName = pathinfo($request->file_name, PATHINFO_FILENAME);
            $extension = pathinfo($request->file_name, PATHINFO_EXTENSION);
            $uniqueFileName = $fileName . '_' . time() . '.' . $extension;
            $localPath = storage_path('app/temp/' . $uniqueFileName);

            // Ensure temp directory exists
            if (!is_dir(dirname($localPath))) {
                mkdir(dirname($localPath), 0755, true);
            }

            if ($provider === 'google_drive') {
                $service = new GoogleDriveService();
                $service->setAccessToken($cloudStorage->access_token, $cloudStorage->refresh_token);
                
                $success = $service->downloadFile($request->file_id, $localPath);
                
            } elseif ($provider === 'dropbox') {
                $service = new DropboxService();
                $service->setAccessToken($cloudStorage->access_token);
                
                $success = $service->downloadFile($request->file_id, $localPath);
            }

            if ($success && file_exists($localPath)) {
                return response()->json([
                    'success' => true,
                    'temp_path' => $uniqueFileName,
                    'file_name' => $request->file_name,
                    'file_size' => filesize($localPath),
                ]);
            } else {
                return response()->json(['error' => 'Failed to download file'], 500);
            }

        } catch (Exception $e) {
            Log::error('Cloud storage import failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to import file: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Disconnect cloud storage account.
     */
    public function disconnect(string $provider): RedirectResponse
    {
        if (!in_array($provider, ['google_drive', 'dropbox'])) {
            return redirect()->route('dashboard')
                ->with('error', 'Invalid cloud storage provider.');
        }

        CloudStorage::where('user_id', Auth::id())
            ->where('provider', $provider)
            ->delete();

        return redirect()->route('dashboard')
            ->with('success', ucfirst(str_replace('_', ' ', $provider)) . ' disconnected successfully!');
    }

    /**
     * Get connected cloud storage accounts.
     */
    public function getConnectedAccounts(): JsonResponse
    {
        $accounts = CloudStorage::where('user_id', Auth::id())
            ->select('provider', 'provider_name', 'provider_email', 'created_at')
            ->get();

        return response()->json($accounts);
    }
}
