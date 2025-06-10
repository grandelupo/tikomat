<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Cashier\Billable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, Billable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'has_subscription',
        'allowed_platforms',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'has_subscription' => 'boolean',
            'allowed_platforms' => 'array',
        ];
    }

    /**
     * Get the user's social accounts.
     */
    public function socialAccounts(): HasMany
    {
        return $this->hasMany(SocialAccount::class);
    }

    /**
     * Get the user's videos.
     */
    public function videos(): HasMany
    {
        return $this->hasMany(Video::class);
    }

    /**
     * Get the user's channels.
     */
    public function channels(): HasMany
    {
        return $this->hasMany(Channel::class);
    }

    /**
     * Get the user's subscription.
     */
    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class);
    }

    /**
     * Get the user's default channel.
     */
    public function defaultChannel(): HasOne
    {
        return $this->hasOne(Channel::class)->where('is_default', true);
    }

    /**
     * Get allowed platforms for this user.
     */
    public function getAllowedPlatforms(): array
    {
        // If user has an active subscription, return all platforms
        if ($this->subscribed('default')) {
            return ['youtube', 'instagram', 'tiktok'];
        }

        // Free users only get YouTube
        return ['youtube'];
    }

    /**
     * Check if user can access platform.
     */
    public function canAccessPlatform(string $platform): bool
    {
        return in_array($platform, $this->getAllowedPlatforms());
    }

    /**
     * Check if user can create more channels.
     */
    public function canCreateChannel(): bool
    {
        $maxChannels = $this->getMaxChannels();
        $currentChannels = $this->channels()->count();
        
        return $currentChannels < $maxChannels;
    }

    /**
     * Get maximum allowed channels for user.
     */
    public function getMaxChannels(): int
    {
        if ($this->subscribed('default')) {
            // Pro users get 3 base channels plus any additional channels
            $subscription = $this->subscription('default');
            if ($subscription && $subscription->hasPrice('price_additional_channel')) {
                // Count additional channel subscriptions
                $additionalChannels = $subscription->subscriptionItems()
                    ->where('stripe_price', 'price_additional_channel')
                    ->sum('quantity');
                return 3 + $additionalChannels;
            }
            return 3;
        }

        // Free users get 1 channel
        return 1;
    }

    /**
     * Check if user has active subscription.
     */
    public function hasActiveSubscription(): bool
    {
        return $this->subscribed('default');
    }

    /**
     * Get the current subscription plan.
     */
    public function getCurrentPlan(): string
    {
        if ($this->subscribed('default')) {
            return 'pro';
        }
        return 'free';
    }

    /**
     * Calculate monthly cost for user's subscription.
     */
    public function getMonthlyCost(): float
    {
        if (!$this->subscribed('default')) {
            return 0.00;
        }

        $baseCost = 0.60 * 30; // $0.60 per day for 30 days
        $additionalChannels = max(0, $this->getMaxChannels() - 3);
        $additionalCost = $additionalChannels * 0.20 * 30; // $0.20 per day per additional channel

        return $baseCost + $additionalCost;
    }
}
