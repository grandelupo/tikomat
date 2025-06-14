import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
    Palette,
    Twitter
} from 'lucide-react';
import React from 'react';
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
    twitter: Twitter,
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
        title: 'Dashboard',
        href: '/dashboard',
    },
];

export default function Dashboard({ 
    channels, 
    defaultChannel, 
    recentVideos, 
    subscription, 
    allowedPlatforms, 
    canCreateChannel
}: Props) {
    const handleChannelClick = (slug: string) => {
        router.visit(`/channels/${slug}`);
    };

    const handleCreateChannel = () => {
        router.visit('/channels/create');
    };

    const handleUpgradeClick = () => {
        router.visit('/subscription/plans');
    };

    // Defensive checks for null/undefined data
    const safeChannels = channels || [];
    const safeRecentVideos = recentVideos || [];
    const safeAllowedPlatforms = allowedPlatforms || [];
    const safeDefaultChannel = defaultChannel || { slug: '#', name: 'Default Channel', id: 0 };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
                            <Button onClick={handleCreateChannel} variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                New Channel
                            </Button>
                        )}
                    </div>
                </div>

                {/* Subscription Status */}
                {!subscription?.is_active && (
                    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Crown className="w-5 h-5 mr-2 text-blue-600" />
                                Upgrade to Pro
                            </CardTitle>
                            <CardDescription>
                                Unlock all platforms and create up to 3 channels for just $0.60/day
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">Pro Features:</p>
                                    <ul className="text-sm text-gray-600 space-y-1">
                                        <li>• Instagram & TikTok publishing</li>
                                        <li>• Up to 3 channels</li>
                                        <li>• Priority support</li>
                                    </ul>
                                </div>
                                <Button onClick={handleUpgradeClick} className="bg-blue-600 hover:bg-blue-700">
                                    Upgrade Now
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Channels Grid */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Your Channels</h3>
                        {canCreateChannel && (
                            <Button onClick={handleCreateChannel} size="sm" variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Channel
                            </Button>
                        )}
                    </div>

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

                {/* Recent Videos */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Recent Videos</h3>
                        <Link href={`/channels/${safeDefaultChannel.slug}/videos/create`}>
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Upload Video
                            </Button>
                        </Link>
                    </div>

                    {safeRecentVideos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {safeRecentVideos.map((video) => (
                                <Card key={video.id}>
                                    <CardHeader>
                                        <CardTitle className="text-base">{video.title || 'Untitled Video'}</CardTitle>
                                        <CardDescription>
                                            {video.channel?.name || 'Unknown Channel'} • {Math.floor((video.duration || 0) / 60)}:{((video.duration || 0) % 60).toString().padStart(2, '0')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {/* Thumbnail placeholder */}
                                            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <VideoThumbnail
                                                    src={video.thumbnail_path}
                                                    alt={video.title}
                                                    width={video.video_width ?? undefined}
                                                    height={video.video_height ?? undefined}
                                                    className="h-32"
                                                />
                                            </div>

                                            {/* Platform Status */}
                                            <div className="space-y-2">
                                                {(video.targets || []).map((target, index) => {
                                                    const StatusIcon = statusIcons[target.status as keyof typeof statusIcons];
                                                    return (
                                                        <div key={index} className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                {React.createElement(platformIcons[target.platform as keyof typeof platformIcons], { className: "w-4 h-4" })}
                                                                <span className="text-sm capitalize">{target.platform}</span>
                                                            </div>
                                                            <Badge className={statusColors[target.status as keyof typeof statusColors]}>
                                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                                {target.status}
                                                            </Badge>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-12">
                                <VideoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
                                <p className="text-gray-600 mb-4">
                                    Upload your first video to get started with cross-platform publishing.
                                </p>
                                <Link href={`/channels/${safeDefaultChannel.slug}/videos/create`}>
                                    <Button>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Upload Your First Video
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
} 