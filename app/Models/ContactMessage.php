<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContactMessage extends Model
{
    protected $fillable = [
        'first_name',
        'last_name',
        'email',
        'subject',
        'message',
        'status',
        'admin_notes',
        'read_at',
        'replied_at',
    ];

    protected $casts = [
        'admin_notes' => 'array',
        'read_at' => 'datetime',
        'replied_at' => 'datetime',
    ];

    /**
     * Get the full name of the contact.
     */
    public function getFullNameAttribute(): string
    {
        return $this->first_name . ' ' . $this->last_name;
    }

    /**
     * Check if the message has been read.
     */
    public function isRead(): bool
    {
        return $this->status !== 'unread';
    }

    /**
     * Check if the message has been replied to.
     */
    public function isReplied(): bool
    {
        return !is_null($this->replied_at);
    }

    /**
     * Mark the message as read.
     */
    public function markAsRead(): void
    {
        $this->update([
            'status' => 'read',
            'read_at' => now(),
        ]);
    }

    /**
     * Mark the message as replied.
     */
    public function markAsReplied(): void
    {
        $this->update([
            'status' => 'replied',
            'replied_at' => now(),
        ]);
    }

    /**
     * Scope for unread messages.
     */
    public function scopeUnread($query)
    {
        return $query->where('status', 'unread');
    }

    /**
     * Scope for read messages.
     */
    public function scopeRead($query)
    {
        return $query->where('status', 'read');
    }

    /**
     * Scope for replied messages.
     */
    public function scopeReplied($query)
    {
        return $query->where('status', 'replied');
    }
} 