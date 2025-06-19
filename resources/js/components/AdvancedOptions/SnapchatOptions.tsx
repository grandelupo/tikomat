import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Clock, Users, Zap } from 'lucide-react';

interface SnapchatOptionsProps {
    options: any;
    onChange: (options: any) => void;
}

export default function SnapchatOptions({ options, onChange }: SnapchatOptionsProps) {
    // Add error boundary to prevent crashes
    const updateOption = (key: string, value: any) => {
        try {
            const newOptions = { ...options, [key]: value };
            onChange(newOptions);
        } catch (error) {
            console.error('Error updating Snapchat option:', error);
        }
    };

    const storyTypes = [
        { id: 'STORY', name: 'My Story', description: 'Share to your personal story' },
        { id: 'SPOTLIGHT', name: 'Spotlight', description: 'Submit to Snapchat Spotlight for discovery' },
    ];

    const durations = [
        { id: '3', name: '3 seconds', description: 'Quick snap' },
        { id: '5', name: '5 seconds', description: 'Standard duration' },
        { id: '10', name: '10 seconds', description: 'Extended view' },
        { id: 'unlimited', name: 'Unlimited', description: 'No time limit' },
    ];

    // Ensure options is always an object
    const safeOptions = options || {};

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Camera className="w-5 h-5 mr-2 text-yellow-500" />
                    Snapchat Advanced Options
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Story Type */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Story Type</Label>
                    <RadioGroup
                        value={safeOptions.storyType || 'STORY'}
                        onValueChange={(value) => updateOption('storyType', value)}
                    >
                        {storyTypes.map((type) => (
                            <div key={type.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={type.id} id={`snapchat-story-${type.id}`} />
                                <div>
                                    <Label htmlFor={`snapchat-story-${type.id}`} className="font-medium">{type.name}</Label>
                                    <p className="text-xs text-muted-foreground">{type.description}</p>
                                </div>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                {/* Story Duration */}
                <div className="space-y-2">
                    <Label htmlFor="snapchat-duration" className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        Story Duration
                    </Label>
                    <Select
                        value={safeOptions.duration || '5'}
                        onValueChange={(value) => updateOption('duration', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                            {durations.map((duration) => (
                                <SelectItem key={duration.id} value={duration.id}>
                                    {duration.name} - {duration.description}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Caption */}
                <div className="space-y-2">
                    <Label htmlFor="snapchat-caption">Caption</Label>
                    <Textarea
                        id="snapchat-caption"
                        value={safeOptions.caption || ''}
                        onChange={(e) => updateOption('caption', e.target.value)}
                        placeholder="Add a caption to your snap..."
                        rows={3}
                        maxLength={250}
                    />
                    <p className="text-xs text-muted-foreground">
                        {(safeOptions.caption || '').length}/250 characters
                    </p>
                </div>

                {/* Hashtags */}
                <div className="space-y-2">
                    <Label htmlFor="snapchat-hashtags">Hashtags</Label>
                    <Input
                        id="snapchat-hashtags"
                        value={safeOptions.hashtags || ''}
                        onChange={(e) => updateOption('hashtags', e.target.value)}
                        placeholder="#fun #snapchat #video"
                    />
                    <p className="text-xs text-muted-foreground">
                        Separate hashtags with spaces. Max 5 hashtags.
                    </p>
                </div>

                {/* Snap Settings */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Snap Settings</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="snapchat-allowScreenshot"
                                checked={safeOptions.allowScreenshot !== false}
                                onCheckedChange={(checked) => updateOption('allowScreenshot', checked)}
                            />
                            <Label htmlFor="snapchat-allowScreenshot">Allow screenshots</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="snapchat-allowReplay"
                                checked={safeOptions.allowReplay !== false}
                                onCheckedChange={(checked) => updateOption('allowReplay', checked)}
                            />
                            <Label htmlFor="snapchat-allowReplay">Allow replay</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="snapchat-saveToMemories"
                                checked={safeOptions.saveToMemories || false}
                                onCheckedChange={(checked) => updateOption('saveToMemories', checked)}
                            />
                            <Label htmlFor="snapchat-saveToMemories">Save to Memories</Label>
                        </div>
                    </div>
                </div>

                {/* Spotlight Settings (only if Spotlight is selected) */}
                {safeOptions.storyType === 'SPOTLIGHT' && (
                    <div className="space-y-3">
                        <Label className="text-base font-medium flex items-center">
                            <Zap className="w-4 h-4 mr-1" />
                            Spotlight Settings
                        </Label>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="snapchat-monetization"
                                    checked={safeOptions.monetization || false}
                                    onCheckedChange={(checked) => updateOption('monetization', checked)}
                                />
                                <Label htmlFor="snapchat-monetization">
                                    Enable monetization
                                    <Badge variant="secondary" className="ml-2">Earn money</Badge>
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="snapchat-publicProfile"
                                    checked={safeOptions.publicProfile || false}
                                    onCheckedChange={(checked) => updateOption('publicProfile', checked)}
                                />
                                <Label htmlFor="snapchat-publicProfile">Show public profile</Label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Audience Settings */}
                <div className="space-y-2">
                    <Label htmlFor="snapchat-audience">Audience</Label>
                    <Select
                        value={safeOptions.audience || 'FRIENDS'}
                        onValueChange={(value) => updateOption('audience', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select audience" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="FRIENDS">Friends only</SelectItem>
                            <SelectItem value="EVERYONE">Everyone</SelectItem>
                            <SelectItem value="CUSTOM">Custom list</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Location */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="snapchat-shareLocation"
                            checked={safeOptions.shareLocation || false}
                            onCheckedChange={(checked) => updateOption('shareLocation', checked)}
                        />
                        <Label htmlFor="snapchat-shareLocation">Share location</Label>
                    </div>
                    {safeOptions.shareLocation && (
                        <Input
                            placeholder="Enter location"
                            value={safeOptions.location || ''}
                            onChange={(e) => updateOption('location', e.target.value)}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 