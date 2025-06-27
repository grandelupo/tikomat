import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin, Tag, MessageCircle, Hash, Shield } from 'lucide-react';
import HashtagValidationWarning from '@/components/HashtagValidationWarning';

interface FacebookOptionsProps {
    options: any;
    onChange: (options: any) => void;
}

export default function FacebookOptions({ options, onChange }: FacebookOptionsProps) {
    const updateOption = (key: string, value: any) => {
        try {
            const newOptions = { ...options, [key]: value };
            onChange(newOptions);
        } catch (error) {
            console.error('Error updating Facebook option:', error);
        }
    };

    const privacySettings = [
        { id: 'EVERYONE', name: 'Public', description: 'Anyone on or off Facebook' },
        { id: 'ALL_FRIENDS', name: 'Friends', description: 'Your friends on Facebook' },
        { id: 'FRIENDS_OF_FRIENDS', name: 'Friends of friends', description: 'Your friends and their friends' },
        { id: 'SELF', name: 'Only me', description: 'Only you can see this' },
    ];

    const videoTypes = [
        { id: 'REGULAR', name: 'Regular Video', description: 'Standard video post' },
        { id: 'REEL', name: 'Facebook Reel', description: 'Short-form vertical video' },
    ];

    const safeOptions = options || {};

    // Get content for hashtag validation
    const getContentForValidation = () => {
        let content = '';
        if (safeOptions.message) {
            content += safeOptions.message + ' ';
        }
        if (safeOptions.tags) {
            const tags = Array.isArray(safeOptions.tags) 
                ? safeOptions.tags.join(' ') 
                : safeOptions.tags;
            content += tags;
        }
        return content;
    };

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
                {/* Hashtag Validation Warning */}
                <HashtagValidationWarning
                    platform="facebook"
                    content={getContentForValidation()}
                />

                {/* Privacy Settings */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Privacy Settings</Label>
                    <RadioGroup
                        value={safeOptions.privacy || 'EVERYONE'}
                        onValueChange={(value) => updateOption('privacy', value)}
                    >
                        {privacySettings.map((setting) => (
                            <div key={setting.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={setting.id} id={`privacy-${setting.id}`} />
                                <div>
                                    <Label htmlFor={`privacy-${setting.id}`} className="font-medium">{setting.name}</Label>
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
                        value={safeOptions.videoType || 'REGULAR'}
                        onValueChange={(value) => updateOption('videoType', value)}
                    >
                        {videoTypes.map((type) => (
                            <div key={type.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={type.id} id={`videoType-${type.id}`} />
                                <div>
                                    <Label htmlFor={`videoType-${type.id}`} className="font-medium">{type.name}</Label>
                                    <p className="text-xs text-muted-foreground">{type.description}</p>
                                </div>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                {/* Caption */}
                <div className="space-y-2">
                    <Label htmlFor="fb-message">Post Caption</Label>
                    <Textarea
                        id="fb-message"
                        value={safeOptions.message || ''}
                        onChange={(e) => updateOption('message', e.target.value)}
                        placeholder="What's on your mind?"
                        rows={4}
                        maxLength={63206}
                    />
                    <p className="text-xs text-muted-foreground">
                        {(safeOptions.message || '').length}/63206 characters
                    </p>
                    <p className="text-xs text-amber-600">
                        Note: Platform-specific hashtags like #instagram, #tiktok, #youtube will be automatically removed
                    </p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                    <Label htmlFor="fb-place" className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Location
                    </Label>
                    <Input
                        id="fb-place"
                        value={safeOptions.place || ''}
                        onChange={(e) => updateOption('place', e.target.value)}
                        placeholder="Where are you?"
                    />
                </div>

                {/* Tags/Mentions */}
                <div className="space-y-2">
                    <Label htmlFor="fb-tags" className="flex items-center">
                        <Tag className="w-4 h-4 mr-1" />
                        Tag People
                    </Label>
                    <Input
                        id="fb-tags"
                        value={safeOptions.tags || ''}
                        onChange={(e) => updateOption('tags', e.target.value)}
                        placeholder="Tag friends (comma-separated usernames)"
                    />
                </div>

                {/* Audience Settings */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Audience Settings</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="fb-allowComments"
                                checked={safeOptions.allowComments !== false}
                                onCheckedChange={(checked) => updateOption('allowComments', checked)}
                            />
                            <Label htmlFor="fb-allowComments" className="flex items-center">
                                <MessageCircle className="w-4 h-4 mr-1" />
                                Allow comments
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="fb-allowSharing"
                                checked={safeOptions.allowSharing !== false}
                                onCheckedChange={(checked) => updateOption('allowSharing', checked)}
                            />
                            <Label htmlFor="fb-allowSharing">Allow sharing</Label>
                        </div>
                    </div>
                </div>

                {/* Content Settings */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Content Settings</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="fb-brandedContent"
                                checked={safeOptions.brandedContent || false}
                                onCheckedChange={(checked) => updateOption('brandedContent', checked)}
                            />
                            <Label htmlFor="fb-brandedContent">
                                Branded content
                                <Badge variant="outline" className="ml-2">Paid partnership</Badge>
                            </Label>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
} 