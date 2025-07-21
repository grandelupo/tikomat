<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;

class TutorialService
{
    /**
     * Get tutorial steps for a specific page.
     */
    public function getTutorialSteps(string $page): array
    {
        $tutorials = [
            'dashboard' => [
                [
                    'target' => '[data-tutorial="channels-section"]',
                    'title' => 'Welcome to Filmate!',
                    'content' => 'This is your dashboard where you can manage all your channels and videos. Let\'s start with your channels section.',
                    'position' => 'bottom'
                ],
                [
                    'target' => '[data-tutorial="upload-button"]',
                    'title' => 'Upload Your First Video',
                    'content' => 'Click here to upload your first video. You can upload videos up to 60 seconds long and publish them to multiple platforms at once.',
                    'position' => 'bottom'
                ],
                [
                    'target' => '[data-tutorial="recent-videos"]',
                    'title' => 'Track Your Videos',
                    'content' => 'Here you\'ll see all your recent videos and their publishing status across different platforms.',
                    'position' => 'top'
                ]
            ],
            'channel' => [
                [
                    'target' => '[data-tutorial="connect-platforms"]',
                    'title' => 'Connect Your Social Media',
                    'content' => 'Connect your social media accounts here. You can connect YouTube for free, or upgrade to Pro for Instagram, TikTok, and more.',
                    'position' => 'bottom'
                ],
                [
                    'target' => '[data-tutorial="upload-video"]',
                    'title' => 'Upload Videos',
                    'content' => 'Once you\'ve connected platforms, use this button to upload and publish videos across all your connected accounts.',
                    'position' => 'bottom'
                ],
                [
                    'target' => '[data-tutorial="video-status"]',
                    'title' => 'Monitor Publishing',
                    'content' => 'Track the status of your video uploads. You can see if they\'re pending, processing, successful, or failed.',
                    'position' => 'top'
                ]
            ],
            'upload' => [
                [
                    'target' => '[data-tutorial="video-upload"]',
                    'title' => 'Select Your Video',
                    'content' => 'Drag and drop your video file here, or click to browse. Videos must be under 60 seconds and 100MB.',
                    'position' => 'bottom'
                ],
                [
                    'target' => '[data-tutorial="video-details"]',
                    'title' => 'Add Video Information',
                    'content' => 'Add a title and description for your video. This will be used across all platforms you publish to.',
                    'position' => 'right'
                ],
                [
                    'target' => '[data-tutorial="platform-selection"]',
                    'title' => 'Choose Platforms',
                    'content' => 'Select which platforms you want to publish to. Make sure the platforms are connected to your channel first.',
                    'position' => 'left'
                ],
                [
                    'target' => '[data-tutorial="publishing-options"]',
                    'title' => 'Publishing Options',
                    'content' => 'Choose to publish immediately or schedule for later. You can also enable cloud storage backup.',
                    'position' => 'top'
                ]
            ]
        ];

        return $tutorials[$page] ?? [];
    }

    /**
     * Check if user has completed a tutorial.
     */
    public function hasCompletedTutorial(User $user, string $tutorialName): bool
    {
        $completedTutorials = $user->completed_tutorials ?? [];
        return in_array($tutorialName, $completedTutorials);
    }

    /**
     * Mark tutorial as completed for user.
     */
    public function markTutorialCompleted(User $user, string $tutorialName): void
    {
        $completedTutorials = $user->completed_tutorials ?? [];
        
        if (!in_array($tutorialName, $completedTutorials)) {
            $completedTutorials[] = $tutorialName;
            $user->update(['completed_tutorials' => $completedTutorials]);
        }
    }

    /**
     * Reset all tutorials for user.
     */
    public function resetTutorials(User $user): void
    {
        $user->update(['completed_tutorials' => []]);
    }

    /**
     * Get tutorial configuration for frontend.
     */
    public function getTutorialConfig(User $user, string $page): array
    {
        $steps = $this->getTutorialSteps($page);
        $hasCompleted = $this->hasCompletedTutorial($user, $page);

        return [
            'steps' => $steps,
            'hasCompleted' => $hasCompleted,
            'showTutorial' => !$hasCompleted && !empty($steps),
            'tutorialName' => $page
        ];
    }
} 