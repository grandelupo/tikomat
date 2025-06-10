<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Channel extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'description',
        'slug',
        'default_platforms',
        'is_default',
    ];

    protected $casts = [
        'default_platforms' => 'array',
        'is_default' => 'boolean',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($channel) {
            if (empty($channel->slug)) {
                $channel->slug = Str::slug($channel->name);
                
                // Ensure slug is unique for this user
                $originalSlug = $channel->slug;
                $counter = 1;
                while (static::where('user_id', $channel->user_id)->where('slug', $channel->slug)->exists()) {
                    $channel->slug = $originalSlug . '-' . $counter;
                    $counter++;
                }
            }
        });
    }

    /**
     * Get the user that owns the channel.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the social accounts for this channel.
     */
    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    /**
     * Get the videos for this channel.
     */
    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }

    /**
     * Get connected platforms for this channel.
     */
    public function getConnectedPlatformsAttribute(): array
    {
        return $this->socialAccounts->pluck('platform')->toArray();
    }

    /**
     * Check if a platform is connected to this channel.
     */
    public function isPlatformConnected(string $platform): bool
    {
        return $this->socialAccounts()->where('platform', $platform)->exists();
    }

    /**
     * Get the default platforms as a collection.
     */
    public function getDefaultPlatformsListAttribute(): array
    {
        return $this->default_platforms ?? [];
    }

    /**
     * Update default platforms for this channel.
     */
    public function updateDefaultPlatforms(array $platforms): void
    {
        // Only update if the user selected platforms that aren't already defaults
        $currentDefaults = $this->default_platforms_list;
        $newDefaults = array_unique(array_merge($currentDefaults, $platforms));
        
        // Filter to only allowed platforms for this user
        $allowedPlatforms = $this->user->getAllowedPlatforms();
        $newDefaults = array_intersect($newDefaults, $allowedPlatforms);
        
        $this->update(['default_platforms' => $newDefaults]);
    }
}
