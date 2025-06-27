<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\VideoController;
use App\Http\Controllers\SocialAccountController;
use App\Http\Controllers\ChannelController;
use App\Http\Controllers\ConnectionsController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\AdminChatController;
use App\Http\Controllers\LegalController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\TutorialController;
use App\Http\Controllers\CloudStorageController;
use App\Http\Controllers\WorkflowController;
use App\Http\Controllers\AIController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'auth' => [
            'user' => Auth::user(),
        ],
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // AI Tool Pages
    Route::get('ai/content-calendar', function () {
        return Inertia::render('AI/ContentCalendar');
    })->name('ai.content-calendar');
    Route::get('ai/trend-analyzer', function () {
        return Inertia::render('AI/TrendAnalyzer');
    })->name('ai.trend-analyzer');
    Route::get('ai/audience-insights', function () {
        return Inertia::render('AI/AudienceInsights');
    })->name('ai.audience-insights');
    Route::get('ai/strategy-planner', function () {
        return Inertia::render('AI/StrategyPlanner');
    })->name('ai.strategy-planner');
    
    // Connections
    Route::get('connections', [ConnectionsController::class, 'index'])->name('connections');
    
    // Stats
    Route::get('stats', [StatsController::class, 'index'])->name('stats');
    
    // Channel routes
    Route::get('channels/{channel:slug}', [DashboardController::class, 'channel'])->name('channels.show');
    Route::resource('channels', ChannelController::class)->except(['show']);
    Route::get('channels/{channel:slug}/edit', [ChannelController::class, 'edit'])->name('channels.edit');
    
    // Video routes (scoped to channels)
    Route::get('channels/{channel:slug}/videos/create', [VideoController::class, 'create'])->name('videos.create');
    Route::post('channels/{channel:slug}/videos', [VideoController::class, 'store'])->name('videos.store');
    Route::post('channels/{channel:slug}/videos/instant-upload', [VideoController::class, 'instantUpload'])->name('videos.instant-upload');
    Route::get('videos', [VideoController::class, 'index'])->name('videos.index');
    Route::resource('videos', VideoController::class)->except(['create', 'store', 'index', 'show']);
    Route::post('video-targets/{target}/retry', [VideoController::class, 'retryTarget'])
        ->name('video-targets.retry');
    Route::delete('video-targets/{target}', [VideoController::class, 'deleteTarget'])
        ->name('video-targets.delete');
    Route::post('videos/{video}/update-platforms', [VideoController::class, 'updateAllPlatforms'])
        ->name('videos.update-platforms');
    
    // AI Content Optimization routes
    Route::prefix('ai')->name('ai.')->group(function () {
        // Content Optimization
        Route::post('optimize-content', [AIController::class, 'optimizeContent'])->name('optimize-content');
        Route::post('generate-hashtags', [AIController::class, 'generateHashtags'])->name('generate-hashtags');
        Route::post('suggest-posting-times', [AIController::class, 'suggestPostingTimes'])->name('suggest-posting-times');
        Route::post('generate-seo-description', [AIController::class, 'generateSEODescription'])->name('generate-seo-description');
        Route::post('generate-ab-variations', [AIController::class, 'generateABVariations'])->name('generate-ab-variations');
        Route::post('optimization-suggestions', [AIController::class, 'getOptimizationSuggestions'])->name('optimization-suggestions');
        Route::post('batch-optimize', [AIController::class, 'batchOptimizeContent'])->name('batch-optimize');
        
        // Video Analysis
        Route::post('analyze-video', [AIController::class, 'analyzeVideo'])->name('analyze-video');
        Route::post('assess-video-quality', [AIController::class, 'assessVideoQuality'])->name('assess-video-quality');
        Route::post('generate-thumbnail-suggestions', [AIController::class, 'generateThumbnailSuggestions'])->name('generate-thumbnail-suggestions');
        Route::post('extract-video-tags', [AIController::class, 'extractVideoTags'])->name('extract-video-tags');
        
        // Performance Optimization
        Route::post('analyze-video-performance', [AIController::class, 'analyzeVideoPerformance'])->name('analyze-video-performance');
        Route::post('create-ab-test', [AIController::class, 'createABTest'])->name('create-ab-test');
        Route::get('user-performance-insights', [AIController::class, 'getUserPerformanceInsights'])->name('user-performance-insights');
        Route::post('get-optimization-opportunities', [AIController::class, 'getOptimizationOpportunities'])->name('get-optimization-opportunities');
        Route::post('platform-performance-comparison', [AIController::class, 'getPlatformPerformanceComparison'])->name('platform-performance-comparison');
        Route::post('trending-performance-insights', [AIController::class, 'getTrendingPerformanceInsights'])->name('trending-performance-insights');
        
            // Thumbnail Optimization
    Route::post('optimize-thumbnails', [AIController::class, 'optimizeThumbnails'])->name('optimize-thumbnails');
    Route::post('generate-optimized-thumbnail', [AIController::class, 'generateOptimizedThumbnail'])->name('generate-optimized-thumbnail');
    Route::post('set-video-thumbnail', [AIController::class, 'setVideoThumbnail'])->name('set-video-thumbnail');
    Route::post('upload-custom-thumbnail', [AIController::class, 'uploadCustomThumbnail'])->name('upload-custom-thumbnail');
    Route::post('thumbnail-design-analysis', [AIController::class, 'getThumbnailDesignAnalysis'])->name('thumbnail-design-analysis');
    Route::post('thumbnail-ctr-predictions', [AIController::class, 'getThumbnailCTRPredictions'])->name('thumbnail-ctr-predictions');
    Route::post('thumbnail-text-suggestions', [AIController::class, 'getThumbnailTextSuggestions'])->name('thumbnail-text-suggestions');
    Route::post('create-thumbnail-ab-test', [AIController::class, 'createThumbnailABTest'])->name('create-thumbnail-ab-test');
        
        // Content Calendar
        Route::post('generate-content-calendar', [AIController::class, 'generateContentCalendar'])->name('generate-content-calendar');
        Route::post('optimal-posting-schedule', [AIController::class, 'getOptimalPostingSchedule'])->name('optimal-posting-schedule');
        Route::post('trending-opportunities', [AIController::class, 'getTrendingOpportunities'])->name('trending-opportunities');
        Route::post('analyze-content-gaps', [AIController::class, 'analyzeContentGaps'])->name('analyze-content-gaps');
        Route::post('seasonal-insights', [AIController::class, 'getSeasonalInsights'])->name('seasonal-insights');
        Route::post('performance-forecasts', [AIController::class, 'getPerformanceForecasts'])->name('performance-forecasts');
        
        // Trend Analyzer
        Route::post('analyze-trends', [AIController::class, 'analyzeTrends'])->name('analyze-trends');
        Route::post('trending-topics', [AIController::class, 'getTrendingTopics'])->name('trending-topics');
        Route::post('detect-viral-content', [AIController::class, 'detectViralContent'])->name('detect-viral-content');
        Route::post('hashtag-trends', [AIController::class, 'analyzeHashtagTrends'])->name('hashtag-trends');
        Route::post('content-opportunities', [AIController::class, 'identifyContentOpportunities'])->name('content-opportunities');
        Route::post('competitive-analysis', [AIController::class, 'getCompetitiveAnalysis'])->name('competitive-analysis');
        
        // Audience Insights
        Route::post('audience-insights', [AIController::class, 'analyzeAudienceInsights'])->name('ai.analyze-audience-insights');
        Route::post('demographic-breakdown', [AIController::class, 'getDemographicBreakdown'])->name('demographic-breakdown');
        Route::post('audience-segments', [AIController::class, 'getAudienceSegments'])->name('audience-segments');
        Route::post('behavior-patterns', [AIController::class, 'getBehaviorPatterns'])->name('behavior-patterns');
        Route::post('audience-growth-opportunities', [AIController::class, 'getAudienceGrowthOpportunities'])->name('audience-growth-opportunities');
        Route::post('personalization-recommendations', [AIController::class, 'getPersonalizationRecommendations'])->name('personalization-recommendations');
        
        // Content Strategy Planner
        Route::post('strategy-generate', [AIController::class, 'generateContentStrategy'])->name('strategy-generate');
        Route::post('strategy-overview', [AIController::class, 'getStrategicOverview'])->name('strategy-overview');
        Route::post('strategy-pillars', [AIController::class, 'getContentPillars'])->name('strategy-pillars');
        Route::post('strategy-competitive', [AIController::class, 'getStrategyCompetitiveAnalysis'])->name('strategy-competitive');
        Route::post('strategy-roadmap', [AIController::class, 'getGrowthRoadmap'])->name('strategy-roadmap');
        Route::post('strategy-kpis', [AIController::class, 'getKPIFramework'])->name('strategy-kpis');
        
        // SEO Optimizer routes removed as per user request

        // AI Watermark Remover
        Route::post('watermark-detect', [AIController::class, 'detectWatermarks'])->name('watermark-detect');
        Route::post('watermark-remove', [AIController::class, 'removeWatermarks'])->name('watermark-remove');
        Route::post('watermark-progress', [AIController::class, 'getRemovalProgress'])->name('watermark-progress');
        Route::post('watermark-optimize', [AIController::class, 'optimizeRemovalSettings'])->name('watermark-optimize');
        Route::post('watermark-quality', [AIController::class, 'analyzeRemovalQuality'])->name('watermark-quality');
        Route::post('watermark-report', [AIController::class, 'generateRemovalReport'])->name('watermark-report');
        
        // Watermark Template Management
        Route::post('watermark-template-create', [AIController::class, 'createWatermarkTemplate'])->name('watermark-template-create');
        Route::get('watermark-templates', [AIController::class, 'getWatermarkTemplates'])->name('watermark-templates');
        Route::get('watermark-detection-stats', [AIController::class, 'getWatermarkDetectionStats'])->name('watermark-detection-stats');
        
        // AI Content Generation
    Route::post('generate-video-content', [AIController::class, 'generateVideoContent'])->name('generate-video-content');
    
    // AI Subtitle Generator
    Route::post('subtitle-generate', [AIController::class, 'generateSubtitles'])->name('subtitle-generate');
    Route::post('subtitle-check', [AIController::class, 'checkSubtitles'])->name('subtitle-check');
    Route::post('subtitle-progress', [AIController::class, 'getSubtitleProgress'])->name('subtitle-progress');
    Route::post('subtitle-style', [AIController::class, 'updateSubtitleStyle'])->name('subtitle-style');
    Route::post('subtitle-position', [AIController::class, 'updateSubtitlePosition'])->name('subtitle-position');
    Route::post('subtitle-export', [AIController::class, 'exportSubtitles'])->name('subtitle-export');
    Route::get('subtitle-download/{generation_id}/{format?}', [AIController::class, 'downloadSubtitleFile'])->name('subtitle-download');
    Route::get('word-timing/{generation_id}', [AIController::class, 'getWordTimingFile'])->name('word-timing');
    Route::post('apply-style-to-all-subtitles', [AIController::class, 'applyStyleToAllSubtitles'])->name('apply-style-to-all-subtitles');
    Route::post('subtitle-quality', [AIController::class, 'analyzeSubtitleQuality'])->name('subtitle-quality');
    Route::post('subtitle-apply', [AIController::class, 'applySubtitlesToVideo'])->name('subtitle-apply');
    Route::get('subtitle-languages', [AIController::class, 'getSubtitleLanguages'])->name('subtitle-languages');
    Route::get('subtitle-styles', [AIController::class, 'getSubtitleStyles'])->name('subtitle-styles');
    
    // New WYSIWYG subtitle editor endpoints
    Route::post('subtitle-update-text', [AIController::class, 'updateSubtitleText'])->name('subtitle-update-text');
    Route::post('subtitle-update-style', [AIController::class, 'updateIndividualSubtitleStyle'])->name('subtitle-update-style');
    Route::post('subtitle-update-position', [AIController::class, 'updateIndividualSubtitlePosition'])->name('subtitle-update-position');
    Route::post('subtitle-render-video', [AIController::class, 'renderVideoWithSubtitles'])->name('subtitle-render-video');
    Route::post('set-video-thumbnail-from-frame', [AIController::class, 'setVideoThumbnailFromFrame'])->name('set-video-thumbnail-from-frame');
    
    // AI Tags Generation
    Route::post('analyze-video-tags', [AIController::class, 'analyzeVideoTags'])->name('analyze-video-tags');
    
    // AI Content Optimization
    Route::post('get-optimized-content-suggestions', [AIController::class, 'getOptimizedContentSuggestions'])->name('get-optimized-content-suggestions');
    });
    
    // Workflow routes
    Route::resource('workflow', WorkflowController::class);
    
    // Social Account Management (scoped to channels)
    Route::get('channels/{channel}/auth/{platform}', [SocialAccountController::class, 'redirect'])
        ->name('social.redirect');
    Route::get('channels/{channel}/auth/{platform}/callback', [SocialAccountController::class, 'callback'])
        ->name('social.callback');
    Route::delete('channels/{channel}/social/{platform}', [SocialAccountController::class, 'disconnect'])
        ->name('social.disconnect');
    Route::get('channels/{channel}/auth/{platform}/force-reconnect', [SocialAccountController::class, 'forceReconnect'])
        ->name('social.force-reconnect');
    Route::get('channels/{channel}/auth/{platform}/simulate', [SocialAccountController::class, 'simulateConnection'])
        ->name('social.simulate');
    
    // Social platform specific routes
    Route::post('channels/{channel}/facebook/select-page', [SocialAccountController::class, 'selectFacebookPage'])
        ->name('social.facebook.select-page');
    Route::post('channels/{channel}/youtube/select-channel', [SocialAccountController::class, 'selectYouTubeChannel'])
        ->name('social.youtube.select-channel');
    
    // General OAuth callbacks (for OAuth providers that need exact URLs)
    Route::get('auth/{platform}/callback', [SocialAccountController::class, 'generalCallback'])
        ->name('social.general-callback');
    
    // Facebook page selection routes
    Route::get('channels/{channel:slug}/facebook/page-selection', [SocialAccountController::class, 'showFacebookPageSelection'])
        ->name('facebook.page-selection');
    
    // YouTube channel selection routes
    Route::get('channels/{channel:slug}/youtube/channel-selection', [SocialAccountController::class, 'showYouTubeChannelSelection'])
        ->name('youtube.channel-selection');
    
    // OAuth error page
    Route::get('oauth/error', function () {
        $suggestedActions = request('suggested_actions') ? explode('|', request('suggested_actions')) : [];
        
        return Inertia::render('OAuthError', [
            'platform' => request('platform', 'unknown'),
            'channelSlug' => request('channel'),
            'channelName' => request('channel_name'),
            'errorMessage' => request('message', 'An unknown error occurred'),
            'errorCode' => request('code'),
            'errorDescription' => request('description'),
            'suggestedActions' => $suggestedActions,
            'supportInfo' => [
                'contactEmail' => config('mail.from.address'),
                'documentationUrl' => request('platform') === 'instagram' 
                    ? config('app.url') . '/docs/instagram-oauth-troubleshooting'
                    : config('app.url') . '/docs/oauth-troubleshooting',
            ],
        ]);
    })->name('oauth.error');
    
    // Development: OAuth configuration diagnostics
    Route::get('oauth/debug/{platform}', function ($platform) {
        if (!app()->environment('local')) {
            abort(404);
        }
        
        $errorHandler = new \App\Services\OAuthErrorHandler();
        $configStatus = $errorHandler->getOAuthConfigStatus($platform);
        
        $diagnostics = [
            'platform' => $platform,
            'config_status' => $configStatus,
            'environment' => app()->environment(),
        ];
        
        if ($platform === 'instagram') {
            $diagnostics['instagram_issues'] = $errorHandler->validateInstagramConfiguration();
        }
        
        return response()->json($diagnostics, 200, [], JSON_PRETTY_PRINT);
    })->name('oauth.debug');
    
    // Subscription routes
    Route::prefix('subscription')->name('subscription.')->group(function () {
        Route::get('plans', [SubscriptionController::class, 'plans'])->name('plans');
        Route::post('checkout', [SubscriptionController::class, 'checkout'])->name('checkout');
        Route::get('success', [SubscriptionController::class, 'success'])->name('success');
        Route::get('billing', [SubscriptionController::class, 'billing'])->name('billing');
        Route::post('cancel', [SubscriptionController::class, 'cancel'])->name('cancel');
        Route::post('resume', [SubscriptionController::class, 'resume'])->name('resume');
        Route::post('add-channel', [SubscriptionController::class, 'addChannel'])->name('add-channel');
        
        // Development: Simulate subscription
        Route::post('simulate', [SubscriptionController::class, 'simulateSubscription'])->name('simulate');
    });

    // Tutorial routes
    Route::post('tutorials/complete', [TutorialController::class, 'complete'])->name('tutorials.complete');
    Route::post('tutorials/reset', [TutorialController::class, 'reset'])->name('tutorials.reset');
    Route::get('tutorials/config/{page}', [TutorialController::class, 'config'])->name('tutorials.config');
    
    // Cloud Storage routes
    Route::prefix('cloud-storage')->name('cloud-storage.')->group(function () {
        Route::get('{provider}/auth', [CloudStorageController::class, 'redirect'])->name('auth');
        Route::get('{provider}/callback', [CloudStorageController::class, 'callback'])->name('callback');
        Route::get('{provider}/files', [CloudStorageController::class, 'listFiles'])->name('files');
        Route::post('{provider}/import', [CloudStorageController::class, 'importFile'])->name('import');
        Route::delete('{provider}/disconnect', [CloudStorageController::class, 'disconnect'])->name('disconnect');
        Route::get('connected', [CloudStorageController::class, 'getConnectedAccounts'])->name('connected');
    });
    
    // Notification routes
    Route::prefix('api/notifications')->name('notifications.')->group(function () {
        Route::get('unread-count', function () {
            return response()->json([
                'count' => auth()->user()->getUnreadNotificationsCount()
            ]);
        })->name('unread-count');
        Route::get('list', function () {
            return response()->json([
                'notifications' => auth()->user()->getNotifications()
            ]);
        })->name('list');
        Route::post('mark-read/{id}', function (string $id) {
            auth()->user()->markNotificationAsRead($id);
            return response()->json(['success' => true]);
        })->name('mark-read');
        Route::post('mark-all-read', function () {
            auth()->user()->markAllNotificationsAsRead();
            return response()->json(['success' => true]);
        })->name('mark-all-read');
        Route::delete('clear', function () {
            auth()->user()->clearNotifications();
            return response()->json(['success' => true]);
        })->name('clear');
    });
});

