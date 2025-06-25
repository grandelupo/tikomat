import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Users, Hash, AlertTriangle } from 'lucide-react';

interface XOptionsProps {
    options: any;
    onChange: (options: any) => void;
}

export default function XOptions({ options, onChange }: XOptionsProps) {
    const updateOption = (key: string, value: any) => {
        onChange({ ...options, [key]: value });
    };

    const replySettings = [
        { id: 'everyone', name: 'Everyone', description: 'Anyone can reply' },
        { id: 'following', name: 'People you follow', description: 'Only people you follow' },
        { id: 'mentioned', name: 'Only people you mention', description: 'Only mentioned users' },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    X Advanced Options
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Tweet Text */}
                <div className="space-y-2">
                    <Label htmlFor="text" className="flex items-center">
                        <Hash className="w-4 h-4 mr-1" />
                        Post Text
                    </Label>
                    <Textarea
                        id="text"
                        value={options.text || ''}
                        onChange={(e) => updateOption('text', e.target.value)}
                        placeholder="What's happening?"
                        rows={3}
                        maxLength={280}
                    />
                    <p className="text-xs text-muted-foreground">
                        {(options.text || '').length}/280 characters
                    </p>
                </div>

                {/* Reply Settings */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Who can reply?</Label>
                    <RadioGroup
                        value={options.replySettings || 'everyone'}
                        onValueChange={(value) => updateOption('replySettings', value)}
                    >
                        {replySettings.map((setting) => (
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

                {/* Content Warnings */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Content Warnings</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="possiblySensitive"
                                checked={options.possiblySensitive || false}
                                onCheckedChange={(checked) => updateOption('possiblySensitive', checked)}
                            />
                            <Label htmlFor="possiblySensitive" className="flex items-center">
                                <AlertTriangle className="w-4 h-4 mr-1 text-orange-500" />
                                Mark as sensitive content
                            </Label>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">
                            For content that may be sensitive (violence, adult content, etc.)
                        </p>
                    </div>
                </div>

                {/* Poll Option */}
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="includePoll"
                            checked={options.includePoll || false}
                            onCheckedChange={(checked) => updateOption('includePoll', checked)}
                        />
                        <Label htmlFor="includePoll">Add a poll to this post</Label>
                    </div>
                    
                    {options.includePoll && (
                        <div className="space-y-3 ml-6 p-3 border rounded-lg">
                            <div className="space-y-2">
                                <Label htmlFor="pollOption1">Poll Option 1</Label>
                                <Input
                                    id="pollOption1"
                                    value={options.pollOption1 || ''}
                                    onChange={(e) => updateOption('pollOption1', e.target.value)}
                                    placeholder="Enter poll option"
                                    maxLength={25}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pollOption2">Poll Option 2</Label>
                                <Input
                                    id="pollOption2"
                                    value={options.pollOption2 || ''}
                                    onChange={(e) => updateOption('pollOption2', e.target.value)}
                                    placeholder="Enter poll option"
                                    maxLength={25}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pollOption3">Poll Option 3 (Optional)</Label>
                                <Input
                                    id="pollOption3"
                                    value={options.pollOption3 || ''}
                                    onChange={(e) => updateOption('pollOption3', e.target.value)}
                                    placeholder="Enter poll option"
                                    maxLength={25}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pollOption4">Poll Option 4 (Optional)</Label>
                                <Input
                                    id="pollOption4"
                                    value={options.pollOption4 || ''}
                                    onChange={(e) => updateOption('pollOption4', e.target.value)}
                                    placeholder="Enter poll option"
                                    maxLength={25}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pollDuration">Poll Duration</Label>
                                <Select
                                    value={options.pollDuration || '1440'}
                                    onValueChange={(value) => updateOption('pollDuration', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="60">1 hour</SelectItem>
                                        <SelectItem value="360">6 hours</SelectItem>
                                        <SelectItem value="720">12 hours</SelectItem>
                                        <SelectItem value="1440">1 day</SelectItem>
                                        <SelectItem value="2880">2 days</SelectItem>
                                        <SelectItem value="4320">3 days</SelectItem>
                                        <SelectItem value="10080">7 days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Location */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="addLocation"
                            checked={options.addLocation || false}
                            onCheckedChange={(checked) => updateOption('addLocation', checked)}
                        />
                        <Label htmlFor="addLocation">Add location to post</Label>
                    </div>
                    
                    {options.addLocation && (
                        <Input
                            placeholder="Enter location"
                            value={options.location || ''}
                            onChange={(e) => updateOption('location', e.target.value)}
                            className="ml-6"
                        />
                    )}
                </div>

                {/* Thread Options */}
                <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isThread"
                            checked={options.isThread || false}
                            onCheckedChange={(checked) => updateOption('isThread', checked)}
                        />
                        <Label htmlFor="isThread">This is part of a thread</Label>
                    </div>
                    
                    {options.isThread && (
                        <div className="ml-6 p-3 border rounded-lg space-y-2">
                            <Label htmlFor="threadId">Reply to Tweet ID (optional)</Label>
                            <Input
                                id="threadId"
                                value={options.threadId || ''}
                                onChange={(e) => updateOption('threadId', e.target.value)}
                                placeholder="Tweet ID to reply to"
                            />
                            <p className="text-xs text-muted-foreground">
                                Leave empty to create a new thread
                            </p>
                        </div>
                    )}
                </div>

                {/* Boost Options */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="boostTweet"
                            checked={options.boostTweet || false}
                            onCheckedChange={(checked) => updateOption('boostTweet', checked)}
                        />
                        <Label htmlFor="boostTweet">
                            Boost this tweet
                            <Badge variant="secondary" className="ml-2">Paid feature</Badge>
                        </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Promote your tweet to reach more people (requires Twitter Ads account)
                    </p>
                </div>

                {/* Alt Text for Video */}
                <div className="space-y-2">
                    <Label htmlFor="altText">Alt Text for Video (Accessibility)</Label>
                    <Textarea
                        id="altText"
                        value={options.altText || ''}
                        onChange={(e) => updateOption('altText', e.target.value)}
                        placeholder="Describe your video for visually impaired users"
                        rows={2}
                        maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground">
                        {(options.altText || '').length}/1000 characters
                    </p>
                </div>

                {/* Super Follows */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="superFollowsOnly"
                            checked={options.superFollowsOnly || false}
                            onCheckedChange={(checked) => updateOption('superFollowsOnly', checked)}
                        />
                        <Label htmlFor="superFollowsOnly">
                            Super Follows only
                            <Badge variant="outline" className="ml-2">Premium</Badge>
                        </Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Only your Super Followers can see this tweet
                    </p>
                </div>
            </CardContent>
        </Card>
    );
} 