import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Music, Hash, Users, MessageCircle } from 'lucide-react';

interface TikTokOptionsProps {
    options: any;
    onChange: (options: any) => void;
}

export default function TikTokOptions({ options, onChange }: TikTokOptionsProps) {
    const updateOption = (key: string, value: any) => {
        onChange({ ...options, [key]: value });
    };

    const videoSettings = [
        { id: 'PUBLIC_TO_EVERYONE', name: 'Everyone', description: 'Your video will be public' },
        { id: 'MUTUAL_FOLLOW_FRIEND', name: 'Friends', description: 'Only friends can see your video' },
        { id: 'SELF_ONLY', name: 'Only me', description: 'Private video' },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 0 1 3.183-4.51v-3.5a6.329 6.329 0 0 0-5.394 10.692 6.33 6.33 0 0 0 10.857-4.424V8.687a8.182 8.182 0 0 0 4.773 1.526V6.79a4.831 4.831 0 0 1-1.003-.104z"/>
                    </svg>
                    TikTok Advanced Options
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                </div>

                {/* Music Selection */}
                <div className="space-y-2">
                    <Label htmlFor="music" className="flex items-center">
                        <Music className="w-4 h-4 mr-1" />
                        Background Music
                    </Label>
                    <Input
                        id="music"
                        value={options.musicId || ''}
                        onChange={(e) => updateOption('musicId', e.target.value)}
                        placeholder="Music ID (optional)"
                    />
                    <p className="text-xs text-muted-foreground">
                        Leave empty to use original audio or search TikTok's music library
                    </p>
                </div>

                {/* Video Cover */}
                <div className="space-y-2">
                    <Label htmlFor="coverTime">Video Cover Time (seconds)</Label>
                    <Input
                        id="coverTime"
                        type="number"
                        min="0"
                        max="60"
                        step="0.1"
                        value={options.coverTime || 0}
                        onChange={(e) => updateOption('coverTime', parseFloat(e.target.value))}
                        placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground">
                        Choose which second of your video to use as the cover
                    </p>
                </div>

                {/* Content Settings */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Content Settings</Label>
                    <div className="space-y-2">
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
                                id="allowDuet"
                                checked={options.allowDuet !== false}
                                onCheckedChange={(checked) => updateOption('allowDuet', checked)}
                            />
                            <Label htmlFor="allowDuet">Allow Duet</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="allowStitch"
                                checked={options.allowStitch !== false}
                                onCheckedChange={(checked) => updateOption('allowStitch', checked)}
                            />
                            <Label htmlFor="allowStitch">Allow Stitch</Label>
                        </div>
                    </div>
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
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 dark:bg-blue-950 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Note:</strong> Some advanced features may require TikTok Business API access or may not be available in all regions.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
} 