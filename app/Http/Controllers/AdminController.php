<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ChatMessage;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function __construct()
    {
        $this->middleware(['auth', 'admin']);
    }

    /**
     * Show admin dashboard.
     */
    public function index(): Response
    {
        $stats = [
            'total_users' => User::count(),
            'active_users' => User::where('last_login_at', '>=', now()->subDays(30))->count(),
            'unread_messages' => ChatMessage::where('is_admin_message', false)->where('is_read', false)->count(),
            'recent_users' => User::latest()->limit(5)->get(['id', 'name', 'email', 'created_at']),
        ];

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
        ]);
    }

    /**
     * Show chat interface.
     */
    public function chat(Request $request): Response
    {
        $users = User::whereHas('chatMessages')
            ->withCount(['chatMessages as unread_count' => function ($query) {
                $query->where('is_admin_message', false)->where('is_read', false);
            }])
            ->orderByDesc('unread_count')
            ->orderBy('name')
            ->get(['id', 'name', 'email']);

        $selectedUserId = $request->get('user_id');
        $messages = [];
        
        if ($selectedUserId) {
            $messages = ChatMessage::where('user_id', $selectedUserId)
                ->orderBy('created_at', 'asc')
                ->get();
                
            // Mark admin messages as read
            ChatMessage::where('user_id', $selectedUserId)
                ->where('is_admin_message', false)
                ->where('is_read', false)
                ->update(['is_read' => true]);
        }

        return Inertia::render('Admin/Chat', [
            'users' => $users,
            'messages' => $messages,
            'selectedUserId' => $selectedUserId,
        ]);
    }

    /**
     * Send chat message.
     */
    public function sendMessage(Request $request): RedirectResponse
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'message' => 'required|string|max:1000',
        ]);

        ChatMessage::create([
            'user_id' => $request->user_id,
            'message' => $request->message,
            'is_admin_message' => true,
            'admin_user_id' => Auth::id(),
        ]);

        // Send email notification to user
        $user = User::find($request->user_id);
        try {
            Mail::to($user->email)->send(new \App\Mail\AdminMessageNotification($user, $request->message));
        } catch (\Exception $e) {
            \Log::error('Failed to send admin message notification email: ' . $e->getMessage());
        }

        return redirect()->back();
    }

    /**
     * Login as another user.
     */
    public function loginAsUser(Request $request, User $user): RedirectResponse
    {
        if ($user->id === Auth::id()) {
            return redirect()->back()->with('error', 'Cannot login as yourself.');
        }

        // Store original admin user ID in session
        session(['original_admin_id' => Auth::id()]);
        
        Auth::login($user);
        
        return redirect()->route('dashboard')->with('success', 'Logged in as ' . $user->name);
    }

    /**
     * Return to admin account.
     */
    public function returnToAdmin(): RedirectResponse
    {
        $originalAdminId = session('original_admin_id');
        
        if (!$originalAdminId) {
            return redirect()->route('login');
        }

        $admin = User::find($originalAdminId);
        if (!$admin || !$admin->is_admin) {
            session()->forget('original_admin_id');
            return redirect()->route('login');
        }

        Auth::login($admin);
        session()->forget('original_admin_id');
        
        return redirect()->route('admin.dashboard')->with('success', 'Returned to admin account');
    }

    /**
     * Show users list.
     */
    public function users(Request $request): Response
    {
        $query = User::query();
        
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $users = $query->withCount('chatMessages')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'search' => $request->search,
        ]);
    }

    /**
     * Show contact messages.
     */
    public function contacts(): Response
    {
        $contacts = \App\Models\ContactMessage::with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Admin/Contacts', [
            'contacts' => $contacts,
        ]);
    }

    /**
     * Reply to contact message.
     */
    public function replyToContact(Request $request, \App\Models\ContactMessage $contact): RedirectResponse
    {
        $request->validate([
            'reply' => 'required|string|max:2000',
        ]);

        $contact->update([
            'reply' => $request->reply,
            'replied_at' => now(),
            'replied_by' => Auth::id(),
        ]);

        // Send email reply
        try {
            Mail::to($contact->email)->send(new \App\Mail\ContactReply($contact, $request->reply));
        } catch (\Exception $e) {
            \Log::error('Failed to send contact reply email: ' . $e->getMessage());
        }

        return redirect()->back()->with('success', 'Reply sent successfully');
    }
} 