// Stripe webhooks (outside auth middleware)
Route::post('stripe/webhook', '\Laravel\Cashier\Http\Controllers\WebhookController@handleWebhook');

// Video access route (requires authentication)
Route::middleware('auth')->get('storage/videos/{filename}', [VideoController::class, 'serveVideo'])->name('video.serve');

// Chat routes
Route::middleware('auth')->group(function () {
    Route::get('/chat', [ChatController::class, 'index'])->name('chat.index');
    Route::post('/chat', [ChatController::class, 'store'])->name('chat.store');
    Route::post('/chat/new', [ChatController::class, 'createConversation'])->name('chat.create');
    Route::get('/chat/messages', [ChatController::class, 'getMessages'])->name('chat.messages');
    Route::get('/chat/poll', [ChatController::class, 'pollMessages'])->name('chat.poll');
    Route::post('/chat/mark-read', [ChatController::class, 'markAsRead'])->name('chat.mark-read');
});

// Legal and contact routes
Route::get('/privacy', [LegalController::class, 'privacy'])->name('legal.privacy');
Route::get('/terms', [LegalController::class, 'terms'])->name('legal.terms');
Route::get('/contact', [ContactController::class, 'index'])->name('contact.index');
Route::post('/contact', [ContactController::class, 'store'])->name('contact.store');

