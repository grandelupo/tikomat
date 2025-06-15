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
        $this->client->addScope(Drive::DRIVE_READONLY);
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
                $videoFiles[] = [
                    'id' => $file->getId(),
                    'name' => $file->getName(),
                    'size' => $file->getSize(),
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
            $response = $this->service->files->get($fileId, ['alt' => 'media']);
            $content = $response->getBody()->getContents();
            
            return file_put_contents($localPath, $content) !== false;
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
} 