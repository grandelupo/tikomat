<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Video extends Model
{
    protected $fillable = [
        'user_id',
        'channel_id',
        'title',
        'description',
        'original_file_path',
        'thumbnail_path',
        'duration',
        'video_width',
        'video_height',
    ];

    protected $appends = [
        'formatted_duration',
        'video_path',
    ];

    /**
     * Get the user that owns the video.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the video's publishing targets.
     */
    public function targets(): HasMany
    {
        return $this->hasMany(VideoTarget::class);
    }

    /**
     * Get the video targets for the video.
     */
    public function videoTargets(): HasMany
    {
        return $this->hasMany(VideoTarget::class);
    }

    /**
     * Get the channel that owns the video.
     */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    /**
     * Get formatted duration in minutes:seconds.
     */
    public function getFormattedDurationAttribute(): string
    {
        $minutes = floor($this->duration / 60);
        $seconds = $this->duration % 60;
        return sprintf('%d:%02d', $minutes, $seconds);
    }

    /**
     * Get the video path URL for frontend.
     */
    public function getVideoPathAttribute(): string
    {
        if ($this->original_file_path) {
            // If the path is already a full URL, return it as is
            if (str_starts_with($this->original_file_path, 'http')) {
                return $this->original_file_path;
            }
            
            // Otherwise, create a URL from the storage path
            return asset('storage/' . $this->original_file_path);
        }
        
        return '';
    }

    /**
     * Check if video is within the 60-second limit.
     */
    public function isValidDuration(): bool
    {
        return $this->duration <= 60;
    }
}
