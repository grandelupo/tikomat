<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
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
            'user' => Auth::user(),
        ]);
    }

    /**
     * Store contact message.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
        ]);

        $contact = ContactMessage::create([
            'user_id' => Auth::id(),
            'name' => $request->name,
            'email' => $request->email,
            'subject' => $request->subject,
            'message' => $request->message,
        ]);

        // Send notification email to admin
        try {
            $adminEmails = config('mail.admin_emails', ['admin@tikomat.com']);
            foreach ($adminEmails as $adminEmail) {
                Mail::to($adminEmail)->send(new \App\Mail\NewContactMessage($contact));
            }
        } catch (\Exception $e) {
            \Log::error('Failed to send contact notification email: ' . $e->getMessage());
        }

        return redirect()->back()->with('success', 'Thank you for your message! We will get back to you soon.');
    }
} 