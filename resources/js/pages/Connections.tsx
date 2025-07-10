import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
    Youtube, 
    Instagram, 
    Video as VideoIcon, 
    Settings,
    Info,
    Facebook,
    Camera,
    Palette,
    Plus
} from 'lucide-react';
import XIcon from '@/components/ui/icons/x';
import { useInitials } from '@/hooks/use-initials';
import React from 'react';

interface Channel {
    id: number;
    name: string;
    description: string;
    slug: string;
    is_default: boolean;
}

interface SocialAccount {
    id: number;
    platform: string;
    channel_id: number;
    channel_name: string;
    created_at: string;
    facebook_page_name?: string;
    facebook_page_id?: string;
    profile_name?: string;
    profile_avatar_url?: string;
    profile_username?: string;
    platform_channel_name?: string;
    platform_channel_handle?: string;
    platform_channel_url?: string;
    platform_channel_thumbnail_url?: string;
    platform_channel_specific?: boolean;
    is_platform_channel_specific?: boolean;
}

interface Platform {
    name: string;
    label: string;
    allowed: boolean;
    connected: boolean;
}

interface Props {
    channels: Channel[];
    socialAccounts: SocialAccount[];
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
    x: XIcon,
};

const platformColors = {
    youtube: 'text-red-600',
    instagram: 'text-pink-600',
    tiktok: 'text-black',
    facebook: 'text-blue-600',
    snapchat: 'text-yellow-500',
    pinterest: 'text-red-500',
    x: 'text-black',
};

const breadcrumbs = [
    {
        title: 'My channels',
        href: '/dashboard',
    },
    {
        title: 'Connections',
        href: '/connections',
    },
];

