<?php

namespace App\Services;

use App\Jobs\UploadVideoToYoutube;
use App\Jobs\UploadVideoToTiktok;
use App\Jobs\UploadVideoToInstagram;
use App\Jobs\UploadVideoToFacebook;
use App\Jobs\UploadVideoToSnapchat;
use App\Jobs\UploadVideoToPinterest;
use App\Jobs\UploadVideoToX;
use App\Jobs\RemoveVideoFromYoutube;
use App\Jobs\RemoveVideoFromTiktok;
use App\Jobs\RemoveVideoFromInstagram;
use App\Jobs\RemoveVideoFromFacebook;
use App\Jobs\RemoveVideoFromSnapchat;
use App\Jobs\RemoveVideoFromPinterest;
use App\Jobs\RemoveVideoFromX;
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

                case 'facebook':
                    Log::info('Dispatching Facebook upload job for target: ' . $target->id);
                    UploadVideoToFacebook::dispatch($target);
                    break;

                case 'snapchat':
                    Log::info('Dispatching Snapchat upload job for target: ' . $target->id);
                    UploadVideoToSnapchat::dispatch($target);
                    break;

                case 'pinterest':
                    Log::info('Dispatching Pinterest upload job for target: ' . $target->id);
                    UploadVideoToPinterest::dispatch($target);
                    break;

                case 'x':
                    Log::info('Dispatching X upload job for target: ' . $target->id);
                    UploadVideoToX::dispatch($target);
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

    /**
     * Dispatch appropriate update job for a video target.
     */
    public function dispatchUpdateJob(VideoTarget $target): void
    {
        try {
            // For now, we'll re-upload the video with updated metadata
            // In the future, we could create specific update jobs for platforms that support metadata-only updates
            switch ($target->platform) {
                case 'youtube':
                    Log::info('Dispatching YouTube metadata update job for target: ' . $target->id);
                    // YouTube supports metadata updates without re-uploading
                    UploadVideoToYoutube::dispatch($target);
                    break;

                case 'instagram':
                    Log::info('Instagram does not support metadata updates, skipping target: ' . $target->id);
                    $target->update([
                        'status' => 'success',
                        'error_message' => 'Instagram does not support metadata updates for published videos',
                    ]);
                    break;

                case 'tiktok':
                    Log::info('TikTok does not support metadata updates, skipping target: ' . $target->id);
                    $target->update([
                        'status' => 'success', 
                        'error_message' => 'TikTok does not support metadata updates for published videos',
                    ]);
                    break;

                case 'facebook':
                    Log::info('Dispatching Facebook metadata update job for target: ' . $target->id);
                    // Facebook supports some metadata updates
                    UploadVideoToFacebook::dispatch($target);
                    break;

                case 'x':
                    Log::info('Twitter does not support metadata updates, skipping target: ' . $target->id);
                    $target->update([
                        'status' => 'success',
                        'error_message' => 'Twitter does not support metadata updates for published videos',
                    ]);
                    break;

                case 'snapchat':
                case 'pinterest':
                    Log::info('Platform does not support metadata updates, skipping target: ' . $target->id);
                    $target->update([
                        'status' => 'success',
                        'error_message' => ucfirst($target->platform) . ' does not support metadata updates for published videos',
                    ]);
                    break;

                default:
                    Log::warning('Unknown platform for metadata update: ' . $target->id . ' - ' . $target->platform);
                    $target->update([
                        'status' => 'failed',
                        'error_message' => 'Unknown platform: ' . $target->platform,
                    ]);
                    break;
            }
        } catch (\Exception $e) {
            Log::error('Failed to dispatch metadata update job for target: ' . $target->id, [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            $target->update([
                'status' => 'failed',
                'error_message' => 'Failed to dispatch metadata update job: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Dispatch appropriate removal job for a video target.
     */
    public function dispatchRemovalJob(VideoTarget $target): void
    {
        Log::info('Dispatching video removal job', [
            'target_id' => $target->id,
            'platform' => $target->platform,
            'platform_video_id' => $target->platform_video_id,
        ]);

        try {
            switch ($target->platform) {
                case 'youtube':
                    Log::info('Dispatching YouTube video removal job for target: ' . $target->id);
                    RemoveVideoFromYoutube::dispatch($target);
                    break;

                case 'instagram':
                    Log::info('Dispatching Instagram video removal job for target: ' . $target->id);
                    RemoveVideoFromInstagram::dispatch($target);
                    break;

                case 'tiktok':
                    Log::info('Dispatching TikTok video removal job for target: ' . $target->id);
                    RemoveVideoFromTiktok::dispatch($target);
                    break;

                case 'facebook':
                    Log::info('Dispatching Facebook video removal job for target: ' . $target->id);
                    RemoveVideoFromFacebook::dispatch($target);
                    break;

                case 'x':
                    Log::info('Dispatching X video removal job for target: ' . $target->id);
                    RemoveVideoFromX::dispatch($target);
                    break;

                case 'snapchat':
                    Log::info('Dispatching Snapchat video removal job for target: ' . $target->id);
                    RemoveVideoFromSnapchat::dispatch($target);
                    break;

                case 'pinterest':
                    Log::info('Dispatching Pinterest video removal job for target: ' . $target->id);
                    RemoveVideoFromPinterest::dispatch($target);
                    break;

                default:
                    Log::warning('Unknown platform for video removal: ' . $target->id . ' - ' . $target->platform);
                    throw new \Exception('Unsupported platform for video removal: ' . $target->platform);
            }

            Log::info('Video removal job dispatched successfully', [
                'target_id' => $target->id,
                'platform' => $target->platform,
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to dispatch video removal job for target: ' . $target->id, [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            throw $e;
        }
    }
} 