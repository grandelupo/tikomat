<?php

namespace App\Events;

use App\Models\ChatMessage;
use App\Models\ChatConversation;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewChatMessage implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $conversation;

    /**
     * Create a new event instance.
     */
    public function __construct(ChatMessage $message, ChatConversation $conversation)
    {
        $this->message = $message;
        $this->conversation = $conversation;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat.' . $this->conversation->id),
            new PrivateChannel('admin.chat'),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'new.message';
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'message' => [
                'id' => $this->message->id,
                'conversation_id' => $this->message->conversation_id,
                'user_id' => $this->message->user_id,
                'message' => $this->message->message,
                'is_from_admin' => $this->message->is_from_admin,
                'sender_name' => $this->message->sender_name,
                'formatted_time' => $this->message->formatted_time,
                'created_at' => $this->message->created_at,
            ],
            'conversation' => [
                'id' => $this->conversation->id,
                'status' => $this->conversation->status,
                'unread_count_user' => $this->conversation->unread_count_user,
                'unread_count_admin' => $this->conversation->unread_count_admin,
                'last_message_at' => $this->conversation->last_message_at,
            ],
            'user' => [
                'id' => $this->conversation->user->id,
                'name' => $this->conversation->user->name,
            ],
        ];
    }
}
