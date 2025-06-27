/**
 * Platform-specific hashtag restrictions for frontend validation
 */
export const PLATFORM_HASHTAG_RESTRICTIONS = {
  facebook: [
    '#facebook', '#fb', '#instagram', '#ig', '#twitter', '#tiktok', '#youtube', '#snapchat', '#pinterest', '#x',
    'facebook', 'fb', 'instagram', 'ig', 'twitter', 'tiktok', 'youtube', 'snapchat', 'pinterest', 'x'
  ],
  instagram: [
    '#facebook', '#fb', '#twitter', '#tiktok', '#youtube', '#snapchat', '#pinterest', '#x',
    'facebook', 'fb', 'twitter', 'tiktok', 'youtube', 'snapchat', 'pinterest', 'x'
  ],
  tiktok: [
    '#facebook', '#fb', '#instagram', '#ig', '#twitter', '#youtube', '#snapchat', '#pinterest', '#x',
    'facebook', 'fb', 'instagram', 'ig', 'twitter', 'youtube', 'snapchat', 'pinterest', 'x'
  ],
  youtube: [
    '#facebook', '#fb', '#instagram', '#ig', '#twitter', '#tiktok', '#snapchat', '#pinterest', '#x',
    'facebook', 'fb', 'instagram', 'ig', 'twitter', 'tiktok', 'snapchat', 'pinterest', 'x'
  ],
  x: [
    '#facebook', '#fb', '#instagram', '#ig', '#tiktok', '#youtube', '#snapchat', '#pinterest',
    'facebook', 'fb', 'instagram', 'ig', 'tiktok', 'youtube', 'snapchat', 'pinterest'
  ],
  snapchat: [
    '#facebook', '#fb', '#instagram', '#ig', '#twitter', '#tiktok', '#youtube', '#pinterest', '#x',
    'facebook', 'fb', 'instagram', 'ig', 'twitter', 'tiktok', 'youtube', 'pinterest', 'x'
  ],
  pinterest: [
    '#facebook', '#fb', '#instagram', '#ig', '#twitter', '#tiktok', '#youtube', '#snapchat', '#x',
    'facebook', 'fb', 'instagram', 'ig', 'twitter', 'tiktok', 'youtube', 'snapchat', 'x'
  ]
} as const;

/**
 * Check if a hashtag is forbidden for a specific platform
 */
export function isHashtagForbidden(platform: string, hashtag: string): boolean {
  const restrictions = PLATFORM_HASHTAG_RESTRICTIONS[platform as keyof typeof PLATFORM_HASHTAG_RESTRICTIONS];
  if (!restrictions) return false;

  const normalizedHashtag = hashtag.toLowerCase().replace('#', '');
  return restrictions.includes(normalizedHashtag) || restrictions.includes(hashtag);
}

/**
 * Extract hashtags from text content
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#\w+/g;
  return content.match(hashtagRegex) || [];
}

/**
 * Find forbidden hashtags in content for a specific platform
 */
export function findForbiddenHashtags(platform: string, content: string): string[] {
  const hashtags = extractHashtags(content);
  return hashtags.filter(hashtag => isHashtagForbidden(platform, hashtag));
}

/**
 * Get validation message for forbidden hashtags
 */
export function getHashtagValidationMessage(platform: string, forbiddenHashtags: string[]): string {
  if (forbiddenHashtags.length === 0) return '';

  const hashtagList = forbiddenHashtags.map(tag => `'${tag}'`).join(', ');
  return `The following hashtags are not allowed on ${platform}: ${hashtagList}. They will be automatically removed.`;
}

/**
 * Get platform display name
 */
export function getPlatformDisplayName(platform: string): string {
  const displayNames: Record<string, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    youtube: 'YouTube',
    x: 'X (Twitter)',
    snapchat: 'Snapchat',
    pinterest: 'Pinterest'
  };
  
  return displayNames[platform] || platform;
}

/**
 * Validate hashtags in advanced options for all platforms
 */
export function validateAdvancedOptions(advancedOptions: Record<string, any>): Record<string, any> {
  const validationResults: Record<string, any> = {};
  
  Object.entries(advancedOptions).forEach(([platform, options]) => {
    if (options?.caption || options?.hashtags) {
      let content = '';
      
      if (options.caption) {
        content += options.caption + ' ';
      }
      
      if (options.hashtags) {
        const hashtags = Array.isArray(options.hashtags) 
          ? options.hashtags.join(' ') 
          : options.hashtags;
        content += hashtags;
      }

      const forbiddenHashtags = findForbiddenHashtags(platform, content);
      
      if (forbiddenHashtags.length > 0) {
        validationResults[platform] = {
          forbiddenHashtags,
          message: getHashtagValidationMessage(platform, forbiddenHashtags)
        };
      }
    }
  });

  return validationResults;
} 