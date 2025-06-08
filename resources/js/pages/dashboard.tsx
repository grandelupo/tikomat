import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { Plus, Youtube, Instagram, Video, Clock, CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

interface Video {
    id: number;
    title: string;
    description: string;
    duration: number;
    formatted_duration: string;
    created_at: string;
    targets: VideoTarget[];
}

interface VideoTarget {
    id: number;
    platform: string;
    status: 'pending' | 'processing' | 'success' | 'failed';
    publish_at: string | null;
    error_message: string | null;
}

interface Platform {
    name: string;
    connected: boolean;
    icon: string;
}

interface DashboardProps {
    videos: {
        data: Video[];
        links: any;
        meta: any;
    };
    platforms: Record<string, Platform>;
    socialAccounts: Record<string, any>;
}

interface FlashMessages {
    success?: string;
    error?: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

const platformIcons = {
    youtube: Youtube,
    instagram: Instagram,
    tiktok: Video,
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

export default function Dashboard({ videos, platforms, socialAccounts }: DashboardProps) {
    const { flash } = usePage().props as { flash: FlashMessages };

    const handleConnectPlatform = (platform: string) => {
        router.get(`/auth/${platform}`);
    };

    const handleSimulateConnection = (platform: string) => {
        router.post(`/simulate-oauth/${platform}`);
    };

    const handleDisconnectPlatform = (platform: string) => {
        if (confirm(`Are you sure you want to disconnect your ${platforms[platform].name} account?`)) {
            router.delete(`/social/${platform}`);
        }
    };

    const handleRetryTarget = (targetId: number) => {
        router.post(`/video-targets/${targetId}/retry`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Flash Messages */}
                {flash?.success && (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            {flash.success}
                        </AlertDescription>
                    </Alert>
                )}
                
                {flash?.error && (
                    <Alert className="bg-red-50 border-red-200">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            {flash.error}
                        </AlertDescription>
                    </Alert>
                )}

                {/* OAuth Configuration Notice */}
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        <strong>Development Mode:</strong> OAuth providers are not configured. 
                        Use "Test Connection" buttons to simulate connections, or set up OAuth credentials in your .env file.
                        See the README.md for setup instructions.
                    </AlertDescription>
                </Alert>

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-muted-foreground">
                            Manage your videos and social media connections
                        </p>
                    </div>
                    <Link href="/videos/create">
                        <Button size="lg">
                            <Plus className="mr-2 h-4 w-4" />
                            Upload Video
                        </Button>
                    </Link>
                </div>

                {/* Platform Connections */}
                <div className="grid gap-4 md:grid-cols-3">
                    {Object.entries(platforms).map(([key, platform]) => {
                        const IconComponent = platformIcons[key as keyof typeof platformIcons];
                        return (
                            <Card key={key}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {platform.name}
                                    </CardTitle>
                                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between mb-3">
                                        <Badge 
                                            variant={platform.connected ? "default" : "secondary"}
                                            className={platform.connected ? "bg-green-100 text-green-800" : ""}
                                        >
                                            {platform.connected ? 'Connected' : 'Not Connected'}
                                        </Badge>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {platform.connected ? (
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => handleDisconnectPlatform(key)}
                                                className="w-full"
                                            >
                                                Disconnect
                                            </Button>
                                        ) : (
                                            <>
                                                <Button 
                                                    size="sm"
                                                    onClick={() => handleConnectPlatform(key)}
                                                    className="w-full"
                                                >
                                                    Connect (OAuth)
                                                </Button>
                                                <Button 
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleSimulateConnection(key)}
                                                    className="w-full text-xs"
                                                >
                                                    Test Connection
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Recent Videos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Videos</CardTitle>
                        <CardDescription>
                            Your uploaded videos and their publishing status
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {videos.data.length === 0 ? (
                            <div className="text-center py-8">
                                <Video className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-sm font-semibold text-gray-900">No videos</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Get started by uploading your first video.
                                </p>
                                <div className="mt-6">
                                    <Link href="/videos/create">
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Upload Video
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {videos.data.map((video) => (
                                    <div key={video.id} className="border rounded-lg p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg">{video.title}</h3>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {video.description}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Duration: {video.formatted_duration} • 
                                                    Uploaded {new Date(video.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Link href={`/videos/${video.id}`}>
                                                <Button variant="outline" size="sm">
                                                    View Details
                                                </Button>
                                            </Link>
                                        </div>
                                        
                                        {/* Platform Status */}
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {video.targets.map((target) => {
                                                const StatusIcon = statusIcons[target.status];
                                                const PlatformIcon = platformIcons[target.platform as keyof typeof platformIcons];
                                                
                                                return (
                                                    <div key={target.id} className="flex items-center gap-2">
                                                        <Badge 
                                                            variant="secondary"
                                                            className={`${statusColors[target.status]} flex items-center gap-1`}
                                                        >
                                                            <PlatformIcon className="h-3 w-3" />
                                                            <StatusIcon className="h-3 w-3" />
                                                            {target.platform} - {target.status}
                                                        </Badge>
                                                        {target.status === 'failed' && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleRetryTarget(target.id)}
                                                            >
                                                                Retry
                                                            </Button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
