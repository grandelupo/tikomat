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
    Zap,
    Info
} from 'lucide-react';
import React from 'react';

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
    created_at: string;
    targets: Array<{
        id: number;
        platform: string;
        status: string;
        error_message: string | null;
        publish_at: string | null;
    }>;
}

interface Platform {
    name: string;
    label: string;
    allowed: boolean;
    connected: boolean;
    coming_soon: boolean;
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
                            {channel.description || 'Manage your social media connections and videos'}
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

                {/* Platform Connections */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Platform Connections</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                        {availablePlatforms.map((platform) => {
                            const IconComponent = platformIcons[platform.name as keyof typeof platformIcons];
                            const isConnected = platform.connected;
                            const isComingSoon = platform.coming_soon;
                            
                            return (
                                <Card key={platform.name}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {platform.label}
                                        </CardTitle>
                                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between mb-3">
                                            {isComingSoon ? (
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                                    Coming Soon
                                                </Badge>
                                            ) : (
                                                <Badge 
                                                    variant={isConnected ? "default" : "secondary"}
                                                    className={isConnected ? "bg-green-100 text-green-800" : ""}
                                                >
                                                    {isConnected ? 'Connected' : 'Not Connected'}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {isComingSoon ? (
                                                <div className="text-xs text-gray-500 text-center py-2">
                                                    <Zap className="w-4 h-4 mx-auto mb-1" />
                                                    Upgrade to Pro to unlock {platform.label}
                                                </div>
                                            ) : isConnected ? (
                                                <>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleDisconnectPlatform(platform.name)}
                                                        className="w-full"
                                                    >
                                                        Disconnect
                                                    </Button>
                                                    {platform.name === 'youtube' && (
                                                        <Button 
                                                            variant="outline" 
                                                            size="sm"
                                                            onClick={() => handleForceReconnectPlatform(platform.name)}
                                                            className="w-full text-xs"
                                                        >
                                                            🔄 Force Reconnect
                                                        </Button>
                                                    )}
                                                </>
                                            ) : (
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleConnectPlatform(platform.name)}
                                                    className="w-full"
                                                >
                                                    Connect {platform.label}
                                                </Button>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </div>

                {/* Recent Videos */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold">Recent Videos</h3>
                        <Link href={`/channels/${channel.slug}/videos/create`}>
                            <Button size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Upload Video
                            </Button>
                        </Link>
                    </div>

                    {videos.data.length > 0 ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {videos.data.map((video) => (
                                    <Card key={video.id}>
                                        <CardHeader>
                                            <CardTitle className="text-base">{video.title}</CardTitle>
                                            <CardDescription>
                                                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')} • {new Date(video.created_at).toLocaleDateString()}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-3">
                                                {/* Thumbnail placeholder */}
                                                <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    {video.thumbnail_path ? (
                                                        <img 
                                                            src={video.thumbnail_path} 
                                                            alt={video.title}
                                                            className="w-full h-full object-cover rounded-lg"
                                                        />
                                                    ) : (
                                                        <VideoIcon className="w-8 h-8 text-gray-400" />
                                                    )}
                                                </div>

                                                {/* Platform Status */}
                                                <div className="space-y-2">
                                                    {video.targets.map((target, index) => {
                                                        const StatusIcon = statusIcons[target.status as keyof typeof statusIcons];
                                                        return (
                                                            <div key={index} className="flex items-center justify-between">
                                                                <div className="flex items-center space-x-2">
                                                                    {React.createElement(platformIcons[target.platform as keyof typeof platformIcons], { className: "w-4 h-4" })}
                                                                    <span className="text-sm capitalize">{target.platform}</span>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <Badge className={statusColors[target.status as keyof typeof statusColors]}>
                                                                        <StatusIcon className="w-3 h-3 mr-1" />
                                                                        {target.status}
                                                                    </Badge>
                                                                    {target.status === 'failed' && (
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            onClick={() => handleRetryTarget(target.id)}
                                                                            className="text-xs px-2 py-1 h-auto"
                                                                        >
                                                                            Retry
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Video Actions */}
                                                <div className="flex items-center space-x-2 pt-2">
                                                    <Link href={`/videos/${video.id}`}>
                                                        <Button size="sm" variant="outline" className="text-xs">
                                                            View Details
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/videos/${video.id}/edit`}>
                                                        <Button size="sm" variant="outline" className="text-xs">
                                                            Edit
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Pagination */}
                            {videos.links && (
                                <div className="flex justify-center">
                                    {/* Add pagination component here if needed */}
                                </div>
                            )}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-12">
                                <VideoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
                                <p className="text-gray-600 mb-4">
                                    Upload your first video to this channel to get started.
                                </p>
                                <Link href={`/channels/${channel.slug}/videos/create`}>
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