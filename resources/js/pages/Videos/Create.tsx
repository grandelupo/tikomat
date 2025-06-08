import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Upload, Youtube, Instagram, Video as VideoIcon, Calendar, Clock } from 'lucide-react';

interface CreateVideoProps {
    // Add any props passed from the controller
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Upload Video',
        href: '/videos/create',
    },
];

const platforms = [
    { id: 'youtube', name: 'YouTube', icon: Youtube },
    { id: 'instagram', name: 'Instagram', icon: Instagram },
    { id: 'tiktok', name: 'TikTok', icon: VideoIcon },
];

export default function CreateVideo({}: CreateVideoProps) {
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [publishType, setPublishType] = useState<'now' | 'scheduled'>('now');

    const { data, setData, post, processing, errors, progress } = useForm({
        video: null as File | null,
        title: '',
        description: '',
        platforms: [] as string[],
        publish_type: 'now',
        publish_at: '',
    });

    const handlePlatformChange = (platformId: string, checked: boolean) => {
        let newPlatforms: string[];
        if (checked) {
            newPlatforms = [...selectedPlatforms, platformId];
        } else {
            newPlatforms = selectedPlatforms.filter(p => p !== platformId);
        }
        setSelectedPlatforms(newPlatforms);
        setData('platforms', newPlatforms);
    };

    const handlePublishTypeChange = (value: 'now' | 'scheduled') => {
        setPublishType(value);
        setData('publish_type', value);
        if (value === 'now') {
            setData('publish_at', '');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/videos');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('video', file);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Upload Video" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Upload Video</h1>
                    <p className="text-muted-foreground">
                        Upload a video to publish across your connected social media platforms
                    </p>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Video Details</CardTitle>
                        <CardDescription>
                            Upload your video file and provide details for publishing
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Video Upload */}
                            <div className="space-y-2">
                                <Label htmlFor="video">Video File</Label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="mt-4">
                                        <Label htmlFor="video" className="cursor-pointer">
                                            <span className="mt-2 block text-sm font-medium text-gray-900">
                                                Click to upload or drag and drop
                                            </span>
                                            <span className="mt-1 block text-xs text-gray-500">
                                                MP4, MOV, AVI, WMV, WebM up to 100MB (max 60 seconds)
                                            </span>
                                        </Label>
                                        <Input
                                            id="video"
                                            type="file"
                                            accept="video/*"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>
                                {data.video && (
                                    <p className="text-sm text-green-600">
                                        Selected: {data.video.name}
                                    </p>
                                )}
                                {errors.video && (
                                    <p className="text-sm text-red-600">{errors.video}</p>
                                )}
                                {progress && (
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress.percentage}%` }}
                                        ></div>
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div className="space-y-2">
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Enter video title"
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-600">{errors.title}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Enter video description"
                                    rows={4}
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-600">{errors.description}</p>
                                )}
                            </div>

                            {/* Platform Selection */}
                            <div className="space-y-3">
                                <Label>Select Platforms</Label>
                                <div className="grid grid-cols-1 gap-3">
                                    {platforms.map((platform) => {
                                        const IconComponent = platform.icon;
                                        return (
                                            <div key={platform.id} className="flex items-center space-x-3">
                                                <Checkbox
                                                    id={platform.id}
                                                    checked={selectedPlatforms.includes(platform.id)}
                                                    onCheckedChange={(checked) => 
                                                        handlePlatformChange(platform.id, checked as boolean)
                                                    }
                                                />
                                                <Label 
                                                    htmlFor={platform.id}
                                                    className="flex items-center space-x-2 cursor-pointer"
                                                >
                                                    <IconComponent className="h-4 w-4" />
                                                    <span>{platform.name}</span>
                                                </Label>
                                            </div>
                                        );
                                    })}
                                </div>
                                {errors.platforms && (
                                    <p className="text-sm text-red-600">{errors.platforms}</p>
                                )}
                            </div>

                            {/* Publishing Options */}
                            <div className="space-y-3">
                                <Label>Publishing Options</Label>
                                <RadioGroup 
                                    value={publishType} 
                                    onValueChange={handlePublishTypeChange}
                                >
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="now" id="now" />
                                        <Label htmlFor="now" className="flex items-center space-x-2 cursor-pointer">
                                            <Clock className="h-4 w-4" />
                                            <span>Publish now</span>
                                        </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="scheduled" id="scheduled" />
                                        <Label htmlFor="scheduled" className="flex items-center space-x-2 cursor-pointer">
                                            <Calendar className="h-4 w-4" />
                                            <span>Schedule for later</span>
                                        </Label>
                                    </div>
                                </RadioGroup>

                                {publishType === 'scheduled' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="publish_at">Publish Date & Time</Label>
                                        <Input
                                            id="publish_at"
                                            type="datetime-local"
                                            value={data.publish_at}
                                            onChange={(e) => setData('publish_at', e.target.value)}
                                            min={new Date().toISOString().slice(0, 16)}
                                        />
                                        {errors.publish_at && (
                                            <p className="text-sm text-red-600">{errors.publish_at}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end space-x-4">
                                <Button 
                                    type="button" 
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    type="submit" 
                                    disabled={processing || !data.video || selectedPlatforms.length === 0}
                                >
                                    {processing ? 'Uploading...' : 'Upload Video'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 