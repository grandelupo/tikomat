<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VideoVersion extends Model
{
    protected $fillable = [
        'video_id',
        'version_type',
        'title',
        'description',
        'tags',
        'thumbnail_path',
        'changes_summary',
        'has_subtitle_changes',
        'has_watermark_removal',
    ];

    protected $casts = [
        'tags' => 'array',
        'changes_summary' => 'array',
        'has_subtitle_changes' => 'boolean',
        'has_watermark_removal' => 'boolean',
    ];

    /**
     * Get the video that owns this version.
     */
    public function video(): BelongsTo
    {
        return $this->belongsTo(Video::class);
    }

    /**
     * Check if this is a backup version.
     */
    public function isBackup(): bool
    {
        return $this->version_type === 'backup';
    }

    /**
     * Check if this is the current version.
     */
    public function isCurrent(): bool
    {
        return $this->version_type === 'current';
    }

    /**
     * Create a backup version from video data.
     */
    public static function createBackup(Video $video): self
    {
        return self::create([
            'video_id' => $video->id,
            'version_type' => 'backup',
            'title' => $video->title,
            'description' => $video->description,
            'tags' => $video->tags,
            'thumbnail_path' => $video->thumbnail_path,
            'changes_summary' => [],
            'has_subtitle_changes' => false,
            'has_watermark_removal' => false,
        ]);
    }

    /**
     * Create a current version with changes.
     */
    public static function createCurrent(Video $video, array $changes, array $changesSummary = []): self
    {
        return self::create([
            'video_id' => $video->id,
            'version_type' => 'current',
            'title' => $changes['title'] ?? $video->title,
            'description' => $changes['description'] ?? $video->description,
            'tags' => $changes['tags'] ?? $video->tags,
            'thumbnail_path' => $changes['thumbnail'] ?? $video->thumbnail_path,
            'changes_summary' => $changesSummary,
            'has_subtitle_changes' => $changes['has_subtitle_changes'] ?? false,
            'has_watermark_removal' => $changes['has_watermark_removal'] ?? false,
        ]);
    }

    /**
     * Get the differences between this version and another.
     */
    public function getDifferences(VideoVersion $other): array
    {
        $differences = [];

        if ($this->title !== $other->title) {
            $differences['title'] = [
                'old' => $other->title,
                'new' => $this->title,
            ];
        }

        if ($this->description !== $other->description) {
            $differences['description'] = [
                'old' => $other->description,
                'new' => $this->description,
            ];
        }

        if (json_encode($this->tags) !== json_encode($other->tags)) {
            $differences['tags'] = [
                'old' => $other->tags,
                'new' => $this->tags,
            ];
        }

        if ($this->thumbnail_path !== $other->thumbnail_path) {
            $differences['thumbnail'] = [
                'old' => $other->thumbnail_path,
                'new' => $this->thumbnail_path,
            ];
        }

        return $differences;
    }

    /**
     * Apply this version's data to the video.
     */
    public function applyToVideo(): void
    {
        $this->video->update([
            'title' => $this->title,
            'description' => $this->description,
            'tags' => $this->tags,
            'thumbnail_path' => $this->thumbnail_path,
        ]);
    }
} 