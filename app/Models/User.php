<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Cashier\Billable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, Billable;

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
        'notifications',
        'notification_settings',
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
            'notifications' => 'array',
            'notification_settings' => 'array',
            'is_admin' => 'boolean',
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
        // All users get access to all platforms on their channels
        return ['youtube', 'instagram', 'tiktok', 'facebook', 'snapchat', 'pinterest', 'x'];
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
        // Only pro users get multiple channels
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
        
        // Free users (including trial users) get only 1 channel
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
     * Check if user is in free trial period (30 days from registration).
     */
    public function isInFreeTrialPeriod(): bool
    {
        $trialEndDate = $this->created_at->addDays(30);
        return now()->lt($trialEndDate);
    }

    /**
     * Get days remaining in free trial.
     */
    public function getFreeTrialDaysRemaining(): int
    {
        if (!$this->isInFreeTrialPeriod()) {
            return 0;
        }
        
        $trialEndDate = $this->created_at->addDays(30);
        return max(0, now()->diffInDays($trialEndDate, false));
    }

    /**
     * Get the current subscription plan.
     */
    public function getCurrentPlan(): string
    {
        if ($this->hasActiveSubscription()) {
            return 'pro';
        }
        
        if ($this->isInFreeTrialPeriod()) {
            return 'free_trial';
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
        $additionalCost = $additionalChannels * 0.10 * 30; // $0.10 per day per additional channel

        return $baseCost + $additionalCost;
    }

    /*
     * Calculate daily cost for user's subscription.
     */
    public function getDailyCost(): float
    {
        return $this->getMonthlyCost() / 30;
    }

    /**
     * Get notifications for this user.
     */
    public function getNotifications(): array
    {
        return $this->notifications ?? [];
    }

    /**
     * Add a notification.
     */
    public function addNotification(string $type, string $title, string $message, array $data = []): void
    {
        $notifications = $this->getNotifications();
        $notifications[] = [
            'id' => uniqid(),
            'type' => $type, // 'error', 'warning', 'success', 'info'
            'title' => $title,
            'message' => $message,
            'data' => $data,
            'read' => false,
            'created_at' => now()->toISOString(),
        ];
        
        $this->update(['notifications' => $notifications]);
    }

    /**
     * Mark notification as read.
     */
    public function markNotificationAsRead(string $notificationId): void
    {
        $notifications = $this->getNotifications();
        $notifications = array_map(function ($notification) use ($notificationId) {
            if ($notification['id'] === $notificationId) {
                $notification['read'] = true;
            }
            return $notification;
        }, $notifications);
        
        $this->update(['notifications' => $notifications]);
    }

    /**
     * Mark all notifications as read.
     */
    public function markAllNotificationsAsRead(): void
    {
        $notifications = $this->getNotifications();
        $notifications = array_map(function ($notification) {
            $notification['read'] = true;
            return $notification;
        }, $notifications);
        
        $this->update(['notifications' => $notifications]);
    }

    /**
     * Clear all notifications.
     */
    public function clearNotifications(): void
    {
        $this->update(['notifications' => []]);
    }

    /**
     * Get unread notifications count.
     */
    public function getUnreadNotificationsCount(): int
    {
        $notifications = $this->getNotifications();
        return count(array_filter($notifications, fn($n) => !$n['read']));
    }

    /**
     * Get notification settings.
     */
    public function getNotificationSettings(): array
    {
        return $this->notification_settings ?? [
            'ai_errors' => true,
            'upload_errors' => true,
            'platform_errors' => true,
            'success_notifications' => false,
            'email_notifications' => false,
        ];
    }

    /**
     * Update notification settings.
     */
    public function updateNotificationSettings(array $settings): void
    {
        $this->update(['notification_settings' => array_merge($this->getNotificationSettings(), $settings)]);
    }

    /**
     * Check if user should receive notifications for a specific type.
     */
    public function shouldReceiveNotification(string $type): bool
    {
        $settings = $this->getNotificationSettings();
        
        return match ($type) {
            'ai_errors' => $settings['ai_errors'] ?? true,
            'upload_errors' => $settings['upload_errors'] ?? true,
            'platform_errors' => $settings['platform_errors'] ?? true,
            'success_notifications' => $settings['success_notifications'] ?? false,
            default => true,
        };
    }

    /**
     * Add a job failure notification.
     */
    public function addJobFailureNotification(string $jobType, string $title, string $message, array $context = []): void
    {
        if (!$this->shouldReceiveNotification($this->getNotificationTypeForJob($jobType))) {
            return;
        }
        
        $this->addNotification('error', $title, $message, array_merge($context, [
            'job_type' => $jobType,
            'timestamp' => now()->toISOString(),
        ]));
    }

    /**
     * Get notification type for a specific job.
     */
    private function getNotificationTypeForJob(string $jobType): string
    {
        return match ($jobType) {
            'ProcessInstantUploads', 'ProcessInstantUploadWithAI' => 'ai_errors',
            'ProcessVideoUploads', 'UploadVideoToYoutube', 'UploadVideoToInstagram', 
            'UploadVideoToTiktok', 'UploadVideoToFacebook', 'UploadVideoToSnapchat', 
            'UploadVideoToPinterest', 'UploadVideoToX' => 'upload_errors',
            default => 'ai_errors',
        };
    }

    /**
     * Check if user is admin.
     */
    public function isAdmin(): bool
    {
        return $this->is_admin === true;
    }

    /**
     * Check if user has completed a specific tutorial.
     */
    public function hasCompletedTutorial(string $tutorialName): bool
    {
        return in_array($tutorialName, $this->completed_tutorials ?? []);
    }

    /**
     * Mark a tutorial as completed.
     */
    public function markTutorialAsCompleted(string $tutorialName): void
    {
        $completed = $this->completed_tutorials ?? [];
        if (!in_array($tutorialName, $completed)) {
            $completed[] = $tutorialName;
            $this->update(['completed_tutorials' => $completed]);
        }
    }
}
