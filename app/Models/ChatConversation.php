<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ChatConversation extends Model
{
    protected $fillable = [
        'user_id',
        'assigned_admin_id',
        'status',
        'subject',
        'unread_count_user',
        'unread_count_admin',
        'last_message_at',
        'admin_joined_at',
        'closed_at',
        'closing_reason',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
        'admin_joined_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    /**
     * Get the user that owns the conversation.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the admin assigned to the conversation.
     */
    public function assignedAdmin(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_admin_id');
    }

    /**
     * Get all messages for this conversation.
     */
    public function messages(): HasMany
    {
        return $this->hasMany(ChatMessage::class, 'conversation_id');
    }

    /**
     * Get the latest message for this conversation.
     */
    public function latestMessage(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(ChatMessage::class, 'conversation_id')->latest();
    }

    /**
     * Scope for waiting conversations.
     */
    public function scopeWaiting($query)
    {
        return $query->where('status', 'waiting');
    }

    /**
     * Scope for active conversations.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for closed conversations.
     */
    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    /**
     * Scope for conversations assigned to a specific admin.
     */
    public function scopeAssignedTo($query, $adminId)
    {
        return $query->where('assigned_admin_id', $adminId);
    }

    /**
     * Check if conversation is waiting for admin.
     */
    public function isWaiting(): bool
    {
        return $this->status === 'waiting';
    }

    /**
     * Check if conversation is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if conversation is closed.
     */
    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    /**
     * Assign admin to conversation and activate it.
     */
    public function assignAdmin(User $admin): void
    {
        $this->update([
            'assigned_admin_id' => $admin->id,
            'status' => 'active',
            'admin_joined_at' => now(),
        ]);
    }

    /**
     * Close the conversation.
     */
    public function close(string $reason = null): void
    {
        $this->update([
            'status' => 'closed',
            'closed_at' => now(),
            'closing_reason' => $reason,
        ]);
    }

    /**
     * Mark messages as read for user.
     */
    public function markAsReadForUser(): void
    {
        $this->messages()
            ->where('is_from_admin', true)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        $this->update(['unread_count_user' => 0]);
    }

    /**
     * Mark messages as read for admin.
     */
    public function markAsReadForAdmin(): void
    {
        $this->messages()
            ->where('is_from_admin', false)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        $this->update(['unread_count_admin' => 0]);
    }

    /**
     * Increment unread count for user.
     */
    public function incrementUnreadForUser(): void
    {
        $this->increment('unread_count_user');
    }

    /**
     * Increment unread count for admin.
     */
    public function incrementUnreadForAdmin(): void
    {
        $this->increment('unread_count_admin');
    }

    /**
     * Update last message timestamp.
     */
    public function updateLastMessageTime(): void
    {
        $this->update(['last_message_at' => now()]);
    }

    /**
     * Get conversation title for display.
     */
    public function getDisplayTitleAttribute(): string
    {
        return $this->subject ?: "Chat with {$this->user->name}";
    }
}
