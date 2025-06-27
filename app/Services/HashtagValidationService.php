<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class HashtagValidationService
{
    /**
     * Platform-specific hashtag restrictions
     */
    private const PLATFORM_RESTRICTIONS = [
        'facebook' => [
            'forbidden_hashtags' => [
                '#facebook', '#fb', '#instagram', '#ig', '#twitter', '#tiktok', '#youtube', '#snapchat', '#pinterest', '#x',
                'facebook', 'fb', 'instagram', 'ig', 'twitter', 'tiktok', 'youtube', 'snapchat', 'pinterest', 'x'
            ],
            'forbidden_patterns' => [
                '/#?(facebook|fb|instagram|ig|twitter|tiktok|youtube|snapchat|pinterest|x)/i'
            ]
        ],
        'instagram' => [
            'forbidden_hashtags' => [
                '#facebook', '#fb', '#twitter', '#tiktok', '#youtube', '#snapchat', '#pinterest', '#x',
                'facebook', 'fb', 'twitter', 'tiktok', 'youtube', 'snapchat', 'pinterest', 'x'
            ],
            'forbidden_patterns' => [
                '/#?(facebook|fb|twitter|tiktok|youtube|snapchat|pinterest|x)/i'
            ]
        ],
        'tiktok' => [
            'forbidden_hashtags' => [
                '#facebook', '#fb', '#instagram', '#ig', '#twitter', '#youtube', '#snapchat', '#pinterest', '#x',
                'facebook', 'fb', 'instagram', 'ig', 'twitter', 'youtube', 'snapchat', 'pinterest', 'x'
            ],
            'forbidden_patterns' => [
                '/#?(facebook|fb|instagram|ig|twitter|youtube|snapchat|pinterest|x)/i'
            ]
        ],
        'youtube' => [
            'forbidden_hashtags' => [
                '#facebook', '#fb', '#instagram', '#ig', '#twitter', '#tiktok', '#snapchat', '#pinterest', '#x',
                'facebook', 'fb', 'instagram', 'ig', 'twitter', 'tiktok', 'snapchat', 'pinterest', 'x'
            ],
            'forbidden_patterns' => [
                '/#?(facebook|fb|instagram|ig|twitter|tiktok|snapchat|pinterest|x)/i'
            ]
        ],
        'x' => [
            'forbidden_hashtags' => [
                '#facebook', '#fb', '#instagram', '#ig', '#tiktok', '#youtube', '#snapchat', '#pinterest',
                'facebook', 'fb', 'instagram', 'ig', 'tiktok', 'youtube', 'snapchat', 'pinterest'
            ],
            'forbidden_patterns' => [
                '/#?(facebook|fb|instagram|ig|tiktok|youtube|snapchat|pinterest)/i'
            ]
        ],
        'snapchat' => [
            'forbidden_hashtags' => [
                '#facebook', '#fb', '#instagram', '#ig', '#twitter', '#tiktok', '#youtube', '#pinterest', '#x',
                'facebook', 'fb', 'instagram', 'ig', 'twitter', 'tiktok', 'youtube', 'pinterest', 'x'
            ],
            'forbidden_patterns' => [
                '/#?(facebook|fb|instagram|ig|twitter|tiktok|youtube|pinterest|x)/i'
            ]
        ],
        'pinterest' => [
            'forbidden_hashtags' => [
                '#facebook', '#fb', '#instagram', '#ig', '#twitter', '#tiktok', '#youtube', '#snapchat', '#x',
                'facebook', 'fb', 'instagram', 'ig', 'twitter', 'tiktok', 'youtube', 'snapchat', 'x'
            ],
            'forbidden_patterns' => [
                '/#?(facebook|fb|instagram|ig|twitter|tiktok|youtube|snapchat|x)/i'
            ]
        ]
    ];

    /**
     * Validate and filter hashtags for a specific platform
     */
    public function validateAndFilterHashtags(string $platform, string $content): array
    {
        $restrictions = self::PLATFORM_RESTRICTIONS[$platform] ?? [];
        
        if (empty($restrictions)) {
            return [
                'filtered_content' => $content,
                'removed_hashtags' => [],
                'warnings' => []
            ];
        }

        $originalContent = $content;
        $removedHashtags = [];
        $warnings = [];

        // Extract hashtags from content
        $hashtags = $this->extractHashtags($content);
        
        foreach ($hashtags as $hashtag) {
            $normalizedHashtag = strtolower(trim($hashtag, '#'));
            
            // Check if hashtag is forbidden
            if (in_array($normalizedHashtag, $restrictions['forbidden_hashtags']) || 
                in_array($hashtag, $restrictions['forbidden_hashtags'])) {
                
                $removedHashtags[] = $hashtag;
                $content = $this->removeHashtagFromContent($content, $hashtag);
                
                $warnings[] = "Removed forbidden hashtag '{$hashtag}' for {$platform}";
                
                Log::info('Forbidden hashtag removed', [
                    'platform' => $platform,
                    'hashtag' => $hashtag,
                    'normalized' => $normalizedHashtag
                ]);
            }
        }

        // Apply pattern-based filtering
        if (!empty($restrictions['forbidden_patterns'])) {
            foreach ($restrictions['forbidden_patterns'] as $pattern) {
                $matches = [];
                if (preg_match_all($pattern, $content, $matches)) {
                    foreach ($matches[0] as $match) {
                        $removedHashtags[] = $match;
                        $content = $this->removeHashtagFromContent($content, $match);
                        
                        $warnings[] = "Removed forbidden hashtag pattern '{$match}' for {$platform}";
                        
                        Log::info('Forbidden hashtag pattern removed', [
                            'platform' => $platform,
                            'pattern' => $pattern,
                            'match' => $match
                        ]);
                    }
                }
            }
        }

        // Clean up extra whitespace
        $content = $this->cleanupWhitespace($content);

        return [
            'filtered_content' => $content,
            'removed_hashtags' => array_unique($removedHashtags),
            'warnings' => $warnings,
            'has_changes' => $content !== $originalContent
        ];
    }

    /**
     * Extract hashtags from content
     */
    private function extractHashtags(string $content): array
    {
        $hashtags = [];
        preg_match_all('/#\w+/', $content, $matches);
        
        if (!empty($matches[0])) {
            $hashtags = $matches[0];
        }

        return $hashtags;
    }

    /**
     * Remove a specific hashtag from content
     */
    private function removeHashtagFromContent(string $content, string $hashtag): string
    {
        // Remove the hashtag with surrounding whitespace
        $pattern = '/\s*' . preg_quote($hashtag, '/') . '\s*/';
        $content = preg_replace($pattern, ' ', $content);
        
        return $content;
    }

    /**
     * Clean up extra whitespace
     */
    private function cleanupWhitespace(string $content): string
    {
        // Replace multiple spaces with single space
        $content = preg_replace('/\s+/', ' ', $content);
        
        // Trim leading and trailing whitespace
        $content = trim($content);
        
        return $content;
    }

    /**
     * Get forbidden hashtags for a platform
     */
    public function getForbiddenHashtags(string $platform): array
    {
        return self::PLATFORM_RESTRICTIONS[$platform]['forbidden_hashtags'] ?? [];
    }

    /**
     * Check if a hashtag is forbidden for a platform
     */
    public function isHashtagForbidden(string $platform, string $hashtag): bool
    {
        $restrictions = self::PLATFORM_RESTRICTIONS[$platform] ?? [];
        
        if (empty($restrictions)) {
            return false;
        }

        $normalizedHashtag = strtolower(trim($hashtag, '#'));
        
        // Check exact matches
        if (in_array($normalizedHashtag, $restrictions['forbidden_hashtags']) || 
            in_array($hashtag, $restrictions['forbidden_hashtags'])) {
            return true;
        }

        // Check pattern matches
        if (!empty($restrictions['forbidden_patterns'])) {
            foreach ($restrictions['forbidden_patterns'] as $pattern) {
                if (preg_match($pattern, $hashtag)) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get validation message for forbidden hashtags
     */
    public function getValidationMessage(string $platform, array $forbiddenHashtags): string
    {
        if (empty($forbiddenHashtags)) {
            return '';
        }

        $hashtagList = implode(', ', array_map(function($tag) {
            return "'{$tag}'";
        }, $forbiddenHashtags));

        return "The following hashtags are not allowed on {$platform}: {$hashtagList}. They have been automatically removed.";
    }

    /**
     * Validate hashtags in advanced options for all platforms
     */
    public function validateAdvancedOptions(array $advancedOptions): array
    {
        $validationResults = [];
        
        foreach ($advancedOptions as $platform => $options) {
            if (isset($options['caption']) || isset($options['hashtags'])) {
                $content = '';
                
                if (isset($options['caption'])) {
                    $content .= $options['caption'] . ' ';
                }
                
                if (isset($options['hashtags'])) {
                    $hashtags = is_array($options['hashtags']) 
                        ? implode(' ', $options['hashtags']) 
                        : $options['hashtags'];
                    $content .= $hashtags;
                }

                $result = $this->validateAndFilterHashtags($platform, $content);
                
                if ($result['has_changes']) {
                    $validationResults[$platform] = $result;
                }
            }
        }

        return $validationResults;
    }
} 