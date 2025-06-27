import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, X } from 'lucide-react';
import { getPlatformDisplayName, findForbiddenHashtags } from '@/lib/hashtagUtils';

interface HashtagValidationWarningProps {
  platform: string;
  content: string;
  onDismiss?: () => void;
  className?: string;
}

export default function HashtagValidationWarning({ 
  platform, 
  content, 
  onDismiss, 
  className = '' 
}: HashtagValidationWarningProps) {
  const forbiddenHashtags = findForbiddenHashtags(platform, content);
  
  if (forbiddenHashtags.length === 0) {
    return null;
  }

  const platformName = getPlatformDisplayName(platform);
  const hashtagList = forbiddenHashtags.map(tag => `'${tag}'`).join(', ');

  return (
    <Alert variant="destructive" className={`${className}`}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-start justify-between">
        <div>
          <strong>Forbidden Hashtags Detected</strong>
          <br />
          The following hashtags are not allowed on {platformName}: {hashtagList}. 
          They will be automatically removed when you publish.
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-2 flex-shrink-0 p-1 hover:bg-red-100 rounded"
            aria-label="Dismiss warning"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface MultiPlatformHashtagValidationProps {
  advancedOptions: Record<string, any>;
  onDismiss?: (platform: string) => void;
  className?: string;
}

export function MultiPlatformHashtagValidation({ 
  advancedOptions, 
  onDismiss, 
  className = '' 
}: MultiPlatformHashtagValidationProps) {
  const warnings: Array<{ platform: string; content: string }> = [];

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
        warnings.push({ platform, content });
      }
    }
  });

  if (warnings.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {warnings.map(({ platform, content }) => (
        <HashtagValidationWarning
          key={platform}
          platform={platform}
          content={content}
          onDismiss={onDismiss ? () => onDismiss(platform) : undefined}
        />
      ))}
    </div>
  );
} 