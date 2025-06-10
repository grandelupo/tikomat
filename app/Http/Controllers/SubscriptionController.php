<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Cashier\Exceptions\IncompletePayment;

class SubscriptionController extends Controller
{
    /**
     * Show subscription plans.
     */
    public function plans(Request $request): Response
    {
        $user = $request->user();
        
        return Inertia::render('Subscription/Plans', [
            'user' => [
                'current_plan' => $user->getCurrentPlan(),
                'has_subscription' => $user->hasActiveSubscription(),
                'monthly_cost' => $user->getMonthlyCost(),
                'channels_count' => $user->channels()->count(),
                'max_channels' => $user->getMaxChannels(),
            ],
            'plans' => [
                'free' => [
                    'name' => 'Free',
                    'price' => 0,
                    'features' => [
                        '1 Channel',
                        'YouTube Publishing',
                        'Basic Video Upload',
                        'Community Support'
                    ]
                ],
                'pro' => [
                    'name' => 'Pro',
                    'price' => 18.00, // $0.60 * 30 days
                    'features' => [
                        '3 Channels',
                        'All Platforms (YouTube, Instagram, TikTok)',
                        'Video Thumbnails',
                        'Priority Support',
                        'Advanced Scheduling'
                    ]
                ]
            ]
        ]);
    }

    /**
     * Create a subscription checkout session.
     */
    public function checkout(Request $request): RedirectResponse
    {
        $user = $request->user();
        
        // If user already has a subscription, redirect to billing
        if ($user->hasActiveSubscription()) {
            return redirect()->route('subscription.billing')
                ->with('info', 'You already have an active subscription.');
        }

        try {
            // Create Stripe checkout session
            $checkout = $user->newSubscription('default', 'price_pro_monthly')
                ->checkout([
                    'success_url' => route('subscription.success'),
                    'cancel_url' => route('subscription.plans'),
                    'metadata' => [
                        'user_id' => $user->id,
                    ],
                ]);

            return redirect($checkout->url);
        } catch (\Exception $e) {
            \Log::error('Stripe checkout failed: ' . $e->getMessage());
            
            return redirect()->route('subscription.plans')
                ->with('error', 'Unable to create checkout session. Please try again.');
        }
    }

    /**
     * Handle successful subscription.
     */
    public function success(Request $request): Response
    {
        return Inertia::render('Subscription/Success', [
            'user' => [
                'current_plan' => $request->user()->getCurrentPlan(),
                'monthly_cost' => $request->user()->getMonthlyCost(),
            ]
        ]);
    }

    /**
     * Show billing portal.
     */
    public function billing(Request $request): RedirectResponse
    {
        $user = $request->user();
        
        if (!$user->hasActiveSubscription()) {
            return redirect()->route('subscription.plans')
                ->with('error', 'You need an active subscription to access billing.');
        }

        try {
            return $user->redirectToBillingPortal(route('dashboard'));
        } catch (\Exception $e) {
            \Log::error('Billing portal redirect failed: ' . $e->getMessage());
            
            return redirect()->route('dashboard')
                ->with('error', 'Unable to access billing portal. Please try again.');
        }
    }

    /**
     * Cancel subscription.
     */
    public function cancel(Request $request): RedirectResponse
    {
        $user = $request->user();
        
        if (!$user->hasActiveSubscription()) {
            return redirect()->route('subscription.plans')
                ->with('error', 'You do not have an active subscription.');
        }

        try {
            $user->subscription('default')->cancel();
            
            return redirect()->route('dashboard')
                ->with('success', 'Your subscription will be cancelled at the end of the current billing period.');
        } catch (\Exception $e) {
            \Log::error('Subscription cancellation failed: ' . $e->getMessage());
            
            return redirect()->route('dashboard')
                ->with('error', 'Unable to cancel subscription. Please try again.');
        }
    }

    /**
     * Resume cancelled subscription.
     */
    public function resume(Request $request): RedirectResponse
    {
        $user = $request->user();
        $subscription = $user->subscription('default');
        
        if (!$subscription || !$subscription->cancelled()) {
            return redirect()->route('dashboard')
                ->with('error', 'No cancelled subscription found.');
        }

        try {
            $subscription->resume();
            
            return redirect()->route('dashboard')
                ->with('success', 'Your subscription has been resumed.');
        } catch (\Exception $e) {
            \Log::error('Subscription resume failed: ' . $e->getMessage());
            
            return redirect()->route('dashboard')
                ->with('error', 'Unable to resume subscription. Please try again.');
        }
    }

    /**
     * Add additional channel.
     */
    public function addChannel(Request $request): RedirectResponse
    {
        $user = $request->user();
        
        if (!$user->hasActiveSubscription()) {
            return redirect()->route('subscription.plans')
                ->with('error', 'You need a Pro subscription to add additional channels.');
        }

        if ($user->canCreateChannel()) {
            return redirect()->route('channels.create')
                ->with('info', 'You can create additional channels with your current plan.');
        }

        try {
            // Add additional channel to subscription
            $subscription = $user->subscription('default');
            $subscription->incrementQuantity(1, 'price_additional_channel');
            
            return redirect()->route('channels.create')
                ->with('success', 'Additional channel added to your subscription! You can now create a new channel.');
        } catch (\Exception $e) {
            \Log::error('Failed to add additional channel: ' . $e->getMessage());
            
            return redirect()->route('dashboard')
                ->with('error', 'Unable to add additional channel. Please try again.');
        }
    }


} 