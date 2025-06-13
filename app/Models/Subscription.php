<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'stripe_id',
        'stripe_status',
        'stripe_price',
        'quantity',
        'trial_ends_at',
        'ends_at',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'ends_at' => 'datetime',
        'quantity' => 'integer',
    ];

    /**
     * Get the user that owns the subscription.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Check if subscription is active.
     */
    public function isActive(): bool
    {
        return $this->stripe_status === 'active' && 
               (!$this->ends_at || $this->ends_at->isFuture());
    }

    /**
     * Check if subscription is in trial period.
     */
    public function isInTrial(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    /**
     * Get allowed platforms for this subscription.
     */
    public function getAllowedPlatforms(): array
    {
        if (!$this->isActive()) {
            return ['youtube']; // Free users only get YouTube
        }
        
        return ['youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'pinterest', 'twitter']; // Paid users get all platforms
    }

    /**
     * Get the maximum number of channels allowed for this subscription.
     */
    public function getMaxChannels(): int
    {
        if (!$this->isActive()) {
            return 1; // Free users get 1 channel
        }
        
        return 3; // Pro users get 3 channels
    }

    /**
     * Check if user can create more channels.
     */
    public function canCreateChannel(int $currentChannelCount): bool
    {
        return $currentChannelCount < $this->getMaxChannels();
    }
}
