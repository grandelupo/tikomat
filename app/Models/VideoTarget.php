<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoTarget extends Model
{
    protected $fillable = [
        'video_id',
        'platform',
        'publish_at',
        'status',
        'error_message',
        'platform_video_id',
        'platform_url',
        'advanced_options',
        'facebook_page_id',
    ];

    protected function casts(): array
    {
        return [
            'publish_at' => 'datetime',
            'advanced_options' => 'array',
        ];
    }

    /**
     * Get the video that owns this target.
     */
    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    /**
     * Check if this target is scheduled for future publishing.
     */
    public function isScheduled(): bool
    {
        return $this->publish_at && $this->publish_at->isFuture();
    }

    /**
     * Check if this target is ready to publish.
     */
    public function isReadyToPublish(): bool
    {
        return $this->status === 'pending' && 
               (!$this->publish_at || $this->publish_at->isPast());
    }

    /**
     * Mark as processing.
     */
    public function markAsProcessing(): void
    {
        $this->update(['status' => 'processing']);
    }

    /**
     * Mark as success.
     */
    public function markAsSuccess(): void
    {
        $this->update(['status' => 'success', 'error_message' => null]);
    }

    /**
     * Mark as failed with error message.
     */
    public function markAsFailed(string $errorMessage): void
    {
        $this->update(['status' => 'failed', 'error_message' => $errorMessage]);
    }
}