export default function Connections({ 
    channels, 
    socialAccounts, 
    availablePlatforms, 
    allowedPlatforms 
}: Props) {
    const getInitials = useInitials();
    const handleConnectPlatform = (platform: string, channelSlug: string) => {
        // Use window.location for OAuth to handle redirects properly
        window.location.href = `/channels/${channelSlug}/auth/${platform}`;
    };

    const handleDisconnectPlatform = (platform: string, channelSlug: string) => {
        if (confirm(`Are you sure you want to disconnect ${platform}?`)) {
            router.delete(`/channels/${channelSlug}/social/${platform}`);
        }
    };

    const getConnectedChannelsForPlatform = (platform: string) => {
        return socialAccounts.filter(account => account.platform === platform);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Platform Connections" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Platform Connections</h1>
                        <p className="text-muted-foreground">
                            Manage your social media platform connections across all channels
                        </p>
                    </div>
                </div>

                {/* Platform Overview */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {availablePlatforms.map((platform) => {
                        const IconComponent = platformIcons[platform.name as keyof typeof platformIcons];
                        const connectedChannels = getConnectedChannelsForPlatform(platform.name);
                        const isConnected = connectedChannels.length > 0;
                        
                        return (
                            <Card key={platform.name} className="relative">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-lg font-medium">
                                        {platform.label}
                                    </CardTitle>
                                    <IconComponent className={`h-6 w-6 ${platformColors[platform.name as keyof typeof platformColors]}`} />
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Badge 
                                                variant={isConnected ? "default" : "secondary"}
                                                className={isConnected ? "bg-green-100 text-green-800" : ""}
                                            >
                                                {isConnected ? `${connectedChannels.length} Connected` : 'Not Connected'}
                                            </Badge>
                                        </div>

                                        {/* Connected Channels */}
                                        {connectedChannels.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-sm font-medium">Connected Channels:</p>
                                                {connectedChannels.map((account) => (
                                                    <div key={account.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                                        <div className="flex items-center space-x-3 flex-1">
                                                            <Avatar className="h-8 w-8">
                                                                <AvatarImage 
                                                                    src={
                                                                        // For YouTube, use channel thumbnail if available, otherwise fall back to profile avatar
                                                                        account.platform === 'youtube' && account.platform_channel_thumbnail_url
                                                                            ? account.platform_channel_thumbnail_url
                                                                            : account.profile_avatar_url
                                                                    } 
                                                                    alt={
                                                                        // For YouTube, use channel name, for Facebook use page name, otherwise use profile name
                                                                        account.platform === 'youtube' && account.platform_channel_name
                                                                            ? account.platform_channel_name
                                                                            : account.platform === 'facebook' && account.facebook_page_name
                                                                            ? account.facebook_page_name
                                                                            : account.profile_name || account.channel_name
                                                                    } 
                                                                />
                                                                <AvatarFallback className="text-xs bg-background">
                                                                    {account.platform === 'youtube' && account.platform_channel_name
                                                                        ? getInitials(account.platform_channel_name)
                                                                        : account.platform === 'facebook' && account.facebook_page_name
                                                                        ? getInitials(account.facebook_page_name)
                                                                        : account.profile_name 
                                                                        ? getInitials(account.profile_name)
                                                                        : getInitials(account.channel_name)
                                                                    }
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-sm font-medium text-gray-900">
                                                                        {account.channel_name}
                                                                    </span>
                                                                </div>
                                                                {/* Show platform-specific connection info */}
                                                                {(account.platform_channel_name || account.profile_name) && (
                                                                    <p className="text-xs text-gray-600 truncate">
                                                                        Connected as: {account.profile_name || account.platform_channel_name}
                                                                        {(account.profile_username || account.platform_channel_handle) && 
                                                                            ` (${`@${account.profile_username || account.platform_channel_handle}`})`}
                                                                    </p>
                                                                )}
                                                                {account.platform === 'facebook' && account.facebook_page_name && (
                                                                    <p className="text-xs text-gray-500 truncate">
                                                                        Facebook Page: {account.facebook_page_name}
                                                                    </p>
                                                                )}
                                                                {account.platform === 'youtube' && account.platform_channel_name && (
                                                                    <p className="text-xs text-gray-500 truncate">
                                                                        YouTube Channel: {account.platform_channel_name}
                                                                        {account.platform_channel_handle && ` (${account.platform_channel_handle})`}
                                                                    </p>
                                                                )}
                                                                {account.platform_channel_specific && account.platform_channel_name && account.platform !== 'youtube' && account.platform !== 'facebook' && (
                                                                    <p className="text-xs text-gray-500 truncate">
                                                                        Channel: {account.platform_channel_name}
                                                                        {account.platform_channel_handle && ` (${account.platform_channel_handle})`}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                const channel = channels.find(c => c.id === account.channel_id);
                                                                if (channel) {
                                                                    handleDisconnectPlatform(platform.name, channel.slug);
                                                                }
                                                            }}
                                                            className="text-xs h-7 ml-2"
                                                        >
                                                            Disconnect
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Connect to Channels */}
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium">Connect to Channel:</p>
                                            <div className="grid gap-2">
                                                {channels.map((channel) => {
                                                    const isChannelConnected = connectedChannels.some(
                                                        account => account.channel_id === channel.id
                                                    );
                                                    
                                                    return (
                                                        <Button
                                                            key={channel.id}
                                                            size="sm"
                                                            variant={isChannelConnected ? "outline" : "default"}
                                                            onClick={() => handleConnectPlatform(platform.name, channel.slug)}
                                                            disabled={isChannelConnected}
                                                            className="w-full justify-start text-xs"
                                                        >
                                                            {isChannelConnected ? '✓ ' : '+ '}
                                                            {channel.name}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Help Section */}
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Info className="w-5 h-5 mr-2" />
                            How Platform Connections Work
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <h4 className="font-medium mb-2">Per-Channel Connections</h4>
                                <p className="text-sm text-muted-foreground">
                                    Each channel can have its own social media connections. This allows you to manage 
                                    different brands or content types with separate social accounts.
                                </p>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2">OAuth Authentication</h4>
                                <p className="text-sm text-muted-foreground">
                                    When you connect a platform, you'll be redirected to authenticate with that service. 
                                    Your credentials are securely stored and encrypted.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}