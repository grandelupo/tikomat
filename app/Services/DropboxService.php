<?php

namespace App\Services;

use Spatie\Dropbox\Client;
use Illuminate\Support\Facades\Log;
use Exception;

class DropboxService
{
    private Client $client;

    public function __construct()
    {
        // Initialize without token - will be set later
    }

    /**
     * Set access token for authenticated requests
     */
    public function setAccessToken(string $accessToken): void
    {
        $this->client = new Client($accessToken);
    }

    /**
     * List video files from Dropbox
     */
    public function listVideoFiles(string $path = '', int $limit = 50): array
    {
        try {
            $response = $this->client->listFolder($path, false, $limit);
            $entries = $response['entries'] ?? [];
            
            $videoFiles = [];
            foreach ($entries as $entry) {
                if ($entry['.tag'] === 'file' && $this->isVideoFile($entry['name'])) {
                    $videoFiles[] = [
                        'id' => $entry['id'],
                        'name' => $entry['name'],
                        'path' => $entry['path_lower'],
                        'size' => $entry['size'],
                        'modified' => $entry['server_modified'],
                        'downloadUrl' => $this->getTemporaryDownloadLink($entry['path_lower']),
                    ];
                }
            }

            return [
                'files' => $videoFiles,
                'has_more' => $response['has_more'] ?? false,
                'cursor' => $response['cursor'] ?? null,
            ];
        } catch (Exception $e) {
            Log::error('Dropbox API error: ' . $e->getMessage());
            throw new Exception('Failed to list video files from Dropbox: ' . $e->getMessage());
        }
    }

    /**
     * Check if file is a video file based on extension
     */
    private function isVideoFile(string $filename): bool
    {
        $videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', '3gp'];
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        return in_array($extension, $videoExtensions);
    }

    /**
     * Get temporary download link for a file
     */
    public function getTemporaryDownloadLink(string $path): string
    {
        try {
            $response = $this->client->getTemporaryLink($path);
            return $response['link'] ?? '';
        } catch (Exception $e) {
            Log::error('Dropbox download link error: ' . $e->getMessage());
            return '';
        }
    }

    /**
     * Download a file from Dropbox
     */
    public function downloadFile(string $path, string $localPath): bool
    {
        try {
            $fileContents = $this->client->download($path);
            return file_put_contents($localPath, $fileContents) !== false;
        } catch (Exception $e) {
            Log::error('Dropbox download error: ' . $e->getMessage());
            throw new Exception('Failed to download file from Dropbox: ' . $e->getMessage());
        }
    }

    /**
     * Get file metadata
     */
    public function getFileMetadata(string $path): ?array
    {
        try {
            $response = $this->client->getMetadata($path);
            
            if ($response['.tag'] === 'file') {
                return [
                    'id' => $response['id'],
                    'name' => $response['name'],
                    'path' => $response['path_lower'],
                    'size' => $response['size'],
                    'modified' => $response['server_modified'],
                    'content_hash' => $response['content_hash'] ?? null,
                ];
            }
            
            return null;
        } catch (Exception $e) {
            Log::error('Dropbox metadata error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Search for video files
     */
    public function searchVideoFiles(string $query, int $maxResults = 50): array
    {
        try {
            $response = $this->client->search('', $query, 0, $maxResults, 'filename');
            $matches = $response['matches'] ?? [];
            
            $videoFiles = [];
            foreach ($matches as $match) {
                $metadata = $match['metadata'];
                if ($metadata['.tag'] === 'file' && $this->isVideoFile($metadata['name'])) {
                    $videoFiles[] = [
                        'id' => $metadata['id'],
                        'name' => $metadata['name'],
                        'path' => $metadata['path_lower'],
                        'size' => $metadata['size'],
                        'modified' => $metadata['server_modified'],
                        'downloadUrl' => $this->getTemporaryDownloadLink($metadata['path_lower']),
                    ];
                }
            }

            return $videoFiles;
        } catch (Exception $e) {
            Log::error('Dropbox search error: ' . $e->getMessage());
            throw new Exception('Failed to search video files in Dropbox: ' . $e->getMessage());
        }
    }

    /**
     * Get account information
     */
    public function getAccountInfo(): ?array
    {
        try {
            $response = $this->client->getAccountInfo();
            return [
                'account_id' => $response['account_id'],
                'name' => $response['name']['display_name'],
                'email' => $response['email'],
                'country' => $response['country'] ?? null,
            ];
        } catch (Exception $e) {
            Log::error('Dropbox account info error: ' . $e->getMessage());
            return null;
        }
    }
} 