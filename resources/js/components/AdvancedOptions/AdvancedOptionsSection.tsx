import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import YouTubeOptions from './YouTubeOptions';
import TikTokOptions from './TikTokOptions';
import InstagramOptions from './InstagramOptions';
import FacebookOptions from './FacebookOptions';
import XOptions from './XOptions';
import SnapchatOptions from './SnapchatOptions';
import PinterestOptions from './PinterestOptions';

interface AdvancedOptionsSectionProps {
    selectedPlatforms: string[];
    advancedOptions: Record<string, any>;
    onAdvancedOptionsChange: (platform: string, options: any) => void;
}

const platformComponents = {
    youtube: YouTubeOptions,
    tiktok: TikTokOptions,
    instagram: InstagramOptions,
    facebook: FacebookOptions,
    x: XOptions,
    snapchat: SnapchatOptions,
    pinterest: PinterestOptions,
};

const platformNames = {
    youtube: 'YouTube',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    facebook: 'Facebook',
    twitter: 'Twitter',
    snapchat: 'Snapchat',
    pinterest: 'Pinterest',
};

export default function AdvancedOptionsSection({
    selectedPlatforms,
    advancedOptions,
    onAdvancedOptionsChange,
}: AdvancedOptionsSectionProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (selectedPlatforms.length === 0) {
        return null;
    }

    return (
        <Card className="mt-6">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center">
                                <Settings className="w-5 h-5 mr-2" />
                                Advanced Options
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    Platform-specific settings
                                </span>
                            </div>
                            {isOpen ? (
                                <ChevronUp className="w-5 h-5" />
                            ) : (
                                <ChevronDown className="w-5 h-5" />
                            )}
                        </CardTitle>
                    </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="space-y-6">
                            <p className="text-sm text-muted-foreground">
                                Configure platform-specific settings for your video upload. Each platform has unique options that can help optimize your content's reach and engagement.
                            </p>

                            <div className="space-y-6">
                                {selectedPlatforms.map((platform) => {
                                    const Component = platformComponents[platform as keyof typeof platformComponents];
                                    const platformName = platformNames[platform as keyof typeof platformNames];

                                    if (!Component) return null;

                                    return (
                                        <div key={platform}>
                                            <Component
                                                options={advancedOptions[platform] || {}}
                                                onChange={(options) => onAdvancedOptionsChange(platform, options)}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
                                <ul className="text-sm text-blue-800 space-y-1">
                                    <li>• YouTube: Use custom thumbnails and relevant tags to increase discoverability</li>
                                    <li>• TikTok: Add trending hashtags and music to boost engagement</li>
                                    <li>• Instagram: Use location tags and alt text for better accessibility</li>
                                    <li>• Facebook: Target specific audiences and add call-to-actions</li>
                                    <li>• Twitter: Keep tweet text concise and add polls for engagement</li>
                                    <li>• Snapchat: Use Spotlight for discovery and enable monetization</li>
                                    <li>• Pinterest: Add detailed descriptions and keywords for better search visibility</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}