import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Tag, MessageCircle } from 'lucide-react';

interface FacebookOptionsProps {
    options: any;
    onChange: (options: any) => void;
}

export default function FacebookOptions({ options, onChange }: FacebookOptionsProps) {
    const updateOption = (key: string, value: any) => {
        onChange({ ...options, [key]: value });
    };

    const privacySettings = [
        { id: 'EVERYONE', name: 'Public', description: 'Anyone on or off Facebook' },
        { id: 'ALL_FRIENDS', name: 'Friends', description: 'Your friends on Facebook' },
        { id: 'FRIENDS_OF_FRIENDS', name: 'Friends of friends', description: 'Your friends and their friends' },
        { id: 'SELF', name: 'Only me', description: 'Only you can see this' },
        { id: 'CUSTOM', name: 'Custom', description: 'Specific friends or lists' },
    ];

    const videoTypes = [
        { id: 'REGULAR', name: 'Regular Video', description: 'Standard video post' },
        { id: 'REEL', name: 'Facebook Reel', description: 'Short-form vertical video' },
        { id: 'STORY', name: 'Facebook Story', description: '24-hour temporary content' },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook Advanced Options
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Privacy Settings */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Privacy Settings</Label>
                    <RadioGroup
                        value={options.privacy || 'EVERYONE'}
                        onValueChange={(value) => updateOption('privacy', value)}
                    >
                        {privacySettings.map((setting) => (
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

                {/* Video Type */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Video Type</Label>
                    <RadioGroup
                        value={options.videoType || 'REGULAR'}
                        onValueChange={(value) => updateOption('videoType', value)}
                    >
                        {videoTypes.map((type) => (
                            <div key={type.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={type.id} id={type.id} />
                                <div>
                                    <Label htmlFor={type.id} className="font-medium">{type.name}</Label>
                                    <p className="text-xs text-muted-foreground">{type.description}</p>
                                </div>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                {/* Caption */}
                <div className="space-y-2">
                    <Label htmlFor="message">Post Caption</Label>
                    <Textarea
                        id="message"
                        value={options.message || ''}
                        onChange={(e) => updateOption('message', e.target.value)}
                        placeholder="What's on your mind?"
                        rows={4}
                        maxLength={63206}
                    />
                    <p className="text-xs text-muted-foreground">
                        {(options.message || '').length}/63206 characters
                    </p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                    <Label htmlFor="place" className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Location
                    </Label>
                    <Input
                        id="place"
                        value={options.place || ''}
                        onChange={(e) => updateOption('place', e.target.value)}
                        placeholder="Where are you?"
                    />
                </div>

                {/* Tags/Mentions */}
                <div className="space-y-2">
                    <Label htmlFor="tags" className="flex items-center">
                        <Tag className="w-4 h-4 mr-1" />
                        Tag People
                    </Label>
                    <Input
                        id="tags"
                        value={options.tags || ''}
                        onChange={(e) => updateOption('tags', e.target.value)}
                        placeholder="Tag friends (comma-separated usernames)"
                    />
                </div>

                {/* Feeling/Activity */}
                <div className="space-y-2">
                    <Label htmlFor="feeling">Feeling/Activity</Label>
                    <Select
                        value={options.feeling || ''}
                        onValueChange={(value) => updateOption('feeling', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="How are you feeling?" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            <SelectItem value="happy">😊 Happy</SelectItem>
                            <SelectItem value="excited">🤩 Excited</SelectItem>
                            <SelectItem value="grateful">🙏 Grateful</SelectItem>
                            <SelectItem value="proud">😎 Proud</SelectItem>
                            <SelectItem value="blessed">✨ Blessed</SelectItem>
                            <SelectItem value="motivated">💪 Motivated</SelectItem>
                            <SelectItem value="relaxed">😌 Relaxed</SelectItem>
                            <SelectItem value="creative">🎨 Creative</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Audience Restrictions */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Audience Settings</Label>
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
                                id="allowSharing"
                                checked={options.allowSharing !== false}
                                onCheckedChange={(checked) => updateOption('allowSharing', checked)}
                            />
                            <Label htmlFor="allowSharing">Allow sharing</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="allowEmbedding"
                                checked={options.allowEmbedding !== false}
                                onCheckedChange={(checked) => updateOption('allowEmbedding', checked)}
                            />
                            <Label htmlFor="allowEmbedding">Allow embedding</Label>
                        </div>
                    </div>
                </div>

                {/* Content Settings */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Content Settings</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="brandedContent"
                                checked={options.brandedContent || false}
                                onCheckedChange={(checked) => updateOption('brandedContent', checked)}
                            />
                            <Label htmlFor="brandedContent">
                                Branded content
                                <Badge variant="outline" className="ml-2">Paid partnership</Badge>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="newsworthy"
                                checked={options.newsworthy || false}
                                onCheckedChange={(checked) => updateOption('newsworthy', checked)}
                            />
                            <Label htmlFor="newsworthy">This content is newsworthy</Label>
                        </div>
                    </div>
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience (Optional)</Label>
                    <Select
                        value={options.targetAudience || ''}
                        onValueChange={(value) => updateOption('targetAudience', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select target audience" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">No targeting</SelectItem>
                            <SelectItem value="18-24">18-24 years old</SelectItem>
                            <SelectItem value="25-34">25-34 years old</SelectItem>
                            <SelectItem value="35-44">35-44 years old</SelectItem>
                            <SelectItem value="45-54">45-54 years old</SelectItem>
                            <SelectItem value="55+">55+ years old</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Call to Action */}
                <div className="space-y-2">
                    <Label htmlFor="callToAction">Call to Action</Label>
                    <Select
                        value={options.callToAction || ''}
                        onValueChange={(value) => updateOption('callToAction', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Add call to action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">No call to action</SelectItem>
                            <SelectItem value="LEARN_MORE">Learn More</SelectItem>
                            <SelectItem value="SHOP_NOW">Shop Now</SelectItem>
                            <SelectItem value="SIGN_UP">Sign Up</SelectItem>
                            <SelectItem value="DOWNLOAD">Download</SelectItem>
                            <SelectItem value="WATCH_MORE">Watch More</SelectItem>
                            <SelectItem value="CONTACT_US">Contact Us</SelectItem>
                        </SelectContent>
                    </Select>
                    {options.callToAction && (
                        <Input
                            placeholder="Call to action URL"
                            value={options.callToActionUrl || ''}
                            onChange={(e) => updateOption('callToActionUrl', e.target.value)}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 