// Admin contact routes (protected)
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    // Redirect /admin to /admin/contact-messages
    Route::get('/', function () {
        return redirect()->route('admin.contact-messages.index');
    })->name('admin.dashboard');

    Route::get('contact-messages', [ContactController::class, 'adminIndex'])->name('contact-messages.index');
    Route::get('contact-messages/{contactMessage}', [ContactController::class, 'adminShow'])->name('contact-messages.show');
    Route::patch('contact-messages/{contactMessage}', [ContactController::class, 'adminUpdate'])->name('contact-messages.update');
    
    // Chat routes
    Route::get('chat', [AdminChatController::class, 'index'])->name('chat.index');
    Route::get('chat/{conversation}', [AdminChatController::class, 'show'])->name('chat.show');
    Route::post('chat/{conversation}/message', [AdminChatController::class, 'sendMessage'])->name('chat.send');
    Route::get('chat/{conversation}/messages', [AdminChatController::class, 'getMessages'])->name('chat.messages');
    Route::get('chat/{conversation}/poll', [AdminChatController::class, 'pollMessages'])->name('chat.poll');
    Route::post('chat/{conversation}/close', [AdminChatController::class, 'close'])->name('chat.close');
    Route::post('chat/{conversation}/reopen', [AdminChatController::class, 'reopen'])->name('chat.reopen');
    Route::get('chat-stats', [AdminChatController::class, 'getStats'])->name('chat.stats');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';

// Public thumbnail serving route (outside auth middleware)
Route::get('thumbnails/{path}', function ($path) {
    // Handle both direct files and subdirectory files
    $fullPath = 'public/thumbnails/' . $path;
    
    if (!Storage::exists($fullPath)) {
        abort(404);
    }
    
    $file = Storage::get($fullPath);
    $mimeType = Storage::mimeType($fullPath);
    
    return response($file, 200)
        ->header('Content-Type', $mimeType)
        ->header('Cache-Control', 'public, max-age=31536000');
})->where('path', '.*')->name('thumbnail.serve');

Route::post('/ai/rendered-video-status', [\App\Http\Controllers\AIController::class, 'getRenderedVideoStatus'])->middleware(['auth']);
