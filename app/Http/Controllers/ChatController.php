<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use App\Models\ChatConversation;
use App\Events\NewChatMessage;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    /**
     * Show chat page for user.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        
        // Get all conversations for this user
        $conversations = ChatConversation::where('user_id', $user->id)
            ->orderBy('last_message_at', 'desc')
            ->orderBy('created_at', 'desc')
            ->get();

        // Get the active conversation (from URL parameter or most recent)
        $activeConversation = null;
        $messages = [];

        if ($request->conversation_id) {
            $activeConversation = $conversations->where('id', $request->conversation_id)->first();
        }

        // If no specific conversation requested or found, get the most recent active one
        if (!$activeConversation) {
            $activeConversation = $conversations->whereNotIn('status', ['closed'])->first() 
                ?? $conversations->first();
        }

        // If still no conversation, create a new one
        if (!$activeConversation) {
            $activeConversation = ChatConversation::create([
                'user_id' => $user->id,
                'status' => 'waiting'
            ]);
            $conversations = $conversations->prepend($activeConversation);
        }

        // Get messages for the active conversation
        if ($activeConversation) {
            $messages = $activeConversation->messages()
                ->with('user:id,name')
                ->orderBy('created_at', 'asc')
                ->get();

            // Mark messages as read for user
            $activeConversation->markAsReadForUser();
        }

        return Inertia::render('Chat', [
            'conversations' => $conversations,
            'activeConversation' => $activeConversation,
            'messages' => $messages,
            'user' => $user,
        ]);
    }

    /**
     * Create a new conversation.
     */
    public function createConversation(Request $request)
    {
        $request->validate([
            'subject' => 'nullable|string|max:255',
        ]);

        $user = Auth::user();

        try {
            $conversation = ChatConversation::create([
                'user_id' => $user->id,
                'status' => 'waiting',
                'subject' => $request->subject,
            ]);

            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'success' => true,
                    'conversation' => $conversation
                ]);
            }

            return redirect()->route('chat.index', ['conversation_id' => $conversation->id])
                ->with('success', 'New conversation started');

        } catch (\Exception $e) {
            \Log::error('Failed to create conversation: ' . $e->getMessage());
            
            if ($request->wantsJson() || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to create conversation'
                ], 500);
            }

            return redirect()->back()->withErrors(['error' => 'Failed to create conversation']);
        }
    }

    /**
     * Store new chat message from user.
     */
    public function store(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'conversation_id' => 'nullable|exists:chat_conversations,id',
        ]);

        $user = Auth::user();

        try {
            DB::beginTransaction();

            // Get or create conversation
            $conversation = null;
            if ($request->conversation_id) {
                $conversation = ChatConversation::where('id', $request->conversation_id)
                    ->where('user_id', $user->id)
                    ->first();
            }

            if (!$conversation) {
                // Create a new conversation if none specified or found
                $conversation = ChatConversation::create([
                    'user_id' => $user->id,
                    'status' => 'waiting'
                ]);
            }

            // Create the message
            $message = ChatMessage::create([
                'conversation_id' => $conversation->id,
                'user_id' => $user->id,
                'message' => $request->message,
                'is_from_admin' => false,
            ]);

            // Update conversation
            $conversation->updateLastMessageTime();
            $conversation->incrementUnreadForAdmin();

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
            \Log::error('Failed to send chat message: ' . $e->getMessage());
            
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
     * Get messages for a conversation.
     */
    public function getMessages(Request $request): JsonResponse
    {
        $user = Auth::user();
        $conversation = ChatConversation::where('user_id', $user->id)->first();

        if (!$conversation) {
            return response()->json(['messages' => []]);
        }

        $messages = $conversation->messages()
            ->with('user:id,name')
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark as read
        $conversation->markAsReadForUser();

        return response()->json([
            'messages' => $messages,
            'conversation' => $conversation
        ]);
    }

    /**
     * Mark conversation as read for user.
     */
    public function markAsRead(Request $request): JsonResponse
    {
        $user = Auth::user();
        $conversation = ChatConversation::where('user_id', $user->id)->first();

        if ($conversation) {
            $conversation->markAsReadForUser();
        }

        return response()->json(['success' => true]);
    }

    /**
     * Poll for new messages (real-time updates).
     */
    public function pollMessages(Request $request): JsonResponse
    {
        $user = Auth::user();
        $conversationId = $request->conversation_id;
        $lastMessageId = $request->last_message_id ?? 0;

        if (!$conversationId) {
            return response()->json(['messages' => [], 'conversation' => null]);
        }

        $conversation = ChatConversation::where('id', $conversationId)
            ->where('user_id', $user->id)
            ->first();

        if (!$conversation) {
            return response()->json(['messages' => [], 'conversation' => null]);
        }

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

        // Mark new messages as read
        if ($newMessages->count() > 0) {
            $conversation->markAsReadForUser();
        }

        return response()->json([
            'messages' => $newMessages,
            'conversation' => $conversation,
            'unread_count' => $conversation->unread_count_user
        ]);
    }
} 