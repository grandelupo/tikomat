import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Palette, Tag, Users, Link, Eye } from 'lucide-react';

interface PinterestOptionsProps {
    options: any;
    onChange: (options: any) => void;
}

export default function PinterestOptions({ options, onChange }: PinterestOptionsProps) {
    // Add error boundary to prevent crashes
    const updateOption = (key: string, value: any) => {
        try {
            const newOptions = { ...options, [key]: value };
            onChange(newOptions);
        } catch (error) {
            console.error('Error updating Pinterest option:', error);
        }
    };

    const pinTypes = [
        { id: 'STANDARD', name: 'Standard Pin', description: 'Regular video pin' },
        { id: 'VIDEO', name: 'Video Pin', description: 'Optimized for video content' },
        { id: 'STORY', name: 'Story Pin', description: 'Multi-page story format' },
    ];

    const boardPrivacy = [
        { id: 'PUBLIC', name: 'Public', description: 'Anyone can see this pin' },
        { id: 'SECRET', name: 'Secret', description: 'Only you and collaborators can see' },
    ];

    // Ensure options is always an object
    const safeOptions = options || {};

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Palette className="w-5 h-5 mr-2 text-red-500" />
                    Pinterest Advanced Options
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Pin Type */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Pin Type</Label>
                    <RadioGroup
                        value={safeOptions.pinType || 'VIDEO'}
                        onValueChange={(value) => updateOption('pinType', value)}
                    >
                        {pinTypes.map((type) => (
                            <div key={type.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={type.id} id={`pinterest-pin-${type.id}`} />
                                <div>
                                    <Label htmlFor={`pinterest-pin-${type.id}`} className="font-medium">{type.name}</Label>
                                    <p className="text-xs text-muted-foreground">{type.description}</p>
                                </div>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                {/* Pin Title */}
                <div className="space-y-2">
                    <Label htmlFor="pinterest-title">Pin Title</Label>
                    <Input
                        id="pinterest-title"
                        value={safeOptions.title || ''}
                        onChange={(e) => updateOption('title', e.target.value)}
                        placeholder="Create an eye-catching title..."
                        maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground">
                        {(safeOptions.title || '').length}/100 characters
                    </p>
                </div>

                {/* Pin Description */}
                <div className="space-y-2">
                    <Label htmlFor="pinterest-description">Pin Description</Label>
                    <Textarea
                        id="pinterest-description"
                        value={safeOptions.description || ''}
                        onChange={(e) => updateOption('description', e.target.value)}
                        placeholder="Describe your video to help people discover it..."
                        rows={4}
                        maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                        {(safeOptions.description || '').length}/500 characters
                    </p>
                </div>

                {/* Board Selection */}
                <div className="space-y-2">
                    <Label htmlFor="pinterest-board">Board</Label>
                    <Input
                        id="pinterest-board"
                        value={safeOptions.boardName || ''}
                        onChange={(e) => updateOption('boardName', e.target.value)}
                        placeholder="Board name (leave empty to use default)"
                    />
                    <p className="text-xs text-muted-foreground">
                        If empty, will use existing board or create "Filmate Videos"
                    </p>
                </div>

                {/* Board Privacy */}
                <div className="space-y-3">
                    <Label className="text-base font-medium flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        Board Privacy
                    </Label>
                    <RadioGroup
                        value={safeOptions.boardPrivacy || 'PUBLIC'}
                        onValueChange={(value) => updateOption('boardPrivacy', value)}
                    >
                        {boardPrivacy.map((privacy) => (
                            <div key={privacy.id} className="flex items-center space-x-2">
                                <RadioGroupItem value={privacy.id} id={`pinterest-privacy-${privacy.id}`} />
                                <div>
                                    <Label htmlFor={`pinterest-privacy-${privacy.id}`} className="font-medium">{privacy.name}</Label>
                                    <p className="text-xs text-muted-foreground">{privacy.description}</p>
                                </div>
                            </div>
                        ))}
                    </RadioGroup>
                </div>

                {/* Keywords/Tags */}
                <div className="space-y-2">
                    <Label htmlFor="pinterest-keywords" className="flex items-center">
                        <Tag className="w-4 h-4 mr-1" />
                        Keywords & Tags
                    </Label>
                    <Input
                        id="pinterest-keywords"
                        value={safeOptions.keywords || ''}
                        onChange={(e) => updateOption('keywords', e.target.value)}
                        placeholder="video, tutorial, diy, creative, inspiration"
                    />
                    <p className="text-xs text-muted-foreground">
                        Separate keywords with commas. Use relevant terms people search for.
                    </p>
                </div>

                {/* Website Link */}
                <div className="space-y-2">
                    <Label htmlFor="pinterest-link" className="flex items-center">
                        <Link className="w-4 h-4 mr-1" />
                        Website Link (Optional)
                    </Label>
                    <Input
                        id="pinterest-link"
                        value={safeOptions.link || ''}
                        onChange={(e) => updateOption('link', e.target.value)}
                        placeholder="https://your-website.com"
                        type="url"
                    />
                    <p className="text-xs text-muted-foreground">
                        Link to your website or relevant page
                    </p>
                </div>

                {/* Alt Text */}
                <div className="space-y-2">
                    <Label htmlFor="pinterest-altText">Alt Text (Accessibility)</Label>
                    <Input
                        id="pinterest-altText"
                        value={safeOptions.altText || ''}
                        onChange={(e) => updateOption('altText', e.target.value)}
                        placeholder="Describe your video for screen readers"
                        maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground">
                        {(safeOptions.altText || '').length}/500 characters
                    </p>
                </div>

                {/* Pinterest Settings */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Pinterest Settings</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="pinterest-allowComments"
                                checked={safeOptions.allowComments !== false}
                                onCheckedChange={(checked) => updateOption('allowComments', checked)}
                            />
                            <Label htmlFor="pinterest-allowComments">Allow comments</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="pinterest-enableShopping"
                                checked={safeOptions.enableShopping || false}
                                onCheckedChange={(checked) => updateOption('enableShopping', checked)}
                            />
                            <Label htmlFor="pinterest-enableShopping">
                                Enable shopping features
                                <Badge variant="outline" className="ml-2">Business accounts</Badge>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="pinterest-trackAnalytics"
                                checked={safeOptions.trackAnalytics !== false}
                                onCheckedChange={(checked) => updateOption('trackAnalytics', checked)}
                            />
                            <Label htmlFor="pinterest-trackAnalytics">Track analytics</Label>
                        </div>
                    </div>
                </div>

                {/* Story Pin Settings (only if Story Pin is selected) */}
                {safeOptions.pinType === 'STORY' && (
                    <div className="space-y-3">
                        <Label className="text-base font-medium">Story Pin Settings</Label>
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="pinterest-allowStitching"
                                    checked={safeOptions.allowStitching !== false}
                                    onCheckedChange={(checked) => updateOption('allowStitching', checked)}
                                />
                                <Label htmlFor="pinterest-allowStitching">Allow stitching</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="pinterest-showTitle"
                                    checked={safeOptions.showTitle !== false}
                                    onCheckedChange={(checked) => updateOption('showTitle', checked)}
                                />
                                <Label htmlFor="pinterest-showTitle">Show title on pin</Label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Target Audience */}
                <div className="space-y-2">
                    <Label htmlFor="pinterest-audience" className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        Target Audience
                    </Label>
                    <Select
                        value={safeOptions.audience || 'GENERAL'}
                        onValueChange={(value) => updateOption('audience', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select target audience" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="GENERAL">General audience</SelectItem>
                            <SelectItem value="WOMEN">Women</SelectItem>
                            <SelectItem value="MEN">Men</SelectItem>
                            <SelectItem value="TEENS">Teens (13-17)</SelectItem>
                            <SelectItem value="YOUNG_ADULTS">Young adults (18-24)</SelectItem>
                            <SelectItem value="ADULTS">Adults (25-44)</SelectItem>
                            <SelectItem value="SENIORS">Seniors (45+)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
}