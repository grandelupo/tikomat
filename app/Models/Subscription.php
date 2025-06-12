<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Subscription extends Model
{
    protected $fillable = [
        'user_id',
        'stripe_subscription_id',
        'stripe_customer_id',
        'status',
        'max_channels',
        'daily_rate',
        'current_period_start',
        'current_period_end',
        'trial_ends_at',
    ];

    protected $casts = [
        'daily_rate' => 'decimal:2',
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
        'trial_ends_at' => 'datetime',
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
        return $this->status === 'active';
    }

    /**
     * Check if subscription is in trial period.
     */
    public function isInTrial(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    /**
     * Calculate daily rate based on number of channels.
     */
    public static function calculateDailyRate(int $channelCount): float
    {
        $baseRate = 0.60; // $0.60 for first 3 channels
        
        if ($channelCount <= 3) {
            return $baseRate;
        }
        
        $additionalChannels = $channelCount - 3;
        $additionalRate = $additionalChannels * 0.20; // $0.20 per additional channel
        
        return $baseRate + $additionalRate;
    }

    /**
     * Check if user can create more channels.
     */
    public function canCreateChannel(int $currentChannelCount): bool
    {
        // Free users can have 1 channel with YouTube only
        if (!$this->isActive()) {
            return $currentChannelCount < 1;
        }
        
        // Paid users can have up to max_channels
        return $currentChannelCount < $this->max_channels;
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
}
