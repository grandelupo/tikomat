<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use App\Mail\ContactFormSubmitted;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

class ContactController extends Controller
{
    /**
     * Show contact form.
     */
    public function index(): Response
    {
        return Inertia::render('Contact', [
            'auth' => [
                'user' => Auth::user(),
            ],
        ]);
    }

    /**
     * Store contact message.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
        ]);

        try {
            // Create the contact message
            $contactMessage = ContactMessage::create($validated);

            // Send notification email to admin(s)
            $adminEmails = config('mail.admin_emails', [env('PUBLIC_EMAIL', 'admin@tikomat.com')]);
            
            foreach ($adminEmails as $adminEmail) {
                Mail::to($adminEmail)->send(new ContactFormSubmitted($contactMessage));
            }

            return redirect()->back()->with('success', 
                'Thank you for your message! We\'ll get back to you within 24 hours.'
            );

        } catch (\Exception $e) {
            \Log::error('Failed to process contact form: ' . $e->getMessage());
            
            return redirect()->back()->with('error', 
                'Sorry, there was an error sending your message. Please try again or contact us directly at ' . env('PUBLIC_EMAIL', 'support@tikomat.com')
            );
        }
    }

    /**
     * Admin method to view all contact messages.
     */
    public function adminIndex(): Response
    {
        $messages = ContactMessage::latest()
            ->paginate(20);

        return Inertia::render('Admin/ContactMessages', [
            'messages' => $messages,
            'stats' => [
                'total' => ContactMessage::count(),
                'unread' => ContactMessage::unread()->count(),
                'read' => ContactMessage::read()->count(),
                'replied' => ContactMessage::replied()->count(),
            ]
        ]);
    }

    /**
     * Admin method to view a specific contact message.
     */
    public function adminShow(ContactMessage $contactMessage): Response
    {
        // Mark as read when viewed
        if (!$contactMessage->isRead()) {
            $contactMessage->markAsRead();
        }

        return Inertia::render('Admin/ContactMessage', [
            'message' => $contactMessage,
        ]);
    }

    /**
     * Admin method to update message status.
     */
    public function adminUpdate(Request $request, ContactMessage $contactMessage): RedirectResponse
    {
        $validated = $request->validate([
            'status' => 'required|in:unread,read,replied',
            'admin_notes' => 'nullable|array',
        ]);

        $contactMessage->update($validated);

        if ($validated['status'] === 'replied' && !$contactMessage->isReplied()) {
            $contactMessage->markAsReplied();
        }

        return redirect()->back()->with('success', 'Message updated successfully.');
    }
} 