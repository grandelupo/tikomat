<?php

namespace App\Http\Controllers;

use App\Models\Channel;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ChannelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        
        $channels = $user->channels()
            ->withCount(['socialAccounts', 'videos'])
            ->orderBy('is_default', 'desc')
            ->orderBy('created_at', 'asc')
            ->get();

        return Inertia::render('Channels/Index', [
            'channels' => $channels,
            'canCreateChannel' => $user->canCreateChannel(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $user = $request->user();
        
        if (!$user->canCreateChannel()) {
            return redirect()->route('dashboard')
                ->with('error', 'You have reached the maximum number of channels for your plan.');
        }

        return Inertia::render('Channels/Create', [
            'allowedPlatforms' => $user->getAllowedPlatforms(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $user = $request->user();
        
        if (!$user->canCreateChannel()) {
            return redirect()->route('dashboard')
                ->with('error', 'You have reached the maximum number of channels for your plan.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'default_platforms' => 'array',
            'default_platforms.*' => 'in:youtube,instagram,tiktok,facebook,snapchat,pinterest,x',
        ]);

        // Filter platforms based on user's subscription
        $allowedPlatforms = $user->getAllowedPlatforms();
        $defaultPlatforms = array_intersect($validated['default_platforms'] ?? [], $allowedPlatforms);

        $channel = $user->channels()->create([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'default_platforms' => $defaultPlatforms,
            'is_default' => false,
        ]);

        return redirect()->route('channels.show', $channel->slug)
            ->with('success', 'Channel created successfully!');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Request $request, Channel $channel)
    {
        // Ensure user owns this channel
        if ($channel->user_id !== $request->user()->id) {
            abort(403);
        }

        return Inertia::render('Channels/Edit', [
            'channel' => $channel,
            'allowedPlatforms' => $request->user()->getAllowedPlatforms(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Channel $channel)
    {
        // Ensure user owns this channel
        if ($channel->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'default_platforms' => 'array',
            'default_platforms.*' => 'in:youtube,instagram,tiktok,facebook,snapchat,pinterest,x',
        ]);

        // Filter platforms based on user's subscription
        $allowedPlatforms = $request->user()->getAllowedPlatforms();
        $defaultPlatforms = array_intersect($validated['default_platforms'] ?? [], $allowedPlatforms);

        $channel->update([
            'name' => $validated['name'],
            'description' => $validated['description'],
            'default_platforms' => $defaultPlatforms,
        ]);

        return redirect()->route('channels.show', $channel->slug)
            ->with('success', 'Channel updated successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Channel $channel)
    {
        // Ensure user owns this channel
        if ($channel->user_id !== $request->user()->id) {
            abort(403);
        }

        // Prevent deletion of default channel
        if ($channel->is_default) {
            return redirect()->route('dashboard')
                ->with('error', 'Cannot delete the default channel.');
        }

        // Check if channel has videos
        if ($channel->videos()->count() > 0) {
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'Cannot delete channel with existing videos. Please delete all videos first.');
        }

        $channel->delete();

        return redirect()->route('dashboard')
            ->with('success', 'Channel deleted successfully!');
    }
}
