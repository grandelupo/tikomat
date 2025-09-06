import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Hash, Users, MessageCircle, Share2 } from 'lucide-react';
import HashtagValidationWarning from '@/components/HashtagValidationWarning';

interface TikTokOptionsProps {
    options: any;
    onChange: (options: any) => void;
}

export default function TikTokOptions({ options, onChange }: TikTokOptionsProps) {
    const safeOptions = options || {};

    const updateOption = (key: string, value: any) => {
        onChange({ ...safeOptions, [key]: value });
    };

    const videoSettings = [
        { id: 'PUBLIC_TO_EVERYONE', name: 'Public', description: 'Anyone can see your video' },
        { id: 'FRIENDS', name: 'Friends', description: 'Only your friends can see your video' },
        { id: 'SELF_ONLY', name: 'Private', description: 'Only you can see your video' }
    ];

    // Get content for hashtag validation
    const getContentForValidation = () => {
        let content = '';
        if (safeOptions.caption) {
            content += safeOptions.caption + ' ';
        }
        if (safeOptions.hashtags) {
            const hashtags = Array.isArray(safeOptions.hashtags)
                ? safeOptions.hashtags.join(' ')
                : safeOptions.hashtags;
            content += hashtags;
        }
        return content;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    TikTok Options
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Hashtag Validation Warning */}
                <HashtagValidationWarning
                    platform="tiktok"
                    content={getContentForValidation()}
                />

                {/* Privacy Settings */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Privacy Settings</Label>
                    <RadioGroup
                        value={options.privacy || 'PUBLIC_TO_EVERYONE'}
                        onValueChange={(value) => updateOption('privacy', value)}
                    >
                        {videoSettings.map((setting) => (
                            <div key={setting.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={setting.id} id={setting.id} />
                                <div>
                                    <Label htmlFor={setting.id} className="font-medium">{setting.name}</Label>
                                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                                </div>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                {/* Caption/Hashtags */}
                <div className="space-y-2">
                    <Label htmlFor="caption" className="flex items-center">
                        <Hash className="w-4 h-4 mr-1" />
                        Caption & Hashtags
                    </Label>
                    <Textarea
                        id="caption"
                        value={options.caption || ''}
                        onChange={(e) => updateOption('caption', e.target.value)}
                        placeholder="Write a caption... #trending #viral #fyp"
                        rows={3}
                        maxLength={2200}
                    />
                    <p className="text-xs text-muted-foreground">
                        {(options.caption || '').length}/2200 characters
                    </p>
                    <p className="text-xs text-amber-600">
                        Note: Platform-specific hashtags like #facebook, #instagram, #youtube will be automatically removed
                    </p>
                </div>

                {/* Music Selection */}
                <div className="space-y-2">
                    <Label htmlFor="music" className="flex items-center">
                        <Music className="w-4 h-4 mr-1" />
                        Music/Sound
                    </Label>
                    <Input
                        id="music"
                        value={options.music || ''}
                        onChange={(e) => updateOption('music', e.target.value)}
                        placeholder="Add trending music or sound"
                    />
                </div>

                {/* Interaction Settings */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Interaction Settings</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="allowDuet"
                                checked={options.allowDuet !== false}
                                onCheckedChange={(checked) => updateOption('allowDuet', checked)}
                            />
                            <Label htmlFor="allowDuet" className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                Allow duets
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="allowComments"
                                checked={options.allowComments !== false}
                                onCheckedChange={(checked) => updateOption('allowComments', checked)}
                            />
                            <Label htmlFor="allowComments" className="flex items-center">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Allow comments
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="allowStitch"
                                checked={options.allowStitch !== false}
                                onCheckedChange={(checked) => updateOption('allowStitch', checked)}
                            />
                            <Label htmlFor="allowStitch" className="flex items-center">
                                <Share2 className="w-4 h-4 mr-1" />
                                Allow stitch
                            </Label>
                        </div>
                    </div>
                </div>

                {/* Cover Image */}
                <div className="space-y-2">
                    <Label htmlFor="coverTimestamp">Cover Image Time</Label>
                    <Input
                        id="coverTimestamp"
                        type="number"
                        min="1"
                        max="60"
                        value={options.coverTimestamp || 1}
                        onChange={(e) => updateOption('coverTimestamp', parseInt(e.target.value) || 1)}
                        placeholder="Seconds from start"
                    />
                    <p className="text-xs text-muted-foreground">
                        Select which frame to use as the cover image (1-60 seconds)
                    </p>
                </div>

                {/* Content Disclosure */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Content Disclosure</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="brandedContent"
                                checked={options.brandedContent || false}
                                onCheckedChange={(checked) => updateOption('brandedContent', checked)}
                            />
                            <Label htmlFor="brandedContent">
                                Branded content/Paid partnership
                                <Badge variant="outline" className="ml-2">Disclosure required</Badge>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="contentWarning"
                                checked={options.contentWarning || false}
                                onCheckedChange={(checked) => updateOption('contentWarning', checked)}
                            />
                            <Label htmlFor="contentWarning">Content may not be suitable for all audiences</Label>
                        </div>
                    </div>
                </div>

                {/* Audience Settings */}
                <div className="space-y-2">
                    <Label htmlFor="audience">Target Audience</Label>
                    <Select
                        value={options.audience || 'everyone'}
                        onValueChange={(value) => updateOption('audience', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="everyone">Everyone</SelectItem>
                            <SelectItem value="teen">Teens (13-17)</SelectItem>
                            <SelectItem value="adult">Adults (18+)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Auto-Caption */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="autoCaption"
                            checked={options.autoCaption !== false}
                            onCheckedChange={(checked) => updateOption('autoCaption', checked)}
                        />
                        <Label htmlFor="autoCaption">Auto-generate captions</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Automatically create captions for accessibility
                    </p>
                </div>

                {/* Schedule Note */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3  "
                    <p className="text-sm text-blue-800 "
                        <strong>Note:</strong> Some advanced features may require TikTok Business API access or may not be available in all regions.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}