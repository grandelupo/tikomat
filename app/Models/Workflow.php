<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Workflow extends Model
{
    protected $fillable = [
        'user_id',
        'channel_id',
        'name',
        'description',
        'source_platform',
        'target_platforms',
        'is_active',
        'last_run_at',
        'videos_processed',
    ];

    protected $casts = [
        'target_platforms' => 'array',
        'is_active' => 'boolean',
        'last_run_at' => 'datetime',
        'videos_processed' => 'integer',
    ];

    protected $attributes = [
        'videos_processed' => 0,
        'is_active' => true,
    ];

    /**
     * Get the user that owns the workflow.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the channel that owns the workflow.
     */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    /**
     * Check if the workflow should process a given platform.
     */
    public function shouldProcessPlatform(string $platform): bool
    {
        return $this->is_active && 
               $this->source_platform === $platform;
    }

    /**
     * Get the target platforms for this workflow.
     */
    public function getTargetPlatforms(): array
    {
        return $this->target_platforms ?? [];
    }

    /**
     * Increment the videos processed counter.
     */
    public function incrementVideosProcessed(): void
    {
        $this->increment('videos_processed');
        $this->update(['last_run_at' => now()]);
    }
} 