import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Plus, 
    Youtube, 
    Instagram, 
    Video as VideoIcon, 
    Settings, 
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Crown,
    Info,
    Facebook,
    Twitter,
    Camera,
    Palette,
    Zap
} from 'lucide-react';
import React from 'react';
import VideoThumbnail from '@/components/VideoThumbnail';

interface Channel {
    id: number;
    name: string;
    description: string;
    slug: string;
    is_default: boolean;
    default_platforms: string[];
}

interface SocialAccount {
    id: number;
    platform: string;
    created_at: string;
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
    targets: Array<{
        id: number;
        platform: string;
        status: string;
        error_message: string | null;
        publish_at: string | null;
        platform_video_id: string | null;
        platform_url: string | null;
    }>;
}

interface Platform {
    name: string;
    label: string;
    allowed: boolean;
    connected: boolean;
}

interface Props {
    channel: Channel;
    socialAccounts: SocialAccount[];
    videos: {
        data: Video[];
        links: any;
        meta: any;
    };
    availablePlatforms: Platform[];
    allowedPlatforms: string[];
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
    processing: AlertCircle,
    success: CheckCircle,
    failed: XCircle,
};

export default function ChannelShow({ 
    channel, 
    socialAccounts, 
    videos, 
    availablePlatforms, 
    allowedPlatforms 
}: Props) {
    const breadcrumbs = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: channel.name,
            href: `/channels/${channel.slug}`,
        },
    ];

    const handleConnectPlatform = (platform: string) => {
        // Use window.location for OAuth to handle redirects properly
        window.location.href = `/channels/${channel.slug}/auth/${platform}`;
    };

    const handleDisconnectPlatform = (platform: string) => {
        if (confirm(`Are you sure you want to disconnect ${platform} from this channel?`)) {
            router.delete(`/channels/${channel.slug}/social/${platform}`);
        }
    };

    const handleForceReconnectPlatform = (platform: string) => {
        if (confirm(`Force reconnect ${platform}? This will revoke current permissions and ask you to choose an account again.`)) {
            // Use window.location for OAuth to handle redirects properly
            window.location.href = `/channels/${channel.slug}/auth/${platform}?force=true`;
        }
    };

    const handleRetryTarget = (targetId: number) => {
        router.post(`/video-targets/${targetId}/retry`);
    };

    const handleUpgradeClick = () => {
        router.visit('/subscription/plans');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${channel.name} - Channel`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center space-x-2">
                            <h1 className="text-3xl font-bold tracking-tight">{channel.name}</h1>
                            {channel.is_default && (
                                <Badge variant="secondary" className="flex items-center">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Default
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground">
                            {channel.description || 'Manage your videos and content'}
                        </p>
                    </div>
                    <div className="flex items-center space-x-4">
                        <Link href={`/channels/${channel.slug}/videos/create`}>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Upload Video
                            </Button>
                        </Link>
                        <Link href={`/channels/${channel.id}/edit`}>
                            <Button variant="outline">
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Connect Accounts Section */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Connected Platforms</h3>
                        <p className="text-sm text-muted-foreground">
                            Connect social media accounts to publish videos
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {availablePlatforms.map((platform) => {
                            const isConnected = platform.connected;
                            const isAllowed = platform.allowed;
                            const PlatformIcon = platformIcons[platform.name as keyof typeof platformIcons];
                            
                            return (
                                <Card key={platform.name} className={`transition-all h-full ${isConnected ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                                    <CardContent className="p-4 h-full flex flex-col">
                                        {/* Platform Icon and Name */}
                                        <div className="flex flex-col items-center text-center space-y-3 flex-1">
                                            <div className={`p-3 rounded-lg ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                <PlatformIcon className={`w-6 h-6 ${isConnected ? 'text-green-600' : 'text-gray-600'}`} />
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-sm">{platform.label}</h4>
                                                {isConnected && (
                                                    <p className="text-xs text-green-600 mt-1">Connected</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col space-y-2 mt-4">
                                            {isConnected ? (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDisconnectPlatform(platform.name)}
                                                        className="text-red-600 hover:text-red-700 w-full"
                                                    >
                                                        Disconnect
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleForceReconnectPlatform(platform.name)}
                                                        className="text-xs h-auto p-1 w-full"
                                                    >
                                                        Reconnect
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    {!isAllowed && (
                                                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 justify-center">
                                                            Pro Only
                                                        </Badge>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        onClick={() => isAllowed ? handleConnectPlatform(platform.name) : handleUpgradeClick()}
                                                        disabled={!isAllowed}
                                                        className={`w-full ${isAllowed ? '' : 'opacity-50'}`}
                                                    >
                                                        {isAllowed ? 'Connect' : 'Upgrade'}
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {availablePlatforms.filter(p => !p.allowed).length > 0 && (
                        <Card className="mt-4 border-blue-200 bg-blue-50">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Crown className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium text-blue-900">Unlock More Platforms</h4>
                                            <p className="text-sm text-blue-700">
                                                Upgrade to Pro to access Instagram, TikTok, and more platforms
                                            </p>
                                        </div>
                                    </div>
                                    <Button onClick={handleUpgradeClick} className="bg-blue-600 hover:bg-blue-700">
                                        <Zap className="w-4 h-4 mr-2" />
                                        Upgrade to Pro
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Recent Videos */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold">Recent Videos</h3>
                        <Link href="/videos" className="text-sm text-blue-600 hover:text-blue-700">
                            View all videos →
                        </Link>
                    </div>

                    {videos.data.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {videos.data.map((video) => (
                                <Card key={video.id} className="overflow-hidden">
                                    <CardContent className="p-0">
                                        {/* Thumbnail */}
                                        <div className="relative">
                                            <VideoThumbnail
                                                src={video.thumbnail_path}
                                                alt={video.title}
                                                width={video.video_width ?? undefined}
                                                height={video.video_height ?? undefined}
                                                className="w-full h-24"
                                            />
                                            <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 rounded">
                                                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="p-3 space-y-2">
                                            <h4 className="font-medium text-sm line-clamp-2 leading-tight">
                                                {video.title}
                                            </h4>
                                            
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(video.created_at).toLocaleDateString()}
                                            </p>

                                            {/* Platform Status - Compact */}
                                            <div className="flex flex-wrap gap-1">
                                                {video.targets.map((target, index) => {
                                                    const StatusIcon = statusIcons[target.status as keyof typeof statusIcons];
                                                    const platformAbbr = {
                                                        youtube: 'YT',
                                                        instagram: 'IG',
                                                        tiktok: 'TT',
                                                        facebook: 'FB',
                                                        twitter: 'X',
                                                        snapchat: 'SC',
                                                        pinterest: 'PT'
                                                    };
                                                    
                                                    return (
                                                        <div key={index} className="flex items-center">
                                                            <Badge 
                                                                variant="secondary" 
                                                                className={`text-xs px-1.5 py-0.5 ${statusColors[target.status as keyof typeof statusColors]}`}
                                                            >
                                                                <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                                                                {platformAbbr[target.platform as keyof typeof platformAbbr] || target.platform.toUpperCase()}
                                                            </Badge>
                                                            {target.status === 'failed' && (
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleRetryTarget(target.id)}
                                                                    className="text-xs px-1 py-0 h-auto ml-1 text-red-600"
                                                                >
                                                                    ↻
                                                                </Button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Actions - Compact */}
                                            <div className="flex gap-1 pt-1">
                                                <Link href={`/videos/${video.id}`} className="flex-1">
                                                    <Button size="sm" variant="outline" className="text-xs w-full h-6">
                                                        View
                                                    </Button>
                                                </Link>
                                                <Link href={`/videos/${video.id}/edit`} className="flex-1">
                                                    <Button size="sm" variant="outline" className="text-xs w-full h-6">
                                                        Edit
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-8">
                                <VideoIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                <h3 className="text-base font-medium text-gray-900 mb-2">No videos yet</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    Upload your first video to this channel to get started.
                                </p>
                                <Link href={`/channels/${channel.slug}/videos/create`}>
                                    <Button size="sm">
                                        <Plus className="w-3 h-3 mr-1" />
                                        Upload Video
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