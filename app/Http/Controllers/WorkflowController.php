<?php

namespace App\Http\Controllers;

use App\Models\Workflow;
use App\Models\Channel;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;

class WorkflowController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of workflows.
     */
    public function index(Request $request): Response
    {
        $workflows = Workflow::where('user_id', $request->user()->id)
            ->with('channel')
            ->orderBy('created_at', 'desc')
            ->get();

        $channels = $request->user()->channels()->select('id', 'name', 'slug')->get();

        // Get connected platforms across all channels
        $platforms = collect([
            ['name' => 'youtube', 'label' => 'YouTube', 'connected' => false],
            ['name' => 'instagram', 'label' => 'Instagram', 'connected' => false],
            ['name' => 'tiktok', 'label' => 'TikTok', 'connected' => false],
            ['name' => 'facebook', 'label' => 'Facebook', 'connected' => false],
            ['name' => 'twitter', 'label' => 'Twitter', 'connected' => false],
            ['name' => 'snapchat', 'label' => 'Snapchat', 'connected' => false],
            ['name' => 'pinterest', 'label' => 'Pinterest', 'connected' => false],
        ]);

        // Check which platforms are connected across user's channels
        $connectedPlatforms = $request->user()->channels()
            ->with('socialAccounts')
            ->get()
            ->flatMap(fn($channel) => $channel->socialAccounts->pluck('platform'))
            ->unique()
            ->values();

        $platforms = $platforms->map(function ($platform) use ($connectedPlatforms) {
            $platform['connected'] = $connectedPlatforms->contains($platform['name']);
            return $platform;
        });

        return Inertia::render('Workflow/Index', [
            'workflows' => $workflows,
            'channels' => $channels,
            'platforms' => $platforms,
        ]);
    }

    /**
     * Store a newly created workflow.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'channel_id' => 'required|exists:channels,id',
            'source_platform' => 'required|string|in:youtube,instagram,tiktok,facebook,twitter,snapchat,pinterest',
            'target_platforms' => 'required|array|min:1',
            'target_platforms.*' => 'string|in:youtube,instagram,tiktok,facebook,twitter,snapchat,pinterest',
            'is_active' => 'boolean',
        ]);

        // Ensure user owns the channel
        $channel = $request->user()->channels()->findOrFail($request->channel_id);

        // Ensure source platform is not in target platforms
        if (in_array($request->source_platform, $request->target_platforms)) {
            return redirect()->back()
                ->withErrors(['target_platforms' => 'Source platform cannot be a target platform.'])
                ->withInput();
        }

        Workflow::create([
            'user_id' => $request->user()->id,
            'channel_id' => $request->channel_id,
            'name' => $request->name,
            'description' => $request->description,
            'source_platform' => $request->source_platform,
            'target_platforms' => $request->target_platforms,
            'is_active' => $request->boolean('is_active', true),
        ]);

        return redirect()->route('workflow.index')
            ->with('success', 'Workflow created successfully!');
    }

    /**
     * Update the specified workflow.
     */
    public function update(Request $request, Workflow $workflow): RedirectResponse
    {
        $this->authorize('update', $workflow);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|nullable|string|max:500',
            'channel_id' => 'sometimes|exists:channels,id',
            'source_platform' => 'sometimes|string|in:youtube,instagram,tiktok,facebook,twitter,snapchat,pinterest',
            'target_platforms' => 'sometimes|array|min:1',
            'target_platforms.*' => 'string|in:youtube,instagram,tiktok,facebook,twitter,snapchat,pinterest',
            'is_active' => 'sometimes|boolean',
        ]);

        // If channel_id is being updated, ensure user owns the new channel
        if ($request->has('channel_id')) {
            $request->user()->channels()->findOrFail($request->channel_id);
        }

        $workflow->update($request->only([
            'name', 'description', 'channel_id', 'source_platform', 'target_platforms', 'is_active'
        ]));

        return redirect()->route('workflow.index')
            ->with('success', 'Workflow updated successfully!');
    }

    /**
     * Remove the specified workflow.
     */
    public function destroy(Workflow $workflow): RedirectResponse
    {
        $this->authorize('delete', $workflow);

        $workflow->delete();

        return redirect()->route('workflow.index')
            ->with('success', 'Workflow deleted successfully!');
    }

    /**
     * Display the specified workflow.
     */
    public function show(Workflow $workflow): Response
    {
        $this->authorize('view', $workflow);

        return Inertia::render('Workflow/Show', [
            'workflow' => $workflow,
        ]);
    }

    /**
     * Show the form for editing the specified workflow.
     */
    public function edit(Workflow $workflow): Response
    {
        $this->authorize('update', $workflow);

        $channels = auth()->user()->channels()->select('id', 'name', 'slug')->get();

        // Get connected platforms across all channels
        $platforms = collect([
            ['name' => 'youtube', 'label' => 'YouTube', 'connected' => false],
            ['name' => 'instagram', 'label' => 'Instagram', 'connected' => false],
            ['name' => 'tiktok', 'label' => 'TikTok', 'connected' => false],
            ['name' => 'facebook', 'label' => 'Facebook', 'connected' => false],
            ['name' => 'twitter', 'label' => 'Twitter', 'connected' => false],
            ['name' => 'snapchat', 'label' => 'Snapchat', 'connected' => false],
            ['name' => 'pinterest', 'label' => 'Pinterest', 'connected' => false],
        ]);

        // Check which platforms are connected across user's channels
        $connectedPlatforms = auth()->user()->channels()
            ->with('socialAccounts')
            ->get()
            ->flatMap(fn($channel) => $channel->socialAccounts->pluck('platform'))
            ->unique()
            ->values();

        $platforms = $platforms->map(function ($platform) use ($connectedPlatforms) {
            $platform['connected'] = $connectedPlatforms->contains($platform['name']);
            return $platform;
        });

        return Inertia::render('Workflow/Edit', [
            'workflow' => $workflow,
            'channels' => $channels,
            'platforms' => $platforms,
        ]);
    }
} 