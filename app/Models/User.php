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
        'is_admin',
        'completed_tutorials',
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
            'completed_tutorials' => 'array',
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
     * Get the user's chat messages.
     */
    public function chatMessages(): HasMany
    {
        return $this->hasMany(ChatMessage::class);
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
        // Free users only get YouTube, paid users get all platforms
        if ($this->hasActiveSubscription()) {
            return ['youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'pinterest', 'x'];
        }
        
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
        // Free users get 1 channel, paid users get more
        if ($this->hasActiveSubscription()) {
            // Pro users get 3 base channels plus any additional channels
            $subscription = $this->subscription('default');
            if ($subscription && $subscription->hasPrice(env('STRIPE_PRICE_ADDITIONAL_CHANNEL'))) {
                // Count additional channel subscriptions
                $additionalChannels = $subscription->subscriptionItems()
                    ->where('stripe_price', env('STRIPE_PRICE_ADDITIONAL_CHANNEL'))
                    ->sum('quantity');
                return 3 + $additionalChannels;
            }
            return 3;
        }
        
        return 1;
    }

    /**
     * Check if user has active subscription.
     */
    public function hasActiveSubscription(): bool
    {
        // Check if user has an actual Stripe subscription
        if ($this->subscribed('default')) {
            return true;
        }

        // Check for manual subscription created via command line
        return $this->subscriptions()
            ->where('stripe_status', 'active')
            ->where(function ($query) {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>', now());
            })
            ->exists();
    }

    /**
     * Get the current subscription plan.
     */
    public function getCurrentPlan(): string
    {
        if ($this->hasActiveSubscription()) {
            return 'pro';
        }
        
        return 'free';
    }

    /**
     * Calculate monthly cost for user's subscription.
     */
    public function getMonthlyCost(): float
    {
        if (!$this->hasActiveSubscription()) {
            return 0.00;
        }

        $baseCost = 0.60 * 30; // $0.60 per day for 30 days
        $additionalChannels = max(0, $this->getMaxChannels() - 3);
        $additionalCost = $additionalChannels * 0.20 * 30; // $0.20 per day per additional channel

        return $baseCost + $additionalCost;
    }

    /*
     * Calculate daily cost for user's subscription.
     */
    public function getDailyCost(): float
    {
        return $this->getMonthlyCost() / 30;
    }
}
