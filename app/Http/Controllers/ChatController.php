<?php

namespace App\Http\Controllers;

use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class ChatController extends Controller
{
    /**
     * Show chat page for user.
     */
    public function index(): Response
    {
        $user = Auth::user();
        
        $messages = ChatMessage::where('user_id', $user->id)
            ->with('adminUser:id,name')
            ->orderBy('created_at', 'asc')
            ->get();

        // Mark user's unread admin messages as read
        ChatMessage::where('user_id', $user->id)
            ->where('is_admin_message', true)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return Inertia::render('Chat', [
            'messages' => $messages,
            'user' => $user,
        ]);
    }

    /**
     * Store new chat message from user.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $message = ChatMessage::create([
            'user_id' => Auth::id(),
            'message' => $request->message,
            'is_admin_message' => false,
        ]);

        // Send email notification to admin
        try {
            $adminEmails = config('mail.admin_emails', ['admin@tikomat.com']);
            foreach ($adminEmails as $adminEmail) {
                Mail::to($adminEmail)->send(new \App\Mail\NewChatMessage($message));
            }
        } catch (\Exception $e) {
            \Log::error('Failed to send chat notification email: ' . $e->getMessage());
        }

        return redirect()->back();
    }
} 