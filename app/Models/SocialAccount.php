<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SocialAccount extends Model
{
    protected $fillable = [
        'user_id',
        'channel_id',
        'platform',
        'access_token',
        'refresh_token',
        'token_expires_at',
        'facebook_page_id',
        'facebook_page_name',
        'facebook_page_access_token',
        'profile_name',
        'profile_avatar_url',
        'profile_username',
        'platform_channel_id',
        'platform_channel_name',
        'platform_channel_handle',
        'platform_channel_url',
        'platform_channel_data',
        'is_platform_channel_specific',
    ];

    protected function casts(): array
    {
        return [
            'token_expires_at' => 'datetime',
            'access_token' => 'encrypted',
            'refresh_token' => 'encrypted',
            'facebook_page_access_token' => 'encrypted',
            'platform_channel_data' => 'array',
            'is_platform_channel_specific' => 'boolean',
        ];
    }

    /**
     * Get the user that owns the social account.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the channel that owns the social account.
     */
    public function channel(): BelongsTo
    {
        return $this->belongsTo(Channel::class);
    }

    /**
     * Check if the token is expired.
     */
    public function isTokenExpired(): bool
    {
        return $this->token_expires_at && $this->token_expires_at->isPast();
    }

    /**
     * Get the display name for this social account connection.
     */
    public function getDisplayName(): string
    {
        // Prioritize platform-specific channel name
        if ($this->is_platform_channel_specific && $this->platform_channel_name) {
            return $this->platform_channel_name;
        }

        // Fall back to profile name or username
        return $this->profile_name 
            ?? $this->profile_username 
            ?? $this->facebook_page_name 
            ?? 'Connected Account';
    }

    /**
     * Get the display handle/username for this social account connection.
     */
    public function getDisplayHandle(): ?string
    {
        return $this->platform_channel_handle 
            ?? $this->profile_username 
            ?? null;
    }

    /**
     * Get the URL for this platform channel/account.
     */
    public function getPlatformUrl(): ?string
    {
        return $this->platform_channel_url;
    }

    /**
     * Check if this is a platform-specific channel connection.
     */
    public function isPlatformChannelSpecific(): bool
    {
        return $this->is_platform_channel_specific && !empty($this->platform_channel_id);
    }

    /**
     * Get platform-specific channel metadata.
     */
    public function getPlatformChannelData(): array
    {
        return $this->platform_channel_data ?? [];
    }

    /**
     * Check if this social account is already connected to another user.
     */
    public static function isAccountAlreadyConnected(string $platform, string $platformAccountId, ?int $excludeUserId = null): bool
    {
        $query = self::where('platform', $platform)
            ->where('platform_channel_id', $platformAccountId);
        
        if ($excludeUserId) {
            $query->where('user_id', '!=', $excludeUserId);
        }
        
        return $query->exists();
    }

    /**
     * Check if this social account is already connected to another user by profile username.
     */
    public static function isAccountAlreadyConnectedByUsername(string $platform, string $username, ?int $excludeUserId = null): bool
    {
        $query = self::where('platform', $platform)
            ->where('profile_username', $username);
        
        if ($excludeUserId) {
            $query->where('user_id', '!=', $excludeUserId);
        }
        
        return $query->exists();
    }

    /**
     * Check if this social account is already connected to another user by Facebook page ID.
     */
    public static function isFacebookPageAlreadyConnected(string $facebookPageId, ?int $excludeUserId = null): bool
    {
        $query = self::where('platform', 'facebook')
            ->where('facebook_page_id', $facebookPageId);
        
        if ($excludeUserId) {
            $query->where('user_id', '!=', $excludeUserId);
        }
        
        return $query->exists();
    }

    /**
     * Get the user who owns this social account (for admin bypass).
     */
    public static function getAccountOwner(string $platform, string $platformAccountId): ?User
    {
        $socialAccount = self::where('platform', $platform)
            ->where('platform_channel_id', $platformAccountId)
            ->with('user')
            ->first();
        
        return $socialAccount?->user;
    }

    /**
     * Get the user who owns this social account by username (for admin bypass).
     */
    public static function getAccountOwnerByUsername(string $platform, string $username): ?User
    {
        $socialAccount = self::where('platform', $platform)
            ->where('profile_username', $username)
            ->with('user')
            ->first();
        
        return $socialAccount?->user;
    }

    /**
     * Get the user who owns this Facebook page (for admin bypass).
     */
    public static function getFacebookPageOwner(string $facebookPageId): ?User
    {
        $socialAccount = self::where('platform', 'facebook')
            ->where('facebook_page_id', $facebookPageId)
            ->with('user')
            ->first();
        
        return $socialAccount?->user;
    }

    /**
     * Clean up duplicate social accounts for a user and platform.
     * This is used as a fallback when the old unique constraint still exists.
     */
    public static function cleanupDuplicatesForUser(int $userId, string $platform): int
    {
        $accounts = self::where('user_id', $userId)
            ->where('platform', $platform)
            ->orderBy('created_at', 'desc')
            ->get();
        
        if ($accounts->count() <= 1) {
            return 0; // No duplicates
        }
        
        // Keep the most recent account, delete the rest
        $accountsToDelete = $accounts->skip(1);
        $deletedCount = $accountsToDelete->count();
        
        foreach ($accountsToDelete as $account) {
            $account->delete();
        }
        
        return $deletedCount;
    }
}
