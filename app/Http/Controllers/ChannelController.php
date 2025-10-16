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
        $this->authorize('create', Channel::class);

        return Inertia::render('Channels/Create', [
            'allowedPlatforms' => $request->user()->getAllowedPlatforms(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Channel::class);
        
        $user = $request->user();

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
        // Channel ownership is already ensured by route model binding

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
        // Channel ownership is already ensured by route model binding

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
        // Authorize the deletion
        $this->authorize('delete', $channel);
        
        // Channel ownership is already ensured by route model binding
        \Log::info('Channel deletion attempt', [
            'user_id' => $request->user()->id,
            'channel_id' => $channel->id,
            'channel_slug' => $channel->slug,
            'is_default' => $channel->is_default,
            'videos_count' => $channel->videos()->count(),
        ]);

        // Still check if channel can be deleted (not default channel)
        if ($channel->is_default) {
            \Log::warning('Attempted to delete default channel', [
                'user_id' => $request->user()->id,
                'channel_id' => $channel->id,
            ]);
            return redirect()->route('dashboard')
                ->with('error', 'Cannot delete the default channel.');
        }

        // Check if channel has videos
        $videosCount = $channel->videos()->count();
        if ($videosCount > 0) {
            \Log::warning('Attempted to delete channel with videos', [
                'user_id' => $request->user()->id,
                'channel_id' => $channel->id,
                'videos_count' => $videosCount,
            ]);
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'Cannot delete channel with existing videos. Please delete all videos first.');
        }

        try {
            $channel->delete();
            \Log::info('Channel deleted successfully', [
                'user_id' => $request->user()->id,
                'channel_id' => $channel->id,
                'channel_slug' => $channel->slug,
            ]);

            return redirect()->route('dashboard')
                ->with('success', 'Channel deleted successfully!');
        } catch (\Exception $e) {
            \Log::error('Failed to delete channel', [
                'user_id' => $request->user()->id,
                'channel_id' => $channel->id,
                'error' => $e->getMessage(),
            ]);
            
            return redirect()->route('channels.show', $channel->slug)
                ->with('error', 'Failed to delete channel. Please try again.');
        }
    }
}
