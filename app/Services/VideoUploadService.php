<?php

namespace App\Services;

use App\Jobs\UploadVideoToYoutube;
use App\Jobs\UploadVideoToTiktok;
use App\Jobs\UploadVideoToInstagram;
use App\Models\VideoTarget;
use Illuminate\Support\Facades\Log;

class VideoUploadService
{
    /**
     * Process pending video targets for upload.
     */
    public function processPendingUploads(): void
    {
        Log::info('Processing pending video uploads');

        $pendingTargets = VideoTarget::where('status', 'pending')
            ->where(function ($query) {
                $query->whereNull('publish_at')
                    ->orWhere('publish_at', '<=', now());
            })
            ->with(['video.user'])
            ->get();

        Log::info('Found ' . $pendingTargets->count() . ' pending video targets');

        foreach ($pendingTargets as $target) {
            $this->dispatchUploadJob($target);
        }
    }

    /**
     * Dispatch appropriate upload job for a video target.
     */
    public function dispatchUploadJob(VideoTarget $target): void
    {
        try {
            switch ($target->platform) {
                case 'youtube':
                    Log::info('Dispatching YouTube upload job for target: ' . $target->id);
                    UploadVideoToYoutube::dispatch($target);
                    break;

                case 'instagram':
                    Log::info('Dispatching Instagram upload job for target: ' . $target->id);
                    UploadVideoToInstagram::dispatch($target);
                    break;

                case 'tiktok':
                    Log::info('Dispatching TikTok upload job for target: ' . $target->id);
                    UploadVideoToTiktok::dispatch($target);
                    break;

                default:
                    Log::warning('Unknown platform for target: ' . $target->id . ' - ' . $target->platform);
                    $target->markAsFailed('Unknown platform: ' . $target->platform);
                    break;
            }
        } catch (\Exception $e) {
            Log::error('Failed to dispatch upload job for target: ' . $target->id, [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            $target->markAsFailed('Failed to dispatch upload job: ' . $e->getMessage());
        }
    }

    /**
     * Retry a failed video target.
     */
    public function retryFailedTarget(VideoTarget $target): void
    {
        if ($target->status !== 'failed') {
            throw new \Exception('Only failed targets can be retried');
        }

        Log::info('Retrying failed video target: ' . $target->id);

        $target->update([
            'status' => 'pending',
            'error_message' => null,
        ]);

        $this->dispatchUploadJob($target);
    }
} 