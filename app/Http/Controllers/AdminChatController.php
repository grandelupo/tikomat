<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\ChatConversation;
use App\Events\NewChatMessage;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminChatController extends Controller
{
    /**
     * Show admin chat dashboard.
     */
    public function index(): Response
    {
        $conversations = ChatConversation::with(['user', 'latestMessage'])
            ->orderBy('last_message_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        $stats = [
            'total' => ChatConversation::count(),
            'waiting' => ChatConversation::waiting()->count(),
            'active' => ChatConversation::active()->count(),
            'closed' => ChatConversation::closed()->count(),
            'unread_messages' => ChatConversation::sum('unread_count_admin'),
        ];

        return Inertia::render('Admin/Chat', [
            'conversations' => $conversations,
            'stats' => $stats,
        ]);
    }

    /**
     * Show specific conversation.
     */
    public function show(ChatConversation $conversation): Response
    {
        $conversation->load(['user', 'assignedAdmin']);
        
        $messages = $conversation->messages()
            ->with('user:id,name')
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark messages as read for admin
        $conversation->markAsReadForAdmin();

        // If conversation is waiting, assign current admin and activate
        if ($conversation->isWaiting()) {
            $conversation->assignAdmin(Auth::user());
        }

        return Inertia::render('Admin/ChatConversation', [
            'conversation' => $conversation,
            'messages' => $messages,
            'admin' => Auth::user(),
        ]);
    }

    /**
     * Send message as admin.
     */
    public function sendMessage(Request $request, ChatConversation $conversation)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $admin = Auth::user();

        try {
            DB::beginTransaction();

            // Assign admin if not already assigned
            if ($conversation->isWaiting() || !$conversation->assigned_admin_id) {
                $conversation->assignAdmin($admin);
            }

            // Create the message
            $message = ChatMessage::create([
                'conversation_id' => $conversation->id,
                'user_id' => $admin->id,
                'message' => $request->message,
                'is_from_admin' => true,
            ]);

            // Update conversation
            $conversation->updateLastMessageTime();
            $conversation->incrementUnreadForUser();

            // Load relationships for broadcasting
            $message->load('user');
            $conversation->load('user');

            // Broadcast the message
            broadcast(new NewChatMessage($message, $conversation))->toOthers();

            DB::commit();

            // For AJAX requests, return JSON
            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $message,
                    'conversation' => $conversation
                ]);
            }

            // For regular form submissions, redirect back
            return redirect()->back()->with('success', 'Message sent successfully');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Failed to send admin message: ' . $e->getMessage());
            
            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to send message'
                ], 500);
            }

            return redirect()->back()->withErrors(['message' => 'Failed to send message']);
        }
    }

    /**
     * Get messages for a conversation (API endpoint).
     */
    public function getMessages(ChatConversation $conversation): JsonResponse
    {
        $messages = $conversation->messages()
            ->with('user:id,name')
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark as read for admin
        $conversation->markAsReadForAdmin();

        return response()->json([
            'messages' => $messages,
            'conversation' => $conversation
        ]);
    }

    /**
     * Close conversation.
     */
    public function close(Request $request, ChatConversation $conversation): JsonResponse
    {
        $request->validate([
            'reason' => 'nullable|string|max:500',
        ]);

        try {
            $conversation->close($request->reason);

            // Optionally send a system message
            if ($request->reason) {
                ChatMessage::create([
                    'conversation_id' => $conversation->id,
                    'user_id' => Auth::id(),
                    'message' => "Conversation closed: " . $request->reason,
                    'is_from_admin' => true,
                    'message_type' => 'system',
                ]);
            }

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            \Log::error('Failed to close conversation: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to close conversation'
            ], 500);
        }
    }

    /**
     * Reopen conversation.
     */
    public function reopen(ChatConversation $conversation): JsonResponse
    {
        try {
            $conversation->update([
                'status' => 'active',
                'closed_at' => null,
                'closing_reason' => null,
            ]);

            // Send system message
            ChatMessage::create([
                'conversation_id' => $conversation->id,
                'user_id' => Auth::id(),
                'message' => "Conversation reopened by admin",
                'is_from_admin' => true,
                'message_type' => 'system',
            ]);

            return response()->json(['success' => true]);

        } catch (\Exception $e) {
            \Log::error('Failed to reopen conversation: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to reopen conversation'
            ], 500);
        }
    }

    /**
     * Get chat statistics for dashboard.
     */
    public function getStats(): JsonResponse
    {
        $stats = [
            'total_conversations' => ChatConversation::count(),
            'waiting_conversations' => ChatConversation::waiting()->count(),
            'active_conversations' => ChatConversation::active()->count(),
            'closed_conversations' => ChatConversation::closed()->count(),
            'total_unread_messages' => ChatConversation::sum('unread_count_admin'),
            'messages_today' => ChatMessage::whereDate('created_at', today())->count(),
            'new_conversations_today' => ChatConversation::whereDate('created_at', today())->count(),
        ];

        return response()->json($stats);
    }

    /**
     * Poll for new messages in a conversation (real-time updates).
     */
    public function pollMessages(ChatConversation $conversation, Request $request): JsonResponse
    {
        $lastMessageId = $request->last_message_id ?? 0;

        // Get new messages since last poll
        $newMessages = $conversation->messages()
            ->where('id', '>', $lastMessageId)
            ->with('user:id,name')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($message) {
                return [
                    'id' => $message->id,
                    'conversation_id' => $message->conversation_id,
                    'user_id' => $message->user_id,
                    'message' => $message->message,
                    'is_from_admin' => $message->is_from_admin,
                    'sender_name' => $message->user->name,
                    'formatted_time' => $message->created_at->format('g:i A'),
                    'created_at' => $message->created_at->toISOString(),
                    'user' => $message->user
                ];
            });

        // Mark new messages as read for admin
        if ($newMessages->count() > 0) {
            $conversation->markAsReadForAdmin();
        }

        return response()->json([
            'messages' => $newMessages,
            'conversation' => $conversation->fresh(['user']),
            'unread_count' => $conversation->unread_count_admin
        ]);
    }
}
