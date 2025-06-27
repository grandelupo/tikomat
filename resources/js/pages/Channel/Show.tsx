import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    Settings, 
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Crown,
    Info,
    Facebook,
    Camera,
    Palette,
    Zap,
    Eye,
    Edit,
    Trash2,
    Users,
    Brain
} from 'lucide-react';
import XIcon from '@/components/ui/icons/x';
import { useInitials } from '@/hooks/use-initials';
import React, { useState } from 'react';
import VideoThumbnail from '@/components/VideoThumbnail';
import InstantUploadDropzone from '@/components/InstantUploadDropzone';

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
    profile_name?: string;
    profile_avatar_url?: string;
    profile_username?: string;
    facebook_page_name?: string;
    facebook_page_id?: string;
    platform_channel_name?: string;
    platform_channel_handle?: string;
    platform_channel_url?: string;
    is_platform_channel_specific?: boolean;
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
    tiktok: VideoIcon, // Using VideoIcon for consistency across the app
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
    const getInitials = useInitials();
    const [isConnectPlatformsOpen, setIsConnectPlatformsOpen] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteVideoId, setDeleteVideoId] = useState<number | null>(null);
    const [deleteOption, setDeleteOption] = useState<'all' | 'tikomat'>('tikomat');
    
    const breadcrumbs = [
        {
            title: 'My channels',
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
            window.location.href = `/channels/${channel.slug}/auth/${platform}/force-reconnect`;
        }
    };

    const handleRetryTarget = (targetId: number) => {
        router.post(`/video-targets/${targetId}/retry`);
    };

    const handleUpgradeClick = () => {
        router.visit('/subscription/plans');
    };

    const handleDeleteVideo = (videoId: number) => {
        setDeleteVideoId(videoId);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (deleteVideoId) {
            router.delete(`/videos/${deleteVideoId}`, {
                data: { delete_option: deleteOption },
                onSuccess: () => {
                    setShowDeleteDialog(false);
                    setDeleteVideoId(null);
                },
            });
        }
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
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold">Connected Platforms</h3>
                            <p className="text-sm text-muted-foreground">
                                Connect social media accounts to publish videos
                            </p>
                        </div>
                        <Dialog open={isConnectPlatformsOpen} onOpenChange={setIsConnectPlatformsOpen}>
                            <DialogTrigger asChild>
                                <Button 
                                    variant="outline"
                                    className="flex items-center space-x-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Connect More Platforms</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[700px] max-h-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Connect Platforms to {channel.name}</DialogTitle>
                                    <DialogDescription>
                                        Connect your social media accounts to start publishing videos across multiple platforms.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto">
                                    {availablePlatforms.map((platform) => {
                                        const isConnected = platform.connected;
                                        const isAllowed = platform.allowed;
                                        const PlatformIcon = platformIcons[platform.name as keyof typeof platformIcons];
                                        
                                        return (
                                            <Card key={platform.name} className={`transition-all ${isConnected ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                                                <CardContent className="p-4">
                                                    {/* Platform Icon and Name */}
                                                    <div className="flex items-center space-x-3 mb-4">
                                                        <div className={`p-2 rounded-lg ${isConnected ? 'bg-green-100' : 'bg-gray-100'}`}>
                                                            <PlatformIcon className={`w-5 h-5 ${isConnected ? 'text-green-600' : 'text-gray-600'}`} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-sm">{platform.label}</h4>
                                                            {isConnected && (
                                                                <p className="text-xs text-green-600">Connected</p>
                                                            )}
                                                            {!isAllowed && (
                                                                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs mt-1">
                                                                    Pro Only
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="flex flex-col space-y-2">
                                                        {isConnected ? (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        handleDisconnectPlatform(platform.name);
                                                                        setIsConnectPlatformsOpen(false);
                                                                    }}
                                                                    className="text-red-600 hover:text-red-700 w-full"
                                                                >
                                                                    Disconnect
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => {
                                                                        handleForceReconnectPlatform(platform.name);
                                                                        setIsConnectPlatformsOpen(false);
                                                                    }}
                                                                    className="text-xs h-auto p-1 w-full"
                                                                >
                                                                    Reconnect
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => {
                                                                    if (isAllowed) {
                                                                        handleConnectPlatform(platform.name);
                                                                        setIsConnectPlatformsOpen(false);
                                                                    } else {
                                                                        handleUpgradeClick();
                                                                        setIsConnectPlatformsOpen(false);
                                                                    }
                                                                }}
                                                                disabled={!isAllowed}
                                                                className={`w-full ${isAllowed ? 'bg-blue-600 hover:bg-blue-700' : 'opacity-50'}`}
                                                            >
                                                                {isAllowed ? 'Connect' : 'Upgrade to Connect'}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                                
                                {/* Upgrade banner if there are restricted platforms */}
                                {availablePlatforms.filter(p => !p.allowed).length > 0 && (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-blue-100 rounded-lg">
                                                    <Crown className="w-4 h-4 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-blue-900 text-sm">Unlock More Platforms</h4>
                                                    <p className="text-xs text-blue-700">
                                                        Upgrade to Pro to access Instagram, TikTok, and more platforms for just $0.60/day
                                                    </p>
                                                </div>
                                            </div>
                                            <Button 
                                                onClick={() => {
                                                    handleUpgradeClick();
                                                    setIsConnectPlatformsOpen(false);
                                                }}
                                                size="sm"
                                                className="bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Zap className="w-3 h-3 mr-1" />
                                                Upgrade
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Show connected social accounts with profile information */}
                    {socialAccounts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {socialAccounts.map((account) => {
                                const PlatformIcon = platformIcons[account.platform as keyof typeof platformIcons];
                                
                                return (
                                    <Card key={account.id} className="border-green-200 bg-green-50">
                                        <CardContent className="p-4">
                                            {/* Profile Header */}
                                            <div className="flex items-center space-x-3 mb-4">
                                                <Avatar className="h-10 w-10">
                                                    <AvatarImage 
                                                        src={account.profile_avatar_url} 
                                                        alt={account.profile_name || 'Profile'} 
                                                    />
                                                    <AvatarFallback className="bg-white">
                                                        {account.profile_name 
                                                            ? getInitials(account.profile_name)
                                                            : <PlatformIcon className="w-4 h-4" />
                                                        }
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <PlatformIcon className="w-4 h-4 text-green-600" />
                                                                                                            <h4 className="font-medium text-sm text-gray-900 capitalize">
                                                        {account.platform}
                                                    </h4>
                                                </div>
                                                {/* Show platform-specific channel name or fallback to profile name */}
                                                {(account.platform_channel_name || account.profile_name) && (
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {account.platform_channel_name || account.profile_name}
                                                    </p>
                                                )}
                                                {/* Show platform-specific handle or fallback to profile username */}
                                                {(account.platform_channel_handle || account.profile_username) && (
                                                    <p className="text-xs text-gray-600 truncate">
                                                        {account.platform_channel_handle || `@${account.profile_username}`}
                                                    </p>
                                                )}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="space-y-2">
                                                <div className="flex space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleDisconnectPlatform(account.platform)}
                                                        className="text-red-600 hover:text-red-700 flex-1"
                                                    >
                                                        Disconnect
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleForceReconnectPlatform(account.platform)}
                                                        className="text-xs flex-1"
                                                    >
                                                        Reconnect
                                                    </Button>
                                                </div>
                                                {/* Show Facebook page info under buttons */}
                                                {account.platform === 'facebook' && account.facebook_page_name && (
                                                    <div className="text-center">
                                                        <p className="text-xs text-gray-500 font-medium">
                                                            📄 {account.facebook_page_name}
                                                        </p>
                                                    </div>
                                                )}
                                                {/* Show YouTube channel info under buttons */}
                                                {account.platform === 'youtube' && account.platform_channel_name && (
                                                    <div className="text-center">
                                                        <p className="text-xs text-gray-500 font-medium">
                                                            🎥 {account.platform_channel_name}
                                                            {account.platform_channel_handle && ` (${account.platform_channel_handle})`}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <Card className="border-gray-200 bg-gray-50">
                            <CardContent className="text-center py-8">
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="p-4 bg-gray-100 rounded-full">
                                        <Users className="w-8 h-8 text-gray-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Platforms Connected</h3>
                                        <p className="text-sm text-gray-600 mb-4">
                                            Connect your social media accounts to start publishing videos across platforms.
                                        </p>
                                        <Button 
                                            onClick={() => setIsConnectPlatformsOpen(true)}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Connect Your First Platform
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Instant Upload Section */}
                {availablePlatforms.filter(p => p.connected).length > 0 && (
                    <div>
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold">Instant Upload with AI</h3>
                            <p className="text-sm text-muted-foreground">
                                Drop a video and let AI automatically generate titles, descriptions, and publish to all connected platforms
                            </p>
                        </div>
                        <InstantUploadDropzone channel={channel} className="mb-6" />
                    </div>
                )}

                {/* Videos Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Videos ({videos.meta?.total || videos.data.length})</CardTitle>
                        <CardDescription>
                            Videos from this channel and their publishing status across platforms
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {videos.data.length === 0 ? (
                            <div className="text-center py-8">
                                <VideoIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-sm font-semibold text-gray-900">No videos yet</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Upload your first video to this channel to get started.
                                </p>
                                <div className="mt-6">
                                    <Link href={`/channels/${channel.slug}/videos/create`}>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Upload Video
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-20">Thumbnail</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Duration</TableHead>
                                        <TableHead>Platforms</TableHead>
                                        <TableHead>Upload Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {videos.data.map((video) => (
                                        <TableRow key={video.id}>
                                            <TableCell>
                                                <VideoThumbnail
                                                    src={video.thumbnail_path}
                                                    alt={video.title}
                                                    width={video.video_width ?? undefined}
                                                    height={video.video_height ?? undefined}
                                                    className="w-16 h-12"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <p className="font-medium">{video.title}</p>
                                                        {video.title === 'Processing...' && (
                                                            <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                                                                <Brain className="w-3 h-3 mr-1" />
                                                                AI Processing
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {video.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                                            {video.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {video.targets.map((target) => {
                                                        const StatusIcon = statusIcons[target.status as keyof typeof statusIcons];
                                                        const PlatformIcon = platformIcons[target.platform as keyof typeof platformIcons];
                                                        
                                                        return (
                                                            <div key={target.id} className="flex items-center">
                                                                <Badge 
                                                                    variant="secondary"
                                                                    className={`${statusColors[target.status as keyof typeof statusColors]} flex items-center gap-1 text-xs`}
                                                                >
                                                                    <PlatformIcon className="h-3 w-3" />
                                                                    <StatusIcon className="h-3 w-3" />
                                                                    {target.platform.charAt(0).toUpperCase() + target.platform.slice(1)}
                                                                </Badge>
                                                                {target.status === 'failed' && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => handleRetryTarget(target.id)}
                                                                        className="text-xs px-1 py-0 h-auto ml-1 text-red-600"
                                                                    >
                                                                        Retry
                                                                    </Button>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {new Date(video.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/videos/${video.id}/edit`}>
                                                        <Button variant="outline" size="sm">
                                                            <Eye className="mr-1 h-3 w-3" />
                                                            View
                                                        </Button>
                                                    </Link>
                                                    <Link href={`/videos/${video.id}/edit`}>
                                                        <Button variant="outline" size="sm">
                                                            <Edit className="mr-1 h-3 w-3" />
                                                            Edit
                                                        </Button>
                                                    </Link>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleDeleteVideo(video.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="mr-1 h-3 w-3" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Delete Confirmation Dialog */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Delete Video</DialogTitle>
                            <DialogDescription>
                                Choose how you want to handle this video deletion. This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-3">
                                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setDeleteOption('tikomat')}>
                                    <input
                                        type="radio"
                                        id="delete-tikomat-channel"
                                        name="delete-option"
                                        value="tikomat"
                                        checked={deleteOption === 'tikomat'}
                                        onChange={(e) => setDeleteOption(e.target.value as 'tikomat')}
                                        className="h-4 w-4 mt-0.5"
                                    />
                                    <div className="flex-1">
                                        <label htmlFor="delete-tikomat-channel" className="text-sm font-medium cursor-pointer">
                                            Remove only from Tikomat
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Video will remain published on all platforms but removed from Tikomat's tracking
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer" onClick={() => setDeleteOption('all')}>
                                    <input
                                        type="radio"
                                        id="delete-all-channel"
                                        name="delete-option"
                                        value="all"
                                        checked={deleteOption === 'all'}
                                        onChange={(e) => setDeleteOption(e.target.value as 'all')}
                                        className="h-4 w-4 mt-0.5"
                                    />
                                    <div className="flex-1">
                                        <label htmlFor="delete-all-channel" className="text-sm font-medium cursor-pointer">
                                            Take down from all platforms
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Video will be completely removed from all platforms and Tikomat
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                                Cancel
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={confirmDelete}
                            >
                                {deleteOption === 'all' ? 'Take Down Video' : 'Remove from Tikomat'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
} 