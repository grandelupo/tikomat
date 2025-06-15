import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, Image } from 'lucide-react';

interface YouTubeOptionsProps {
    options: any;
    onChange: (options: any) => void;
}

export default function YouTubeOptions({ options, onChange }: YouTubeOptionsProps) {
    const updateOption = (key: string, value: any) => {
        onChange({ ...options, [key]: value });
    };

    const categories = [
        { id: '1', name: 'Film & Animation' },
        { id: '2', name: 'Autos & Vehicles' },
        { id: '10', name: 'Music' },
        { id: '15', name: 'Pets & Animals' },
        { id: '17', name: 'Sports' },
        { id: '19', name: 'Travel & Events' },
        { id: '20', name: 'Gaming' },
        { id: '22', name: 'People & Blogs' },
        { id: '23', name: 'Comedy' },
        { id: '24', name: 'Entertainment' },
        { id: '25', name: 'News & Politics' },
        { id: '26', name: 'Howto & Style' },
        { id: '27', name: 'Education' },
        { id: '28', name: 'Science & Technology' },
    ];

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
        { code: 'fr', name: 'French' },
        { code: 'de', name: 'German' },
        { code: 'it', name: 'Italian' },
        { code: 'pt', name: 'Portuguese' },
        { code: 'ru', name: 'Russian' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' },
        { code: 'zh', name: 'Chinese' },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <svg className="w-5 h-5 mr-2 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    YouTube Advanced Options
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Privacy Settings */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Privacy Settings</Label>
                    <RadioGroup
                        value={options.privacy || 'public'}
                        onValueChange={(value) => updateOption('privacy', value)}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="public" id="public" />
                            <Label htmlFor="public">Public - Anyone can search for and view</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="unlisted" id="unlisted" />
                            <Label htmlFor="unlisted">Unlisted - Anyone with the link can view</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="private" id="private" />
                            <Label htmlFor="private">Private - Only you can view</Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Video Type */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Video Type</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isShort"
                                checked={options.isShort || false}
                                onCheckedChange={(checked) => updateOption('isShort', checked)}
                            />
                            <Label htmlFor="isShort" className="flex items-center">
                                YouTube Short
                                <Badge variant="secondary" className="ml-2">Vertical video &lt;60s</Badge>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="madeForKids"
                                checked={options.madeForKids || false}
                                onCheckedChange={(checked) => updateOption('madeForKids', checked)}
                            />
                            <Label htmlFor="madeForKids" className="flex items-center">
                                Made for kids
                                <Badge variant="outline" className="ml-2">COPPA</Badge>
                            </Label>
                        </div>
                    </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                        value={options.categoryId || '24'}
                        onValueChange={(value) => updateOption('categoryId', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input
                        id="tags"
                        value={options.tags || ''}
                        onChange={(e) => updateOption('tags', e.target.value)}
                        placeholder="gaming, tutorial, entertainment"
                    />
                    <p className="text-xs text-muted-foreground">
                        Help people discover your video with relevant tags
                    </p>
                </div>

                {/* Language */}
                <div className="space-y-2">
                    <Label htmlFor="language">Video Language</Label>
                    <Select
                        value={options.defaultLanguage || 'en'}
                        onValueChange={(value) => updateOption('defaultLanguage', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                            {languages.map((language) => (
                                <SelectItem key={language.code} value={language.code}>
                                    {language.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Custom Thumbnail */}
                <div className="space-y-2">
                    <Label htmlFor="customThumbnail">Custom Thumbnail</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <Image className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <Input
                            id="customThumbnail"
                            type="file"
                            accept="image/*"
                            onChange={(e) => updateOption('customThumbnail', e.target.files?.[0])}
                            className="hidden"
                        />
                        <Label htmlFor="customThumbnail" className="cursor-pointer">
                            <span className="text-sm font-medium text-gray-900">Upload thumbnail</span>
                            <span className="block text-xs text-gray-500">PNG, JPG up to 2MB (1280x720 recommended)</span>
                        </Label>
                    </div>
                    {options.customThumbnail && (
                        <p className="text-sm text-green-600">
                            Selected: {options.customThumbnail.name}
                        </p>
                    )}
                </div>

                {/* Comments and Ratings */}
                <div className="space-y-3">
                    <Label className="text-base font-medium">Interaction Settings</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="commentsDisabled"
                                checked={options.commentsDisabled || false}
                                onCheckedChange={(checked) => updateOption('commentsDisabled', checked)}
                            />
                            <Label htmlFor="commentsDisabled">Disable comments</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="ratingsDisabled"
                                checked={options.ratingsDisabled || false}
                                onCheckedChange={(checked) => updateOption('ratingsDisabled', checked)}
                            />
                            <Label htmlFor="ratingsDisabled">Disable ratings (likes/dislikes)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="embeddable"
                                checked={options.embeddable !== false}
                                onCheckedChange={(checked) => updateOption('embeddable', checked)}
                            />
                            <Label htmlFor="embeddable">Allow embedding on other websites</Label>
                        </div>
                    </div>
                </div>

                {/* License */}
                <div className="space-y-2">
                    <Label htmlFor="license">License</Label>
                    <Select
                        value={options.license || 'youtube'}
                        onValueChange={(value) => updateOption('license', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select license" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="youtube">Standard YouTube License</SelectItem>
                            <SelectItem value="creativeCommon">Creative Commons - Attribution</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>
    );
} 