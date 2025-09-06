import { Head, Link, router, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Plus,
    Youtube,
    Instagram,
    Video as VideoIcon,
    Users,
    BarChart3,
    Clock,
    CheckCircle,
    AlertCircle,
    XCircle,
    Crown,
    Zap,
    Facebook,
    Camera,
    Palette
} from 'lucide-react';
import XIcon from '@/components/ui/icons/x';
import React, { useState } from 'react';
import VideoThumbnail from '@/components/VideoThumbnail';

interface Channel {
    id: number;
    name: string;
    description: string;
    slug: string;
    is_default: boolean;
    social_accounts_count: number;
    videos_count: number;
    connected_platforms: string[];
    default_platforms: string[];
}

interface Video {
    id: number;
    title: string;
    description: string;
    duration: number;
    thumbnail_path: string | null;
    video_width: number | null;
    video_height: number | null;
    created_at: string;
    channel: {
        id: number;
        name: string;
    };
    targets: Array<{
        platform: string;
        status: string;
        error_message: string | null;
        publish_at: string | null;
        platform_video_id: string | null;
        platform_url: string | null;
    }>;
}

interface Subscription {
    status: string;
    is_active: boolean;
    max_channels: number;
    daily_rate: number;
}

interface Props {
    channels: Channel[];
    defaultChannel: {
        id: number;
        name: string;
        slug: string;
    };
    recentVideos: Video[];
    subscription: Subscription | null;
    allowedPlatforms: string[];
    canCreateChannel: boolean;
}

const platformIcons = {
    youtube: Youtube,
    instagram: Instagram,
    tiktok: VideoIcon,
    facebook: Facebook,
    snapchat: Camera,
    pinterest: Palette,
    x: XIcon,
};

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
};

const statusIcons = {
    pending: Clock,
    processing: BarChart3,
    success: CheckCircle,
    failed: XCircle,
};

const breadcrumbs = [
    {
        title: 'My channels',
        href: '/dashboard',
    },
];

const platformData = {
    youtube: {
        name: 'YouTube',
        icon: Youtube,
        description: 'Upload videos to your YouTube channel',
        color: 'text-red-600'
    },
    instagram: {
        name: 'Instagram',
        icon: Instagram,
        description: 'Share Reels and video content',
        color: 'text-pink-600'
    },
    tiktok: {
        name: 'TikTok',
        icon: VideoIcon,
        description: 'Publish videos for maximum reach',
        color: 'text-black'
    },
    facebook: {
        name: 'Facebook',
        icon: Facebook,
        description: 'Share videos on Facebook',
        color: 'text-blue-600'
    },
    snapchat: {
        name: 'Snapchat',
        icon: Camera,
        description: 'Share content on Snapchat',
        color: 'text-yellow-500'
    },
    pinterest: {
        name: 'Pinterest',
        icon: Palette,
        description: 'Share videos on Pinterest',
        color: 'text-red-500'
    },
    x: {
        name: 'X',
        icon: XIcon,
        description: 'Share videos on X',
        color: 'text-black'
    }
};

