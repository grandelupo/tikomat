<?php

namespace App\Services;

use OpenAI\Laravel\Facades\OpenAI;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class AIContentOptimizationService
{
    protected array $platformSpecificPrompts = [
        'youtube' => [
            'title_prompt' => 'Create an engaging YouTube title that is SEO-optimized, clickable, and under 60 characters. Focus on trending keywords and emotional triggers that encourage clicks.',
            'description_prompt' => 'Write a YouTube description that includes relevant keywords, call-to-actions, and helpful information. Structure it with sections for better readability.',
            'tags_prompt' => 'Generate 10-15 relevant YouTube tags that will help with discoverability. Include both broad and specific keywords.',
        ],
        'tiktok' => [
            'title_prompt' => 'Create a catchy TikTok caption that uses trending language, incorporates relevant hashtags, and encourages engagement. Keep it under 150 characters.',
            'description_prompt' => 'Write a TikTok description that is fun, engaging, and uses popular TikTok language. Include trending hashtags and calls-to-action.',
            'tags_prompt' => 'Generate 5-10 trending TikTok hashtags that are relevant to the content and likely to boost discoverability.',
        ],
        'instagram' => [
            'title_prompt' => 'Create an Instagram caption that tells a story, encourages engagement, and includes relevant hashtags. Make it authentic and relatable.',
            'description_prompt' => 'Write an Instagram description that builds community, asks questions, and includes strategic hashtags for maximum reach.',
            'tags_prompt' => 'Generate 20-30 Instagram hashtags mixing popular and niche tags for optimal reach without appearing spammy.',
        ],
        'facebook' => [
            'title_prompt' => 'Create a Facebook post title that encourages sharing and discussion. Focus on community building and storytelling.',
            'description_prompt' => 'Write a Facebook description that sparks conversation, includes relevant keywords, and encourages interaction.',
            'tags_prompt' => 'Generate relevant Facebook hashtags and topics that will help with organic reach and community building.',
        ],
        'twitter' => [
            'title_prompt' => 'Create a Twitter/X post that is concise, engaging, and likely to be retweeted. Use trending language and relevant hashtags.',
            'description_prompt' => 'Write a Twitter thread-style description that provides value and encourages engagement in under 280 characters per tweet.',
            'tags_prompt' => 'Generate 3-5 trending Twitter hashtags that are relevant and likely to increase visibility.',
        ],
        'snapchat' => [
            'title_prompt' => 'Create a Snapchat title that is fun, casual, and encourages friends to view and share the content.',
            'description_prompt' => 'Write a Snapchat description that is authentic, playful, and encourages interaction with friends.',
            'tags_prompt' => 'Generate Snapchat-relevant keywords and topics for better discoverability.',
        ],
        'pinterest' => [
            'title_prompt' => 'Create a Pinterest title that is keyword-rich, descriptive, and optimized for search. Focus on what users are searching for.',
            'description_prompt' => 'Write a Pinterest description that includes relevant keywords, helpful information, and encourages saves and clicks.',
            'tags_prompt' => 'Generate Pinterest keywords and hashtags that are search-optimized and relevant to the content niche.',
        ],
    ];

    protected array $contentCategories = [
        'entertainment' => 'entertainment, funny, viral, trending',
        'education' => 'educational, tutorial, how-to, learning',
        'lifestyle' => 'lifestyle, daily routine, personal, relatable',
        'fitness' => 'fitness, workout, health, wellness',
        'food' => 'food, cooking, recipe, delicious',
        'travel' => 'travel, adventure, explore, destination',
        'tech' => 'technology, gadgets, review, innovation',
        'business' => 'business, entrepreneur, success, marketing',
        'gaming' => 'gaming, gameplay, review, entertainment',
        'music' => 'music, song, artist, performance',
        'fashion' => 'fashion, style, outfit, trends',
        'diy' => 'diy, crafts, creative, handmade',
    ];

    /**
     * Optimize content for multiple platforms
     */
    public function optimizeForPlatforms(array $data): array
    {
        $originalTitle = $data['title'] ?? '';
        $originalDescription = $data['description'] ?? '';
        $platforms = $data['platforms'] ?? [];
        $category = $this->detectContentCategory($originalTitle . ' ' . $originalDescription);
        
        $optimizations = [];
        
        foreach ($platforms as $platform) {
            try {
                $optimization = $this->optimizeForPlatform(
                    $platform,
                    $originalTitle,
                    $originalDescription,
                    $category
                );
                
                $optimizations[$platform] = $optimization;
                
            } catch (\Exception $e) {
                Log::error("AI optimization failed for platform: {$platform}", [
                    'error' => $e->getMessage(),
                    'title' => $originalTitle,
                ]);
                
                // Fallback to original content
                $optimizations[$platform] = [
                    'title' => $originalTitle,
                    'description' => $originalDescription,
                    'tags' => $this->generateFallbackTags($category),
                    'optimization_score' => 0,
                    'suggestions' => ['AI optimization temporarily unavailable'],
                ];
            }
        }
        
        return $optimizations;
    }

    /**
     * Optimize content for a specific platform
     */
    public function optimizeForPlatform(string $platform, string $title, string $description, string $category = null): array
    {
        $cacheKey = "ai_optimization_{$platform}_" . md5($title . $description);
        
        return Cache::remember($cacheKey, 3600, function () use ($platform, $title, $description, $category) {
            $prompts = $this->platformSpecificPrompts[$platform] ?? $this->platformSpecificPrompts['youtube'];
            $categoryContext = $category ? "Content category: {$category}. " : '';
            
            // Generate optimized title
            $optimizedTitle = $this->generateOptimizedTitle($prompts['title_prompt'], $title, $description, $categoryContext);
            
            // Generate optimized description
            $optimizedDescription = $this->generateOptimizedDescription($prompts['description_prompt'], $title, $description, $categoryContext);
            
            // Generate tags/hashtags
            $tags = $this->generateTags($prompts['tags_prompt'], $title, $description, $categoryContext);
            
            // Calculate optimization score
            $score = $this->calculateOptimizationScore($platform, $optimizedTitle, $optimizedDescription, $tags);
            
            // Generate improvement suggestions
            $suggestions = $this->generateSuggestions($platform, $optimizedTitle, $optimizedDescription, $tags);
            
            return [
                'title' => $optimizedTitle,
                'description' => $optimizedDescription,
                'tags' => $tags,
                'optimization_score' => $score,
                'suggestions' => $suggestions,
                'platform_specific_tips' => $this->getPlatformTips($platform),
            ];
        });
    }

    /**
     * Generate trending hashtags for a specific platform
     */
    public function generateTrendingHashtags(string $platform, string $content, int $count = 10): array
    {
        $prompt = "Based on the content: '{$content}', generate {$count} trending hashtags for {$platform} that are currently popular and relevant. " .
                 "Consider seasonal trends, current events, and platform-specific hashtag strategies. " .
                 "Return only the hashtags in a comma-separated list, with # symbols.";

        try {
            $response = OpenAI::chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => "You are a social media expert specializing in {$platform} hashtag strategy."],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'max_tokens' => 200,
                'temperature' => 0.7,
            ]);

            $hashtags = explode(',', $response->choices[0]->message->content);
            return array_map('trim', $hashtags);
            
        } catch (\Exception $e) {
            Log::error('Failed to generate trending hashtags', [
                'platform' => $platform,
                'error' => $e->getMessage(),
            ]);
            
            return $this->getFallbackHashtags($platform);
        }
    }

    /**
     * Analyze content and suggest optimal posting times
     */
    public function suggestOptimalPostingTimes(string $platform, string $content, array $userTimeZone = null): array
    {
        $timeZone = $userTimeZone['timezone'] ?? 'UTC';
        
        $prompt = "Analyze this content for {$platform}: '{$content}'. " .
                 "Based on the content type and target audience, suggest the best 3 posting times for maximum engagement. " .
                 "Consider the platform's peak activity hours and the content's target demographic. " .
                 "Provide times in {$timeZone} timezone with reasons for each suggestion.";

        try {
            $response = OpenAI::chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => "You are a social media timing strategist with expertise in {$platform} audience behavior."],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'max_tokens' => 300,
                'temperature' => 0.5,
            ]);

            return $this->parsePostingTimes($response->choices[0]->message->content);
            
        } catch (\Exception $e) {
            Log::error('Failed to suggest posting times', [
                'platform' => $platform,
                'error' => $e->getMessage(),
            ]);
            
            return $this->getDefaultPostingTimes($platform);
        }
    }

    /**
     * Generate SEO-optimized descriptions
     */
    public function generateSEODescription(string $title, string $description, string $platform): string
    {
        $prompt = "Create an SEO-optimized description for {$platform} based on this title: '{$title}' and description: '{$description}'. " .
                 "Include relevant keywords naturally, maintain readability, and optimize for {$platform}'s search algorithm. " .
                 "Make it engaging and likely to rank well in searches.";

        try {
            $response = OpenAI::chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => "You are an SEO expert specializing in {$platform} content optimization."],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'max_tokens' => 500,
                'temperature' => 0.6,
            ]);

            return trim($response->choices[0]->message->content);
            
        } catch (\Exception $e) {
            Log::error('Failed to generate SEO description', [
                'platform' => $platform,
                'error' => $e->getMessage(),
            ]);
            
            return $description; // Fallback to original
        }
    }

    /**
     * Generate A/B testing variations
     */
    public function generateABTestVariations(string $platform, string $title, string $description, int $variations = 3): array
    {
        $prompt = "Create {$variations} different variations of this {$platform} content for A/B testing:\n" .
                 "Title: {$title}\n" .
                 "Description: {$description}\n\n" .
                 "Each variation should test different approaches (emotional, logical, curiosity-driven) while maintaining the core message. " .
                 "Make them distinctly different to get meaningful test results.";

        try {
            $response = OpenAI::chat()->create([
                'model' => 'gpt-4o-mini',
                'messages' => [
                    ['role' => 'system', 'content' => "You are an A/B testing specialist for {$platform} content optimization."],
                    ['role' => 'user', 'content' => $prompt],
                ],
                'max_tokens' => 1000,
                'temperature' => 0.8,
            ]);

            return $this->parseABVariations($response->choices[0]->message->content);
            
        } catch (\Exception $e) {
            Log::error('Failed to generate A/B variations', [
                'platform' => $platform,
                'error' => $e->getMessage(),
            ]);
            
            return [];
        }
    }

    /**
     * Private helper methods
     */
    private function generateOptimizedTitle(string $prompt, string $title, string $description, string $categoryContext): string
    {
        $fullPrompt = $categoryContext . $prompt . "\n\nOriginal title: '{$title}'\nContent description: '{$description}'";
        
        $response = OpenAI::chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a professional content optimization specialist.'],
                ['role' => 'user', 'content' => $fullPrompt],
            ],
            'max_tokens' => 100,
            'temperature' => 0.7,
        ]);

        return trim($response->choices[0]->message->content);
    }

    private function generateOptimizedDescription(string $prompt, string $title, string $description, string $categoryContext): string
    {
        $fullPrompt = $categoryContext . $prompt . "\n\nTitle: '{$title}'\nOriginal description: '{$description}'";
        
        $response = OpenAI::chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a professional content optimization specialist.'],
                ['role' => 'user', 'content' => $fullPrompt],
            ],
            'max_tokens' => 400,
            'temperature' => 0.7,
        ]);

        return trim($response->choices[0]->message->content);
    }

    private function generateTags(string $prompt, string $title, string $description, string $categoryContext): array
    {
        $fullPrompt = $categoryContext . $prompt . "\n\nTitle: '{$title}'\nDescription: '{$description}'";
        
        $response = OpenAI::chat()->create([
            'model' => 'gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => 'You are a hashtag and keyword specialist.'],
                ['role' => 'user', 'content' => $fullPrompt],
            ],
            'max_tokens' => 200,
            'temperature' => 0.6,
        ]);

        $tags = explode(',', $response->choices[0]->message->content);
        return array_map('trim', array_filter($tags));
    }

    private function detectContentCategory(string $content): string
    {
        $content = strtolower($content);
        
        foreach ($this->contentCategories as $category => $keywords) {
            $keywordList = explode(', ', $keywords);
            foreach ($keywordList as $keyword) {
                if (strpos($content, $keyword) !== false) {
                    return $category;
                }
            }
        }
        
        return 'general';
    }

    private function calculateOptimizationScore(string $platform, string $title, string $description, array $tags): int
    {
        $score = 0;
        
        // Title optimization score
        if (strlen($title) > 0) $score += 20;
        if (strlen($title) <= 60) $score += 15; // Good length for most platforms
        if (preg_match('/[0-9]/', $title)) $score += 10; // Numbers in titles perform well
        if (preg_match('/[!?]/', $title)) $score += 5; // Emotional punctuation
        
        // Description optimization score
        if (strlen($description) > 50) $score += 20;
        if (substr_count($description, '#') >= 3) $score += 10; // Good hashtag usage
        if (strpos($description, '?') !== false) $score += 5; // Questions encourage engagement
        
        // Tags optimization score
        if (count($tags) >= 5) $score += 15;
        if (count($tags) <= 30) $score += 10; // Not over-tagged
        
        // Platform-specific adjustments
        switch ($platform) {
            case 'tiktok':
                if (count($tags) >= 3 && count($tags) <= 10) $score += 5;
                break;
            case 'instagram':
                if (count($tags) >= 10 && count($tags) <= 30) $score += 5;
                break;
            case 'youtube':
                if (strlen($description) > 125) $score += 5; // Longer descriptions are better
                break;
        }
        
        return min(100, $score); // Cap at 100
    }

    private function generateSuggestions(string $platform, string $title, string $description, array $tags): array
    {
        $suggestions = [];
        
        // Title suggestions
        if (strlen($title) > 60) {
            $suggestions[] = "Consider shortening the title for better readability on {$platform}";
        }
        
        // Description suggestions
        if (strlen($description) < 50) {
            $suggestions[] = "Add more detail to your description to improve engagement";
        }
        
        // Tag suggestions
        if (count($tags) < 5) {
            $suggestions[] = "Add more relevant hashtags to increase discoverability";
        }
        
        // Platform-specific suggestions
        switch ($platform) {
            case 'youtube':
                $suggestions[] = "Consider adding timestamps to your description for better user experience";
                break;
            case 'tiktok':
                $suggestions[] = "Use trending sounds and effects to boost algorithm performance";
                break;
            case 'instagram':
                $suggestions[] = "Add a call-to-action in your caption to encourage engagement";
                break;
        }
        
        return $suggestions;
    }

    private function getPlatformTips(string $platform): array
    {
        $tips = [
            'youtube' => [
                'Post consistently for better algorithm performance',
                'Use custom thumbnails for higher click-through rates',
                'Add end screens to promote other videos',
                'Engage with comments within the first hour',
            ],
            'tiktok' => [
                'Post at least once daily for maximum reach',
                'Use trending sounds and effects',
                'Hook viewers in the first 3 seconds',
                'Participate in trending challenges',
            ],
            'instagram' => [
                'Post when your audience is most active',
                'Use Stories to increase engagement',
                'Create visually consistent content',
                'Engage with your community regularly',
            ],
            'facebook' => [
                'Share content that sparks conversation',
                'Use Facebook Groups to build community',
                'Post native videos for better reach',
                'Respond to comments promptly',
            ],
            'twitter' => [
                'Tweet consistently throughout the day',
                'Join trending conversations',
                'Use Twitter Spaces for audio content',
                'Retweet and engage with others',
            ],
        ];
        
        return $tips[$platform] ?? ['Optimize your content for your target audience'];
    }

    private function generateFallbackTags(string $category): array
    {
        $fallbackTags = $this->contentCategories[$category] ?? 'general, content, video, social media';
        return array_map('trim', explode(', ', $fallbackTags));
    }

    private function getFallbackHashtags(string $platform): array
    {
        $fallbacks = [
            'youtube' => ['#youtube', '#video', '#content', '#trending'],
            'tiktok' => ['#fyp', '#viral', '#trending', '#tiktok'],
            'instagram' => ['#instagram', '#reels', '#content', '#viral'],
            'facebook' => ['#facebook', '#video', '#social', '#content'],
            'twitter' => ['#twitter', '#video', '#content', '#trending'],
        ];
        
        return $fallbacks[$platform] ?? ['#content', '#video', '#social'];
    }

    private function parsePostingTimes(string $content): array
    {
        // Simple parsing - in production, you'd want more sophisticated parsing
        return [
            ['time' => '9:00 AM', 'reason' => 'Morning engagement peak'],
            ['time' => '1:00 PM', 'reason' => 'Lunch break activity'],
            ['time' => '7:00 PM', 'reason' => 'Evening social media usage'],
        ];
    }

    private function getDefaultPostingTimes(string $platform): array
    {
        $defaults = [
            'youtube' => [
                ['time' => '2:00 PM', 'reason' => 'Weekday afternoon peak'],
                ['time' => '8:00 PM', 'reason' => 'Evening entertainment time'],
                ['time' => '10:00 AM', 'reason' => 'Weekend morning activity'],
            ],
            'tiktok' => [
                ['time' => '6:00 AM', 'reason' => 'Early morning commute'],
                ['time' => '7:00 PM', 'reason' => 'After work/school peak'],
                ['time' => '9:00 PM', 'reason' => 'Evening entertainment peak'],
            ],
            'instagram' => [
                ['time' => '11:00 AM', 'reason' => 'Late morning peak'],
                ['time' => '2:00 PM', 'reason' => 'Lunch break scrolling'],
                ['time' => '5:00 PM', 'reason' => 'After work peak'],
            ],
        ];
        
        return $defaults[$platform] ?? $defaults['youtube'];
    }

    private function parseABVariations(string $content): array
    {
        // Simple parsing - in production, you'd want more sophisticated parsing
        $variations = explode("\n\n", $content);
        return array_map('trim', array_filter($variations));
    }
}