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
        // Simplified - all users get all platforms for now
        return ['youtube', 'instagram', 'tiktok'];
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
        // Simplified - allow users to create channels
        return true;
    }

    /**
     * Get maximum allowed channels for user.
     */
    public function getMaxChannels(): int
    {
        // Simplified - allow unlimited channels for now
        return 999;
    }

    /**
     * Check if user has active subscription.
     */
    public function hasActiveSubscription(): bool
    {
        // Simplified - all users are considered active for now
        return true;
    }

    /**
     * Get the current subscription plan.
     */
    public function getCurrentPlan(): string
    {
        // Simplified - all users are on free plan for now
        return 'free';
    }

    /**
     * Calculate monthly cost for user's subscription.
     */
    public function getMonthlyCost(): float
    {
        // Simplified - no cost for now
        return 0.00;
    }
}
