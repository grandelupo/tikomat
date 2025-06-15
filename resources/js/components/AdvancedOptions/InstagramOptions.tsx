import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Hash, Users, MessageCircle, Image } from 'lucide-react';

interface InstagramOptionsProps {
    options: any;
    onChange: (options: any) => void;
}

export default function InstagramOptions({ options, onChange }: InstagramOptionsProps) {
    const updateOption = (key: string, value: any) => {
        onChange({ ...options, [key]: value });
    };

    const videoTypes = [
        { id: 'REELS', name: 'Instagram Reel', description: 'Short-form vertical video' },
        { id: 'VIDEO', name: 'Instagram Video', description: 'Regular video post' },
        { id: 'STORY', name: 'Instagram Story', description: '24-hour temporary content' },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-pink-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram Advanced Options
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Video Type */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Video Type</Label>
                    <RadioGroup
                        value={options.videoType || 'REELS'}
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
                    <Label htmlFor="caption" className="flex items-center">
                        <Hash className="w-4 h-4 mr-1" />
                        Caption & Hashtags
                    </Label>
                    <Textarea
                        id="caption"
                        value={options.caption || ''}
                        onChange={(e) => updateOption('caption', e.target.value)}
                        placeholder="Write a caption... #instagram #reels #viral"
                        rows={4}
                        maxLength={2200}
                    />
                    <p className="text-xs text-muted-foreground">
                        {(options.caption || '').length}/2200 characters
                    </p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        Location
                    </Label>
                    <Input
                        id="location"
                        value={options.location || ''}
                        onChange={(e) => updateOption('location', e.target.value)}
                        placeholder="Add location (e.g., New York, NY)"
                    />
                    <p className="text-xs text-muted-foreground">
                        Help people discover your content by location
                    </p>
                </div>

                {/* Alt Text */}
                <div className="space-y-2">
                    <Label htmlFor="altText">Alt Text (Accessibility)</Label>
                    <Textarea
                        id="altText"
                        value={options.altText || ''}
                        onChange={(e) => updateOption('altText', e.target.value)}
                        placeholder="Describe your video for visually impaired users"
                        rows={2}
                        maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                        {(options.altText || '').length}/100 characters
                    </p>
                </div>

                {/* Cover Image */}
                <div className="space-y-2">
                    <Label htmlFor="coverImage">Cover Image</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <Image className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <Input
                            id="coverImage"
                            type="file"
                            accept="image/*"
                            onChange={(e) => updateOption('coverImage', e.target.files?.[0])}
                            className="hidden"
                        />
                        <Label htmlFor="coverImage" className="cursor-pointer">
                            <span className="text-sm font-medium text-gray-900">Upload cover image</span>
                            <span className="block text-xs text-gray-500">JPEG, PNG (1080x1080 recommended)</span>
                        </Label>
                    </div>
                    {options.coverImage && (
                        <p className="text-sm text-green-600">
                            Selected: {options.coverImage.name}
                        </p>
                    )}
                </div>

                {/* Audience Settings */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Audience & Interaction</Label>
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
                                id="hideLikesAndViews"
                                checked={options.hideLikesAndViews || false}
                                onCheckedChange={(checked) => updateOption('hideLikesAndViews', checked)}
                            />
                            <Label htmlFor="hideLikesAndViews">Hide like and view counts</Label>
                        </div>
                    </div>
                </div>

                {/* Branded Content */}
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
                                Paid partnership
                                <Badge variant="outline" className="ml-2">Required by law</Badge>
                            </Label>
                        </div>
                        {options.brandedContent && (
                            <Input
                                placeholder="Partner business name"
                                value={options.partnerName || ''}
                                onChange={(e) => updateOption('partnerName', e.target.value)}
                            />
                        )}
                    </div>
                </div>

                {/* Music */}
                <div className="space-y-2">
                    <Label htmlFor="music" className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12c0-1.636-.492-3.154-1.343-4.243a1 1 0 010-1.414z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M13.828 8.172a1 1 0 011.414 0A5.983 5.983 0 0117 12a5.983 5.983 0 01-1.758 3.828 1 1 0 11-1.414-1.414A3.987 3.987 0 0015 12a3.987 3.987 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Background Music
                    </Label>
                    <Input
                        id="music"
                        value={options.music || ''}
                        onChange={(e) => updateOption('music', e.target.value)}
                        placeholder="Search Instagram's music library"
                    />
                    <p className="text-xs text-muted-foreground">
                        Add trending music to increase reach
                    </p>
                </div>

                {/* Audience Restrictions */}
                <div className="space-y-2">
                    <Label htmlFor="audienceRestriction">Age Restriction</Label>
                    <Select
                        value={options.audienceRestriction || 'none'}
                        onValueChange={(value) => updateOption('audienceRestriction', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select restriction" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">No restriction</SelectItem>
                            <SelectItem value="13+">13+ years</SelectItem>
                            <SelectItem value="18+">18+ years</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Cross-posting */}
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="shareToFacebook"
                            checked={options.shareToFacebook || false}
                            onCheckedChange={(checked) => updateOption('shareToFacebook', checked)}
                        />
                        <Label htmlFor="shareToFacebook">Also share to Facebook</Label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Cross-post to your connected Facebook account
                    </p>
                </div>
            </CardContent>
        </Card>
    );
} 