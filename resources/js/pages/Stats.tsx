import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

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

const breadcrumbs = [
    {
        title: 'Stats',
        href: '/stats',
    },
];

export default function Stats({ stats, subscription, allowedPlatforms }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Statistics" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
                        <p className="text-muted-foreground">
                            Comprehensive overview of your publishing performance
                        </p>
                    </div>
                </div>

                <div className="bg-background p-4 rounded border">
                    <h2 className="text-xl font-semibold mb-4">Overview</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-2xl font-bold">{stats.overview.totalChannels}</div>
                            <p className="text-sm text-gray-600">Total Channels</p>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{stats.overview.totalVideos}</div>
                            <p className="text-sm text-gray-600">Total Videos</p>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{stats.overview.connectedPlatforms}</div>
                            <p className="text-sm text-gray-600">Connected Platforms</p>
                        </div>
                        <div>
                            <div className="text-2xl font-bold">{stats.overview.totalUploads}</div>
                            <p className="text-sm text-gray-600">Total Uploads</p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}