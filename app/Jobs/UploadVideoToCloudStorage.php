<?php

namespace App\Jobs;

use App\Models\Video;
use App\Models\CloudStorage;
use App\Services\GoogleDriveService;
use App\Services\DropboxService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Exception;

class UploadVideoToCloudStorage implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected Video $video;
    protected string $provider;
    protected ?string $folderPath;

    /**
     * Create a new job instance.
     */
    public function __construct(Video $video, string $provider, ?string $folderPath = null)
    {
        $this->video = $video;
        $this->provider = $provider;
        $this->folderPath = $folderPath;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            Log::info('Starting cloud upload', [
                'video_id' => $this->video->id,
                'provider' => $this->provider,
                'folder_path' => $this->folderPath,
            ]);

            // Mark as processing
            $this->video->updateCloudUploadStatus($this->provider, 'processing');

            // Get user's cloud storage connection
            $cloudStorage = CloudStorage::where('user_id', $this->video->user_id)
                ->where('provider', $this->provider)
                ->first();

            if (!$cloudStorage) {
                throw new Exception("Cloud storage connection not found for provider: {$this->provider}");
            }

            // Check if token is expired and refresh if needed
            if ($cloudStorage->isTokenExpired()) {
                $this->refreshToken($cloudStorage);
            }

            // Get the video file
            $videoPath = Storage::disk('local')->path($this->video->original_file_path);
            if (!file_exists($videoPath)) {
                throw new Exception("Video file not found: {$this->video->original_file_path}");
            }

            // Upload to the specific provider
            $result = $this->uploadToProvider($cloudStorage, $videoPath);

            // Mark as success and store result
            $this->video->updateCloudUploadStatus($this->provider, 'success', $result);

            Log::info('Cloud upload completed successfully', [
                'video_id' => $this->video->id,
                'provider' => $this->provider,
                'result' => $result,
            ]);

        } catch (Exception $e) {
            Log::error('Cloud upload failed', [
                'video_id' => $this->video->id,
                'provider' => $this->provider,
                'error' => $e->getMessage(),
            ]);

            // Mark as failed
            $this->video->updateCloudUploadStatus($this->provider, 'failed', [
                'error' => $e->getMessage(),
                'failed_at' => now()->toISOString(),
            ]);

            // Re-throw to mark job as failed
            throw $e;
        }
    }

    /**
     * Upload to specific cloud provider.
     */
    protected function uploadToProvider(CloudStorage $cloudStorage, string $videoPath): array
    {
        switch ($this->provider) {
            case 'google_drive':
                return $this->uploadToGoogleDrive($cloudStorage, $videoPath);
                
            case 'dropbox':
                return $this->uploadToDropbox($cloudStorage, $videoPath);
                
            default:
                throw new Exception("Unsupported cloud provider: {$this->provider}");
        }
    }

    /**
     * Upload to Google Drive.
     */
    protected function uploadToGoogleDrive(CloudStorage $cloudStorage, string $videoPath): array
    {
        $service = new GoogleDriveService();
        $service->setAccessToken($cloudStorage->access_token, $cloudStorage->refresh_token);

        $fileName = $this->video->title . '.mp4';
        $mimeType = 'video/mp4';

        // Create the file metadata
        $fileMetadata = [
            'name' => $fileName,
        ];

        // If folder is specified, set the parent
        if ($this->folderPath) {
            $fileMetadata['parents'] = [$this->folderPath];
        }

        // Upload the file
        $uploadResult = $service->uploadFile($videoPath, $fileMetadata, $mimeType);

        return [
            'file_id' => $uploadResult['id'],
            'file_name' => $fileName,
            'web_view_link' => $uploadResult['webViewLink'] ?? null,
            'folder_path' => $this->folderPath,
            'uploaded_at' => now()->toISOString(),
        ];
    }

    /**
     * Upload to Dropbox.
     */
    protected function uploadToDropbox(CloudStorage $cloudStorage, string $videoPath): array
    {
        $service = new DropboxService();
        $service->setAccessToken($cloudStorage->access_token);

        $fileName = $this->video->title . '.mp4';
        $dropboxPath = ($this->folderPath ? rtrim($this->folderPath, '/') . '/' : '/') . $fileName;

        // Upload the file
        $uploadResult = $service->uploadFile($videoPath, $dropboxPath);

        return [
            'file_id' => $uploadResult['id'],
            'file_name' => $fileName,
            'path' => $dropboxPath,
            'shareable_link' => $service->getShareableLink($dropboxPath),
            'folder_path' => $this->folderPath,
            'uploaded_at' => now()->toISOString(),
        ];
    }

    /**
     * Refresh token if expired.
     */
    protected function refreshToken(CloudStorage $cloudStorage): void
    {
        if ($this->provider === 'google_drive') {
            $service = new GoogleDriveService();
            $service->setAccessToken($cloudStorage->access_token, $cloudStorage->refresh_token);
            
            if ($service->isTokenExpired()) {
                $newToken = $service->refreshToken();
                if ($newToken) {
                    $cloudStorage->update([
                        'access_token' => $newToken['access_token'],
                        'token_expires_at' => isset($newToken['expires_in']) 
                            ? now()->addSeconds($newToken['expires_in']) 
                            : null,
                    ]);
                }
            }
        }
        // Dropbox tokens typically don't expire, but we could add refresh logic here if needed
    }

    /**
     * Handle job failure.
     */
    public function failed(Exception $exception): void
    {
        Log::error('Cloud upload job failed', [
            'video_id' => $this->video->id,
            'provider' => $this->provider,
            'exception' => $exception->getMessage(),
        ]);

        $this->video->updateCloudUploadStatus($this->provider, 'failed', [
            'error' => $exception->getMessage(),
            'failed_at' => now()->toISOString(),
        ]);
    }
} 