<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ChatMessage extends Model
{
    protected $fillable = [
        'conversation_id',
        'user_id',
        'message',
        'is_from_admin',
        'is_read',
        'read_at',
        'attachments',
        'message_type',
    ];

    protected $casts = [
        'is_from_admin' => 'boolean',
        'is_read' => 'boolean',
        'read_at' => 'datetime',
        'attachments' => 'array',
    ];

    /**
     * Get the conversation this message belongs to.
     */
    public function conversation(): BelongsTo
    {
        return $this->belongsTo(ChatConversation::class, 'conversation_id');
    }

    /**
     * Get the user that sent the message.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for unread messages.
     */
    public function scopeUnread($query)
    {
        return $query->where('is_read', false);
    }

    /**
     * Scope for admin messages.
     */
    public function scopeFromAdmin($query)
    {
        return $query->where('is_from_admin', true);
    }

    /**
     * Scope for user messages.
     */
    public function scopeFromUser($query)
    {
        return $query->where('is_from_admin', false);
    }

    /**
     * Mark message as read.
     */
    public function markAsRead(): void
    {
        $this->update([
            'is_read' => true,
            'read_at' => now(),
        ]);
    }

    /**
     * Check if message is from admin.
     */
    public function isFromAdmin(): bool
    {
        return $this->is_from_admin;
    }

    /**
     * Check if message is from user.
     */
    public function isFromUser(): bool
    {
        return !$this->is_from_admin;
    }

    /**
     * Get formatted message time.
     */
    public function getFormattedTimeAttribute(): string
    {
        return $this->created_at->format('H:i');
    }

    /**
     * Get display name for message sender.
     */
    public function getSenderNameAttribute(): string
    {
        if ($this->is_from_admin) {
            return 'Support Team';
        }
        
        return $this->user->name;
    }
} 