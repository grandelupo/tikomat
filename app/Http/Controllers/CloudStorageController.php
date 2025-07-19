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
use Inertia\Inertia;
use Inertia\Response;
use Exception;

class CloudStorageController extends Controller
{
    /**
     * Redirect to cloud storage provider for authentication.
     */
    public function redirect(string $provider, Request $request): RedirectResponse
    {
        if (!in_array($provider, ['google_drive', 'dropbox'])) {
            return redirect()->route('dashboard')
                ->with('error', 'Invalid cloud storage provider.');
        }

        // Store redirect information in session
        $redirectTo = $request->input('redirect', 'dashboard');
        session(['cloud_storage_redirect' => $redirectTo]);

        try {
            if ($provider === 'google_drive') {
                return Socialite::driver('google_drive')
                    ->scopes([
                        'https://www.googleapis.com/auth/drive.readonly',
                        'https://www.googleapis.com/auth/drive.file',
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
                    ->scopes(['files.content.read', 'files.content.write'])
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

            // Get redirect information from session
            $redirectTo = session('cloud_storage_redirect', 'dashboard');
            session()->forget('cloud_storage_redirect');

            $successMessage = ucfirst(str_replace('_', ' ', $provider)) . ' connected successfully!';

            // Handle different redirect scenarios
            if ($redirectTo === 'folder_picker') {
                // For folder picker, we need to redirect back to the previous page with a flag
                $referer = session('_previous.url', route('dashboard'));
                return redirect($referer . (strpos($referer, '?') !== false ? '&' : '?') . 'oauth_completed=cloud_storage')
                    ->with('success', $successMessage);
            } elseif ($redirectTo === 'settings') {
                // For settings page
                return redirect()->route('settings.cloud-storage')
                    ->with('success', $successMessage);
            }

            // Default redirect to dashboard
            return redirect()->route('dashboard')
                ->with('success', $successMessage);

        } catch (Exception $e) {
            Log::error('Cloud storage OAuth callback failed: ' . $e->getMessage());
            
            $redirectTo = session('cloud_storage_redirect', 'dashboard');
            session()->forget('cloud_storage_redirect');
            
            $errorMessage = 'Failed to connect ' . ucfirst(str_replace('_', ' ', $provider)) . ': ' . $e->getMessage();

            if ($redirectTo === 'folder_picker') {
                $referer = session('_previous.url', route('dashboard'));
                return redirect($referer)
                    ->with('error', $errorMessage);
            } elseif ($redirectTo === 'settings') {
                return redirect()->route('settings.cloud-storage')
                    ->with('error', $errorMessage);
            }

            return redirect()->route('dashboard')
                ->with('error', $errorMessage);
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
            $tempDir = storage_path('app/temp');
            if (!is_dir($tempDir)) {
                mkdir($tempDir, 0755, true);
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
     * Display cloud storage settings page.
     */
    public function settingsIndex(): Response
    {
        $connectedAccounts = CloudStorage::where('user_id', Auth::id())
            ->select('provider', 'provider_name', 'provider_email', 'created_at')
            ->get();

        $availableProviders = [
            [
                'id' => 'google_drive',
                'name' => 'Google Drive',
                'description' => 'Store and sync your videos with Google Drive',
                'icon' => 'google-drive'
            ],
            [
                'id' => 'dropbox',
                'name' => 'Dropbox',
                'description' => 'Store and sync your videos with Dropbox',
                'icon' => 'dropbox'
            ]
        ];

        return Inertia::render('settings/cloud-storage', [
            'connectedAccounts' => $connectedAccounts,
            'availableProviders' => $availableProviders,
        ]);
    }

    /**
     * Disconnect cloud storage account.
     */
    public function disconnect(string $provider, Request $request): RedirectResponse
    {
        if (!in_array($provider, ['google_drive', 'dropbox'])) {
            return redirect()->route('dashboard')
                ->with('error', 'Invalid cloud storage provider.');
        }

        CloudStorage::where('user_id', Auth::id())
            ->where('provider', $provider)
            ->delete();

        $successMessage = ucfirst(str_replace('_', ' ', $provider)) . ' disconnected successfully!';
        
        // Check if the request came from settings page
        if ($request->input('from') === 'settings' || str_contains($request->header('referer', ''), '/settings/cloud-storage')) {
            return redirect()->route('settings.cloud-storage')
                ->with('success', $successMessage);
        }

        return redirect()->route('dashboard')
            ->with('success', $successMessage);
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

    /**
     * List folders for a cloud storage provider.
     */
    public function listFolders(string $provider, Request $request): JsonResponse
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
                
                $parentId = $request->input('parent_id');
                $folders = $service->listFolders($parentId);
                
                return response()->json([
                    'folders' => $folders,
                    'provider' => 'google_drive'
                ]);
                
            } elseif ($provider === 'dropbox') {
                $service = new DropboxService();
                $service->setAccessToken($cloudStorage->access_token);
                
                $path = $request->input('path', '');
                $folders = $service->listFolders($path);
                
                return response()->json([
                    'folders' => $folders,
                    'provider' => 'dropbox'
                ]);
            }
        } catch (Exception $e) {
            Log::error('Cloud storage list folders failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to load folders: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Create a folder in cloud storage.
     */
    public function createFolder(string $provider, Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|string', // For Google Drive
            'parent_path' => 'nullable|string', // For Dropbox
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
            if ($provider === 'google_drive') {
                $service = new GoogleDriveService();
                $service->setAccessToken($cloudStorage->access_token, $cloudStorage->refresh_token);
                
                $folder = $service->createFolder($request->name, $request->parent_id);
                
                return response()->json([
                    'success' => true,
                    'folder' => $folder,
                    'provider' => 'google_drive'
                ]);
                
            } elseif ($provider === 'dropbox') {
                $service = new DropboxService();
                $service->setAccessToken($cloudStorage->access_token);
                
                $path = ($request->parent_path ? rtrim($request->parent_path, '/') . '/' : '/') . $request->name;
                $folder = $service->createFolder($path);
                
                return response()->json([
                    'success' => true,
                    'folder' => $folder,
                    'provider' => 'dropbox'
                ]);
            }
        } catch (Exception $e) {
            Log::error('Cloud storage create folder failed: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create folder: ' . $e->getMessage()], 500);
        }
    }
}