export default function Dashboard({
    channels,
    defaultChannel,
    recentVideos,
    subscription,
    allowedPlatforms,
    canCreateChannel
}: Props) {
    const [isCreateChannelOpen, setIsCreateChannelOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
        default_platforms: ['youtube'] // Default to YouTube
    });

    const handleChannelClick = (slug: string) => {
        router.visit(`/channels/${slug}`);
    };

    const handleCreateChannel = (e: React.FormEvent) => {
        e.preventDefault();
        post('/channels', {
            onSuccess: () => {
                setIsCreateChannelOpen(false);
                reset();
            }
        });
    };

    const handleUpgradeClick = () => {
        router.visit('/subscription/plans');
    };

    // Defensive checks for null/undefined data
    const safeChannels = channels || [];
    const safeAllowedPlatforms = allowedPlatforms || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">My channels</h1>
                        <p className="text-muted-foreground">
                            Manage your channels and videos across all platforms
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        {!subscription?.is_active && (
                            <Button onClick={handleUpgradeClick} className="bg-gradient-to-r from-blue-600 to-purple-600">
                                <Zap className="w-4 h-4 mr-2" />
                                Upgrade to Pro
                            </Button>
                        )}
                        {canCreateChannel && (
                            <Dialog open={isCreateChannelOpen} onOpenChange={setIsCreateChannelOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline">
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Channel
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px]">
                                    <DialogHeader>
                                        <DialogTitle>Create New Channel</DialogTitle>
                                        <DialogDescription>
                                            Set up a new channel to organize your content and social media connections.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateChannel} className="space-y-6">
                                        {/* Channel Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Channel Name *</Label>
                                            <Input
                                                id="name"
                                                type="text"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                placeholder="e.g., My Gaming Channel"
                                                className={errors.name ? 'border-red-500' : ''}
                                            />
                                            {errors.name && (
                                                <p className="text-sm text-red-600">{errors.name}</p>
                                            )}
                                        </div>

                                        {/* Channel Description */}
                                        <div className="space-y-2">
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea
                                                id="description"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                placeholder="Describe what this channel is about..."
                                                rows={3}
                                                className={errors.description ? 'border-red-500' : ''}
                                            />
                                            {errors.description && (
                                                <p className="text-sm text-red-600">{errors.description}</p>
                                            )}
                                        </div>

                                        {/* Default Platforms */}
                                        <div className="space-y-4">
                                            <div>
                                                <Label>Default Platforms</Label>
                                                <p className="text-sm text-muted-foreground">
                                                    Select the platforms you typically want to publish to from this channel
                                                </p>
                                            </div>

                                            <div className="grid gap-3 max-h-48 overflow-y-auto">
                                                {Object.entries(platformData).map(([platform, info]) => {
                                                    const isAllowed = safeAllowedPlatforms.includes(platform);
                                                    const Icon = info.icon;

                                                    return (
                                                        <div key={platform} className="flex items-center space-x-3 p-3 border rounded-lg">
                                                            <Checkbox
                                                                id={platform}
                                                                checked={data.default_platforms.includes(platform)}
                                                                onCheckedChange={(checked) => {
                                                                    if (checked) {
                                                                        setData('default_platforms', [...data.default_platforms, platform]);
                                                                    } else {
                                                                        setData('default_platforms', data.default_platforms.filter(p => p !== platform));
                                                                    }
                                                                }}
                                                                disabled={!isAllowed}
                                                            />

                                                            <div className="flex items-center space-x-3 flex-1">
                                                                <Icon className={`w-4 h-4 ${info.color}`} />
                                                                <div className="flex-1">
                                                                    <Label
                                                                        htmlFor={platform}
                                                                        className={`font-medium text-sm ${!isAllowed ? 'text-gray-400' : ''}`}
                                                                    >
                                                                        {info.name}
                                                                    </Label>
                                                                    <p className={`text-xs ${!isAllowed ? 'text-gray-400' : 'text-muted-foreground'}`}>
                                                                        {info.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {safeAllowedPlatforms.length === 1 && (
                                                <Alert className="bg-blue-950/20 border-blue-800">
                                                    <AlertDescription className="text-blue-800  text-sm">
                                                        <strong>Free Plan:</strong> You currently have access to YouTube only.
                                                        Upgrade to Pro to unlock Instagram and TikTok publishing for just $0.60/day.
                                                    </AlertDescription>
                                                </Alert>
                                            )}

                                            {errors.default_platforms && (
                                                <p className="text-sm text-red-600">{errors.default_platforms}</p>
                                            )}
                                        </div>

                                        <DialogFooter>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => setIsCreateChannelOpen(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button type="submit" disabled={processing}>
                                                {processing ? 'Creating...' : 'Create Channel'}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                {/* Subscription Status */}
                {!subscription?.is_active && (
                    <Card className="relative overflow-hidden border-2 border-gradient-to-r from-blue-200 to-purple-200 bg-gradient-to-br from-blue-50 to-purple-50">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full -translate-y-16 translate-x-16"></div>
                        <CardHeader className="relative z-10">
                            <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                                <Crown className="w-6 h-6 mr-2 text-purple-600" />
                                Upgrade to Pro
                            </CardTitle>
                            <CardDescription className="text-gray-700">
                                Unlock all platforms and create up to 3 channels for just <span className="font-semibold text-purple-700">$0.60/day</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="space-y-3">
                                    <p className="text-sm font-semibold text-gray-800">Pro Features:</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
                                        <div className="flex items-center text-sm text-gray-700">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></div>
                                            Instagram & TikTok publishing
                                        </div>
                                        <div className="flex items-center text-sm text-gray-700">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></div>
                                            Up to 3 channels
                                        </div>
                                        <div className="flex items-center text-sm text-gray-700">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></div>
                                            Priority support
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    <Button 
                                        onClick={handleUpgradeClick} 
                                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium px-6 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200"
                                    >
                                        <Crown className="w-4 h-4 mr-2" />
                                        Upgrade Now
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Channels Grid */}
                <div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {safeChannels.map((channel) => (
                            <Card
                                key={channel.id}
                                className="cursor-pointer hover:shadow-lg transition-shadow"
                                onClick={() => handleChannelClick(channel.slug)}
                            >
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center">
                                            {channel.is_default && (
                                                <Crown className="w-4 h-4 mr-2 text-yellow-500" />
                                            )}
                                            {channel.name || 'Unnamed Channel'}
                                        </CardTitle>
                                        {channel.is_default && (
                                            <Badge variant="secondary">Default</Badge>
                                        )}
                                    </div>
                                    <CardDescription>{channel.description || 'No description'}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {/* Connected Platforms */}
                                        <div>
                                            <p className="text-sm font-medium mb-2">Connected Platforms</p>
                                            <div className="flex space-x-2">
                                                {(channel.connected_platforms || []).length > 0 ? (
                                                    channel.connected_platforms.map((platform) => {
                                                        const Icon = platformIcons[platform as keyof typeof platformIcons];
                                                        return (
                                                            <div key={platform} className="flex items-center space-x-1">
                                                                <Icon className="w-4 h-4" />
                                                                <span className="text-xs capitalize">{platform}</span>
                                                            </div>
                                                        );
                                                    })
                                                ) : (
                                                    <span className="text-xs text-gray-500">No platforms connected</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>{channel.videos_count || 0} videos</span>
                                            <span>{channel.social_accounts_count || 0} connections</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}