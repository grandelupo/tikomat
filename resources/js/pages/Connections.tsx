import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
                    <Link href="/channels/create">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Create Channel
                        </Button>
                    </Link>
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
                                                    <div key={account.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                        <span className="text-sm">{account.channel_name}</span>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                const channel = channels.find(c => c.id === account.channel_id);
                                                                if (channel) {
                                                                    handleDisconnectPlatform(platform.name, channel.slug);
                                                                }
                                                            }}
                                                            className="text-xs h-6"
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