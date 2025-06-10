import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    Users, 
    Video as VideoIcon, 
    BarChart3,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    XCircle,
    Clock,
    Youtube,
    Instagram,
    Crown,
    Activity
} from 'lucide-react';

interface StatsOverview {
    totalChannels: number;
    totalVideos: number;
    connectedPlatforms: number;
    totalUploads: number;
}

interface VideoStatus {
    success: number;
    failed: number;
    pending: number;
    processing: number;
}

interface PlatformStats {
    [platform: string]: {
        total: number;
        success: number;
        failed: number;
        pending: number;
        processing: number;
    };
}

interface RecentActivity {
    date: string;
    count: number;
}

interface ChannelStats {
    id: number;
    name: string;
    videos_count: number;
    social_accounts_count: number;
    total_uploads: number;
    successful_uploads: number;
    success_rate: number;
}

interface Subscription {
    status: string;
    is_active: boolean;
    max_channels: number;
    monthly_cost: number;
}

interface Props {
    stats: {
        overview: StatsOverview;
        videoStatus: VideoStatus;
        platforms: PlatformStats;
        recentActivity: RecentActivity[];
        channels: ChannelStats[];
    };
    subscription: Subscription | null;
    allowedPlatforms: string[];
}

const platformIcons = {
    youtube: Youtube,
    instagram: Instagram,
    tiktok: VideoIcon,
};

const statusColors = {
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
};

const statusIcons = {
    success: CheckCircle,
    failed: XCircle,
    pending: Clock,
    processing: BarChart3,
};

const breadcrumbs = [
    {
        title: 'Stats',
        href: '/stats',
    },
];

export default function Stats({ stats, subscription, allowedPlatforms }: Props) {
    const totalStatusCount = Object.values(stats.videoStatus).reduce((sum, count) => sum + count, 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Statistics" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
                        <p className="text-muted-foreground">
                            Comprehensive overview of your publishing performance
                        </p>
                    </div>
                </div>

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Channels</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.overview.totalChannels}</div>
                            <p className="text-xs text-muted-foreground">
                                {subscription?.is_active ? `${subscription.max_channels - stats.overview.totalChannels} remaining` : 'Free plan: 1 channel'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
                            <VideoIcon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.overview.totalVideos}</div>
                            <p className="text-xs text-muted-foreground">
                                Across all channels
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Connected Platforms</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.overview.connectedPlatforms}</div>
                            <p className="text-xs text-muted-foreground">
                                {allowedPlatforms.length} platforms available
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Uploads</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.overview.totalUploads}</div>
                            <p className="text-xs text-muted-foreground">
                                All time uploads
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Video Status Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Activity className="w-5 h-5 mr-2" />
                                Upload Status Overview
                            </CardTitle>
                            <CardDescription>
                                Status distribution of all video uploads
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(stats.videoStatus).map(([status, count]) => {
                                const percentage = totalStatusCount > 0 ? (count / totalStatusCount) * 100 : 0;
                                const StatusIcon = statusIcons[status as keyof typeof statusIcons];
                                
                                return (
                                    <div key={status} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <StatusIcon className="w-4 h-4" />
                                                <span className="capitalize font-medium">{status}</span>
                                            </div>
                                            <Badge className={statusColors[status as keyof typeof statusColors]}>
                                                {count}
                                            </Badge>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                        <p className="text-xs text-muted-foreground text-right">
                                            {percentage.toFixed(1)}%
                                        </p>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>

                    {/* Platform Performance */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Platform Performance</CardTitle>
                            <CardDescription>
                                Success rates by platform
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(stats.platforms).map(([platform, data]) => {
                                const successRate = data.total > 0 ? (data.success / data.total) * 100 : 0;
                                const Icon = platformIcons[platform as keyof typeof platformIcons];
                                
                                return (
                                    <div key={platform} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Icon className="w-4 h-4" />
                                                <span className="capitalize font-medium">{platform}</span>
                                            </div>
                                            <div className="text-sm">
                                                {data.success}/{data.total}
                                            </div>
                                        </div>
                                        <Progress value={successRate} className="h-2" />
                                        <p className="text-xs text-muted-foreground text-right">
                                            {successRate.toFixed(1)}% success rate
                                        </p>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                {/* Channel Performance */}
                <Card>
                    <CardHeader>
                        <CardTitle>Channel Performance</CardTitle>
                        <CardDescription>
                            Performance metrics for each channel
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.channels.map((channel) => (
                                <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-medium">{channel.name}</h3>
                                            <Badge variant="outline">{channel.videos_count} videos</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {channel.social_accounts_count} connected platforms
                                        </p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <div className="text-sm font-medium">
                                            {channel.successful_uploads}/{channel.total_uploads} uploads
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Progress value={channel.success_rate} className="h-2 w-20" />
                                            <span className="text-xs text-muted-foreground">
                                                {channel.success_rate}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Subscription Status */}
                {subscription?.is_active && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Crown className="w-5 h-5 mr-2 text-blue-600" />
                                Pro Subscription
                            </CardTitle>
                            <CardDescription>
                                Your current subscription details
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm font-medium">Monthly Cost</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        ${subscription.monthly_cost.toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Channels Used</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {stats.overview.totalChannels}/{subscription.max_channels}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Status</p>
                                    <Badge className="bg-green-100 text-green-800">
                                        Active
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
} 