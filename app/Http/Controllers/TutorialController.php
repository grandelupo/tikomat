<?php

namespace App\Http\Controllers;

use App\Services\TutorialService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TutorialController extends Controller
{
    protected TutorialService $tutorialService;

    public function __construct(TutorialService $tutorialService)
    {
        $this->tutorialService = $tutorialService;
    }

    /**
     * Mark a tutorial as completed.
     */
    public function complete(Request $request): JsonResponse
    {
        $request->validate([
            'tutorial_name' => 'required|string|in:dashboard,channel,upload'
        ]);

        $this->tutorialService->markTutorialCompleted(
            $request->user(),
            $request->tutorial_name
        );

        return response()->json([
            'success' => true,
            'message' => 'Tutorial marked as completed'
        ]);
    }

    /**
     * Reset all tutorials for the user.
     */
    public function reset(Request $request): JsonResponse
    {
        $this->tutorialService->resetTutorials($request->user());

        return response()->json([
            'success' => true,
            'message' => 'All tutorials have been reset'
        ]);
    }

    /**
     * Get tutorial configuration for a specific page.
     */
    public function config(Request $request, string $page): JsonResponse
    {
        $config = $this->tutorialService->getTutorialConfig($request->user(), $page);

        return response()->json($config);
    }
}
