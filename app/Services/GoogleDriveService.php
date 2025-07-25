<?php

namespace App\Services;

use Google\Client;
use Google\Service\Drive;
use Google\Service\Drive\DriveFile;
use Illuminate\Support\Facades\Log;
use Exception;

class GoogleDriveService
{
    private Client $client;
    private Drive $service;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setClientId(config('services.google_drive.client_id'));
        $this->client->setClientSecret(config('services.google_drive.client_secret'));
        $this->client->setRedirectUri(config('services.google_drive.redirect'));
        $this->client->addScope([
            Drive::DRIVE_READONLY,
            Drive::DRIVE_FILE,
        ]);
        $this->client->setAccessType('offline');
        $this->client->setPrompt('select_account consent');
    }

    /**
     * Set access token for authenticated requests
     */
    public function setAccessToken(string $accessToken, ?string $refreshToken = null): void
    {
        $tokenData = [
            'access_token' => $accessToken,
            'expires_in' => 3600,
        ];

        if ($refreshToken) {
            $tokenData['refresh_token'] = $refreshToken;
        }

        $this->client->setAccessToken($tokenData);
        $this->service = new Drive($this->client);
    }

    /**
     * Get authorization URL
     */
    public function getAuthUrl(): string
    {
        return $this->client->createAuthUrl();
    }

    /**
     * Exchange authorization code for access token
     */
    public function getAccessToken(string $code): array
    {
        $token = $this->client->fetchAccessTokenWithAuthCode($code);
        
        if (isset($token['error'])) {
            throw new Exception('Error fetching access token: ' . $token['error_description']);
        }

        return $token;
    }

    /**
     * List video files from Google Drive
     */
    public function listVideoFiles(int $maxResults = 50, ?string $pageToken = null): array
    {
        try {
            $query = "mimeType contains 'video/' and trashed = false";
            
            $optParams = [
                'q' => $query,
                'pageSize' => $maxResults,
                'fields' => 'nextPageToken, files(id, name, size, mimeType, modifiedTime, webViewLink, thumbnailLink)',
                'orderBy' => 'modifiedTime desc'
            ];

            if ($pageToken) {
                $optParams['pageToken'] = $pageToken;
            }

            $results = $this->service->files->listFiles($optParams);
            $files = $results->getFiles();
            
            $videoFiles = [];
            foreach ($files as $file) {
                $size = $file->getSize();
                // Handle cases where Google Drive doesn't provide file size
                if ($size === null) {
                    // Try to get file size from file metadata or set to 0
                    $size = 0;
                }
                
                $videoFiles[] = [
                    'id' => $file->getId(),
                    'name' => $file->getName(),
                    'size' => $size,
                    'mimeType' => $file->getMimeType(),
                    'modifiedTime' => $file->getModifiedTime(),
                    'webViewLink' => $file->getWebViewLink(),
                    'thumbnailLink' => $file->getThumbnailLink(),
                    'downloadUrl' => $this->getDownloadUrl($file->getId()),
                ];
            }

            return [
                'files' => $videoFiles,
                'nextPageToken' => $results->getNextPageToken(),
            ];
        } catch (Exception $e) {
            Log::error('Google Drive API error: ' . $e->getMessage());
            throw new Exception('Failed to list video files from Google Drive: ' . $e->getMessage());
        }
    }

    /**
     * Get download URL for a file
     */
    public function getDownloadUrl(string $fileId): string
    {
        return "https://drive.google.com/uc?export=download&id=" . $fileId;
    }

    /**
     * Download a file from Google Drive
     */
    public function downloadFile(string $fileId, string $localPath): bool
    {
        try {
            // Ensure directory exists
            $dir = dirname($localPath);
            if (!is_dir($dir)) {
                mkdir($dir, 0755, true);
            }
            
            $response = $this->service->files->get($fileId, ['alt' => 'media']);
            $content = $response->getBody()->getContents();
            
            // Check if we have content
            if (empty($content)) {
                Log::warning('Google Drive download: Empty content received for file ID: ' . $fileId);
                return false;
            }
            
            $bytesWritten = file_put_contents($localPath, $content);
            
            if ($bytesWritten === false) {
                Log::error('Google Drive download: Failed to write file to: ' . $localPath);
                return false;
            }
            
            // Verify file was written successfully
            if (!file_exists($localPath) || filesize($localPath) === 0) {
                Log::error('Google Drive download: File not created or empty: ' . $localPath);
                return false;
            }
            
            return true;
        } catch (Exception $e) {
            Log::error('Google Drive download error: ' . $e->getMessage());
            throw new Exception('Failed to download file from Google Drive: ' . $e->getMessage());
        }
    }

    /**
     * Get file metadata
     */
    public function getFileMetadata(string $fileId): ?array
    {
        try {
            $file = $this->service->files->get($fileId, [
                'fields' => 'id, name, size, mimeType, modifiedTime, webViewLink, thumbnailLink'
            ]);

            return [
                'id' => $file->getId(),
                'name' => $file->getName(),
                'size' => $file->getSize(),
                'mimeType' => $file->getMimeType(),
                'modifiedTime' => $file->getModifiedTime(),
                'webViewLink' => $file->getWebViewLink(),
                'thumbnailLink' => $file->getThumbnailLink(),
            ];
        } catch (Exception $e) {
            Log::error('Google Drive metadata error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Check if token needs refresh
     */
    public function isTokenExpired(): bool
    {
        return $this->client->isAccessTokenExpired();
    }

    /**
     * Refresh access token
     */
    public function refreshToken(): ?array
    {
        try {
            $newToken = $this->client->getRefreshToken();
            if ($newToken) {
                $this->client->fetchAccessTokenWithRefreshToken($newToken);
                return $this->client->getAccessToken();
            }
            return null;
        } catch (Exception $e) {
            Log::error('Google Drive token refresh error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Upload a file to Google Drive
     */
    public function uploadFile(string $filePath, array $metadata, string $mimeType = 'application/octet-stream'): array
    {
        try {
            if (!file_exists($filePath)) {
                throw new Exception('File not found: ' . $filePath);
            }

            $file = new DriveFile();
            $file->setName($metadata['name']);
            
            if (isset($metadata['parents'])) {
                $file->setParents($metadata['parents']);
            }

            $fileSize = filesize($filePath);
            
            // Use resumable upload for large files (>5MB)
            if ($fileSize > 5 * 1024 * 1024) {
                $chunkSizeBytes = 1 * 1024 * 1024; // 1MB chunks
                
                $client = $this->service->getClient();
                $request = $this->service->files->create(
                    $file,
                    [
                        'uploadType' => 'resumable',
                        'mimeType' => $mimeType,
                        'fields' => 'id,name,webViewLink,size'
                    ]
                );

                $media = new \Google\Http\MediaFileUpload(
                    $client,
                    $request,
                    $mimeType,
                    null,
                    true,
                    $chunkSizeBytes
                );
                $media->setFileSize($fileSize);

                $handle = fopen($filePath, 'rb');
                if (!$handle) {
                    throw new Exception('Failed to open file for reading: ' . $filePath);
                }

                $uploadStatus = false;
                while (!$uploadStatus && !feof($handle)) {
                    $chunk = fread($handle, $chunkSizeBytes);
                    $uploadStatus = $media->nextChunk($chunk);
                }
                fclose($handle);

                $result = $uploadStatus;
            } else {
                // Use simple upload for small files
                $handle = fopen($filePath, 'rb');
                if (!$handle) {
                    throw new Exception('Failed to open file for reading: ' . $filePath);
                }
                $data = fread($handle, $fileSize);
                fclose($handle);

                $result = $this->service->files->create(
                    $file,
                    [
                        'data' => $data,
                        'mimeType' => $mimeType,
                        'uploadType' => 'multipart',
                        'fields' => 'id,name,webViewLink,size'
                    ]
                );
            }

            return [
                'id' => $result->getId(),
                'name' => $result->getName(),
                'webViewLink' => $result->getWebViewLink(),
                'size' => $result->getSize() ?: $fileSize,
            ];
        } catch (Exception $e) {
            Log::error('Google Drive upload error: ' . $e->getMessage());
            throw new Exception('Failed to upload file to Google Drive: ' . $e->getMessage());
        }
    }

    /**
     * List folders in Google Drive
     */
    public function listFolders(?string $parentId = null): array
    {
        try {
            $query = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
            
            if ($parentId) {
                $query .= " and '{$parentId}' in parents";
            }

            $optParams = [
                'q' => $query,
                'pageSize' => 100,
                'fields' => 'files(id, name, parents)',
                'orderBy' => 'name'
            ];

            $results = $this->service->files->listFiles($optParams);
            $folders = [];

            foreach ($results->getFiles() as $file) {
                $folders[] = [
                    'id' => $file->getId(),
                    'name' => $file->getName(),
                    'parents' => $file->getParents() ?? [],
                ];
            }

            return $folders;
        } catch (Exception $e) {
            Log::error('Google Drive folder list error: ' . $e->getMessage());
            throw new Exception('Failed to list folders from Google Drive: ' . $e->getMessage());
        }
    }

    /**
     * Create a folder in Google Drive
     */
    public function createFolder(string $name, ?string $parentId = null): array
    {
        try {
            $file = new DriveFile();
            $file->setName($name);
            $file->setMimeType('application/vnd.google-apps.folder');
            
            if ($parentId) {
                $file->setParents([$parentId]);
            }

            $result = $this->service->files->create($file, [
                'fields' => 'id,name,parents'
            ]);

            return [
                'id' => $result->getId(),
                'name' => $result->getName(),
                'parents' => $result->getParents() ?? [],
            ];
        } catch (Exception $e) {
            Log::error('Google Drive folder creation error: ' . $e->getMessage());
            throw new Exception('Failed to create folder in Google Drive: ' . $e->getMessage());
        }
    }
} 