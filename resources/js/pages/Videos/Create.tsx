import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm, Link } from '@inertiajs/react';
import { Upload, Youtube, Instagram, Video as VideoIcon, Calendar, Clock, ArrowLeft, Info, Facebook, Twitter, Camera, Palette, Cloud } from 'lucide-react';
import CloudStorageImport from '@/components/CloudStorageImport';
import AdvancedOptionsSection from '@/components/AdvancedOptions/AdvancedOptionsSection';

interface Channel {
    id: number;
    name: string;
    slug: string;
}

interface CreateVideoProps {
    channel: Channel;
    availablePlatforms: string[];
    defaultPlatforms: string[];
    connectedPlatforms: string[];
    allowedPlatforms: string[];
}

const platformData = {
    youtube: { name: 'YouTube', icon: Youtube, color: 'text-red-600' },
    instagram: { name: 'Instagram', icon: Instagram, color: 'text-pink-600' },
    tiktok: { name: 'TikTok', icon: VideoIcon, color: 'text-black' },
    facebook: { name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    snapchat: { name: 'Snapchat', icon: Camera, color: 'text-yellow-500' },
    pinterest: { name: 'Pinterest', icon: Palette, color: 'text-red-500' },
    twitter: { name: 'Twitter', icon: Twitter, color: 'text-blue-400' },
};

export default function CreateVideo({ 
    channel, 
    availablePlatforms, 
    defaultPlatforms, 
    connectedPlatforms, 
    allowedPlatforms 
}: CreateVideoProps) {
    // defaultPlatforms now only contains connected platforms (filtered in backend)
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(defaultPlatforms);
    const [publishType, setPublishType] = useState<'now' | 'scheduled'>('now');
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [clientErrors, setClientErrors] = useState<Record<string, string>>({});
    const [isCloudStorageOpen, setIsCloudStorageOpen] = useState(false);
    const [advancedOptions, setAdvancedOptions] = useState<Record<string, any>>({});

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'My channels',
            href: '/dashboard',
        },
        {
            title: channel.name,
            href: `/channels/${channel.slug}`,
        },
        {
            title: 'Upload Video',
            href: `/channels/${channel.slug}/videos/create`,
        },
    ];

    const { data, setData, post, processing, errors, progress } = useForm({
        video: null as File | null,
        title: '',
        description: '',
        platforms: defaultPlatforms,
        publish_type: 'now',
        publish_at: '',
        cloud_providers: [] as string[],
        advanced_options: {} as Record<string, any>,
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
        
        // Clear previous client errors
        setClientErrors({});
        
        // Run client-side validation
        if (!validateForm()) {
            return; // Stop submission if validation fails
        }
        
        // If validation passes, submit the form
        post(`/channels/${channel.slug}/videos`);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('video', file);
        }
    };

    const handleFileDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            const file = files[0];
            // Validate file type
            if (file.type.startsWith('video/')) {
                setData('video', file);
            } else {
                alert('Please select a valid video file');
            }
        }
    }, [setData]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const validateFile = (file: File): string | null => {
        // Check file size (100MB)
        if (file.size > 100 * 1024 * 1024) {
            return 'File size must be less than 100MB';
        }
        
        // Check file type
        if (!file.type.startsWith('video/')) {
            return 'Please select a valid video file';
        }
        
        return null;
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        
        // Validate title
        if (!data.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (data.title.length > 255) {
            newErrors.title = 'Title must be less than 255 characters';
        }

        // Description is optional now
        if (data.description && data.description.length > 1000) {
            newErrors.description = 'Description must be less than 1000 characters';
        }

        // Validate platforms
        if (selectedPlatforms.length === 0) {
            newErrors.platforms = 'Please select at least one platform';
        }

        // Validate scheduled date
        if (publishType === 'scheduled') {
            if (!data.publish_at) {
                newErrors.publish_at = 'Please select a publish date and time';
            } else {
                const publishDate = new Date(data.publish_at);
                const now = new Date();
                const minTime = new Date(now.getTime() + 5 * 60000); // 5 minutes from now
                
                if (publishDate <= minTime) {
                    newErrors.publish_at = 'Publish date must be at least 5 minutes from now';
                }
            }
        }

        // Validate video file
        if (!data.video) {
            newErrors.video = 'Please select a video file';
        } else {
            const fileError = validateFile(data.video);
            if (fileError) {
                newErrors.video = fileError;
            }
        }

        setClientErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCloudFileImported = (file: File, fileName: string) => {
        setData('video', file);
        setClientErrors(prev => ({ ...prev, video: '' }));
    };

    const handleAdvancedOptionsChange = (platform: string, options: any) => {
        const newAdvancedOptions = { ...advancedOptions, [platform]: options };
        setAdvancedOptions(newAdvancedOptions);
        setData('advanced_options', newAdvancedOptions);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Upload Video" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Upload Video to {channel.name}</h1>
                        <p className="text-muted-foreground">
                            Upload a video to publish across your connected social media platforms
                        </p>
                    </div>
                    <Link href={`/channels/${channel.slug}`}>
                        <Button variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Channel
                        </Button>
                    </Link>
                </div>

                {/* Platform Status Alert */}
                {availablePlatforms.length === 0 && (
                    <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                        <Info className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                            <strong>No connected platforms:</strong> You need to connect at least one social media platform to this channel before uploading videos.
                            <Link href={`/channels/${channel.slug}`} className="ml-1 underline">
                                Connect platforms now
                            </Link>
                        </AlertDescription>
                    </Alert>
                )}

                {allowedPlatforms.length === 1 && (
                    <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                            <strong>Free Plan:</strong> You currently have access to YouTube only. 
                            Upgrade to Pro to unlock Instagram and TikTok publishing.
                        </AlertDescription>
                    </Alert>
                )}

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
                                <div 
                                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                                        isDragOver 
                                            ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20' 
                                            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                                    }`}
                                    onDrop={handleFileDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                >
                                    <Upload className={`mx-auto h-12 w-12 ${isDragOver ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`} />
                                    <div className="mt-4">
                                        <Label htmlFor="video" className="cursor-pointer">
                                            <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {isDragOver ? 'Drop your video here' : 'Click to upload or drag and drop'}
                                            </span>
                                            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
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
                                    <div className="text-sm text-green-600 bg-green-50 p-2 rounded border border-green-200 dark:text-green-400 dark:bg-green-900/20 dark:border-green-800">
                                        <strong>Selected:</strong> {data.video.name} ({(data.video.size / (1024 * 1024)).toFixed(2)} MB)
                                    </div>
                                )}
                                {(errors.video || clientErrors.video) && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{errors.video || clientErrors.video}</p>
                                )}
                                
                                {/* Cloud Storage Import Option */}
                                <div className="flex items-center justify-center">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-px bg-gray-300 flex-1 dark:bg-gray-600"></div>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">or</span>
                                        <div className="h-px bg-gray-300 flex-1 dark:bg-gray-600"></div>
                                    </div>
                                </div>
                                
                                <div className="text-center">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCloudStorageOpen(true)}
                                        className="w-full sm:w-auto"
                                    >
                                        <Cloud className="w-4 h-4 mr-2" />
                                        Import from Cloud Storage
                                    </Button>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Import videos from Google Drive or Dropbox
                                    </p>
                                </div>

                                {progress && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm dark:text-gray-300">
                                            <span>Uploading...</span>
                                            <span>{progress.percentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                                            <div 
                                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${progress.percentage}%` }}
                                            ></div>
                                        </div>
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
                                {(errors.title || clientErrors.title) && (
                                    <p className="text-sm text-red-600">{errors.title || clientErrors.title}</p>
                                )}
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Enter video description"
                                    rows={4}
                                />
                                {(errors.description || clientErrors.description) && (
                                    <p className="text-sm text-red-600">{errors.description || clientErrors.description}</p>
                                )}
                            </div>

                            {/* Platform Selection */}
                            <div className="space-y-3">
                                <Label>Select Platforms</Label>
                                <p className="text-sm text-muted-foreground">
                                    Choose which platforms to publish this video to
                                </p>
                                <div className="grid grid-cols-1 gap-3">
                                    {Object.entries(platformData).map(([platformKey, platform]) => {
                                        const IconComponent = platform.icon;
                                        const isAvailable = availablePlatforms.includes(platformKey);
                                        const isConnected = connectedPlatforms.includes(platformKey);
                                        const isAllowed = allowedPlatforms.includes(platformKey);
                                        const isChecked = selectedPlatforms.includes(platformKey);
                                        
                                        return (
                                            <div 
                                                key={platformKey} 
                                                className={`flex items-center space-x-3 p-3 border rounded-lg ${
                                                    !isAvailable 
                                                        ? 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700' 
                                                        : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            >
                                                <Checkbox
                                                    id={platformKey}
                                                    checked={isChecked}
                                                    disabled={!isAvailable}
                                                    onCheckedChange={(checked) => 
                                                        handlePlatformChange(platformKey, checked as boolean)
                                                    }
                                                />
                                                <div className="flex items-center space-x-3 flex-1">
                                                    <IconComponent className={`h-5 w-5 ${platform.color}`} />
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-2">
                                                            <Label 
                                                                htmlFor={platformKey}
                                                                className={`font-medium cursor-pointer ${
                                                                    !isAvailable 
                                                                        ? 'text-gray-400 dark:text-gray-500' 
                                                                        : ''
                                                                }`}
                                                            >
                                                                {platform.name}
                                                            </Label>
                                                            {!isAllowed && (
                                                                <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded dark:bg-blue-900/30 dark:text-blue-300">
                                                                    Pro Only
                                                                </span>
                                                            )}
                                                            {isAllowed && !isConnected && (
                                                                <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded dark:bg-yellow-900/30 dark:text-yellow-300">
                                                                    Not Connected
                                                                </span>
                                                            )}
                                                        </div>
                                                        {!isAvailable && (
                                                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                                                {!isAllowed ? 'Upgrade to access this platform' : 'Connect this platform to your channel'}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                {(errors.platforms || clientErrors.platforms) && (
                                    <p className="text-sm text-red-600">{errors.platforms || clientErrors.platforms}</p>
                                )}
                                
                                {availablePlatforms.length === 0 && (
                                    <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800">
                                        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                                            No platforms available for upload. Please connect at least one platform to this channel.
                                        </AlertDescription>
                                    </Alert>
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
                                        <Label htmlFor="publish_at">Publish Date & Time (Your Local Time)</Label>
                                        <Input
                                            id="publish_at"
                                            type="datetime-local"
                                            value={data.publish_at}
                                            onChange={(e) => setData('publish_at', e.target.value)}
                                            min={(() => {
                                                const now = new Date();
                                                // Add 5 minutes to current time as minimum
                                                now.setMinutes(now.getMinutes() + 5);
                                                return now.toISOString().slice(0, 16);
                                            })()}
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Time will be converted to your local timezone. Minimum: 5 minutes from now.
                                        </p>
                                        {(errors.publish_at || clientErrors.publish_at) && (
                                            <p className="text-sm text-red-600 dark:text-red-400">{errors.publish_at || clientErrors.publish_at}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Cloud Storage Options */}
                            <div className="space-y-4">
                                <div>
                                    <Label>Cloud Storage Backup (Optional)</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically backup your video to cloud storage services
                                    </p>
                                </div>

                                <div className="grid gap-3">
                                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                                        <Checkbox
                                            id="google_drive"
                                            checked={data.cloud_providers?.includes('google_drive') || false}
                                            onCheckedChange={(checked) => {
                                                const currentProviders = data.cloud_providers || [];
                                                if (checked) {
                                                    setData('cloud_providers', [...currentProviders, 'google_drive']);
                                                } else {
                                                    setData('cloud_providers', currentProviders.filter(p => p !== 'google_drive'));
                                                }
                                            }}
                                        />
                                        <div className="flex items-center space-x-3 flex-1">
                                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                                <Cloud className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1">
                                                <Label htmlFor="google_drive" className="font-medium">
                                                    Google Drive
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Backup to your Google Drive account
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-3 p-3 border rounded-lg">
                                        <Checkbox
                                            id="dropbox"
                                            checked={data.cloud_providers?.includes('dropbox') || false}
                                            onCheckedChange={(checked) => {
                                                const currentProviders = data.cloud_providers || [];
                                                if (checked) {
                                                    setData('cloud_providers', [...currentProviders, 'dropbox']);
                                                } else {
                                                    setData('cloud_providers', currentProviders.filter(p => p !== 'dropbox'));
                                                }
                                            }}
                                        />
                                        <div className="flex items-center space-x-3 flex-1">
                                            <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                                                <Cloud className="w-4 h-4 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <Label htmlFor="dropbox" className="font-medium">
                                                    Dropbox
                                                </Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Backup to your Dropbox account
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                                        <strong>Note:</strong> Cloud storage backup requires API configuration. 
                                        Videos will be stored locally and cloud backup will be simulated for now.
                                    </AlertDescription>
                                </Alert>
                            </div>

                            {/* Advanced Options Section */}
                            <AdvancedOptionsSection
                                selectedPlatforms={selectedPlatforms}
                                advancedOptions={advancedOptions}
                                onAdvancedOptionsChange={handleAdvancedOptionsChange}
                            />

                            {/* Submit Button */}
                            <div className="flex justify-end space-x-4">
                                <Link href={`/channels/${channel.slug}`}>
                                    <Button 
                                        type="button" 
                                        variant="outline"
                                    >
                                        Cancel
                                    </Button>
                                </Link>
                                <Button 
                                    type="submit" 
                                    disabled={processing || !data.video || selectedPlatforms.length === 0 || availablePlatforms.length === 0}
                                >
                                    {processing ? 'Uploading...' : 'Upload Video'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>

            {/* Cloud Storage Import Dialog */}
            <CloudStorageImport
                isOpen={isCloudStorageOpen}
                onClose={() => setIsCloudStorageOpen(false)}
                onFileImported={handleCloudFileImported}
            />
        </AppLayout>
    );
} 