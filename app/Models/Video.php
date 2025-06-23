<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Video extends Model
{
    protected $fillable = [
        'user_id',
        'channel_id',
        'title',
        'description',
        'original_file_path',
        'thumbnail_path',
        'thumbnail_time',
        'duration',
        'video_width',
        'video_height',
        'subtitle_generation_id',
        'subtitle_status',
        'subtitle_language',
        'subtitle_file_path',
        'subtitle_data',
        'subtitles_generated_at',
        'rendered_video_path',
        'rendered_video_status',
    ];

    protected $appends = [
        'formatted_duration',
        'video_path',
        'width',
        'height',
        'thumbnail',
    ];

    protected $casts = [
        'subtitle_data' => 'array',
        'subtitles_generated_at' => 'datetime',
        'duration' => 'integer',
        'video_width' => 'integer',
        'video_height' => 'integer',
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
            
            // Extract filename from the storage path (e.g., "videos/filename.mp4" -> "filename.mp4")
            $filename = basename($this->original_file_path);
            
            // Use the video serving route that handles private storage
            return route('video.serve', ['filename' => $filename]);
        }
        
        return '';
    }

    /**
     * Get the video width for frontend compatibility.
     */
    public function getWidthAttribute(): ?int
    {
        return $this->video_width;
    }

    /**
     * Get the video height for frontend compatibility.
     */
    public function getHeightAttribute(): ?int
    {
        return $this->video_height;
    }

    /**
     * Check if video is within the 60-second limit.
     */
    public function isValidDuration(): bool
    {
        return $this->duration <= 60;
    }

    /**
     * Check if subtitles have been generated for this video.
     */
    public function hasSubtitles(): bool
    {
        if ($this->subtitle_status !== 'completed') {
            return false;
        }
        
        $subtitleData = $this->subtitle_data;
        if (!$subtitleData) {
            return false;
        }
        
        // Handle if subtitle_data is still stored as JSON string
        if (is_string($subtitleData)) {
            $subtitleData = json_decode($subtitleData, true);
        }
        
        if (!is_array($subtitleData) || !isset($subtitleData['subtitles'])) {
            return false;
        }
        
        $subtitles = $subtitleData['subtitles'];
        
        // Handle if subtitles within subtitle_data is still a JSON string
        if (is_string($subtitles)) {
            $subtitles = json_decode($subtitles, true);
        }
        
        return is_array($subtitles) && !empty($subtitles);
    }

    /**
     * Get the thumbnail URL for frontend.
     */
    public function getThumbnailAttribute(): ?string
    {
        if ($this->thumbnail_path) {
            // Check if it's already a full URL
            if (str_starts_with($this->thumbnail_path, 'http')) {
                return $this->thumbnail_path;
            }
            
            // Use the custom thumbnail serving route
            // thumbnail_path is stored as 'thumbnails/filename'
            $filename = basename($this->thumbnail_path);
            return url('/thumbnails/' . $filename);
        }
        
        return null;
    }
}
