import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Youtube, Instagram, Video as VideoIcon, Clock, CheckCircle, XCircle, AlertCircle, Eye, Edit, Trash2 } from 'lucide-react';

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

interface VideosIndexProps {
    videos: {
        data: Video[];
        links: any;
        meta: any;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Videos',
        href: '/videos',
    },
];

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

export default function VideosIndex({ videos }: VideosIndexProps) {
    const handleRetryTarget = (targetId: number) => {
        router.post(`/video-targets/${targetId}/retry`);
    };

    const handleDeleteVideo = (videoId: number) => {
        if (confirm('Are you sure you want to delete this video?')) {
            router.delete(`/videos/${videoId}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Videos" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
                        <p className="text-muted-foreground">
                            Manage all your uploaded videos and their publishing status
                        </p>
                    </div>
                    <Link href="/videos/create">
                        <Button size="lg">
                            <Plus className="mr-2 h-4 w-4" />
                            Upload Video
                        </Button>
                    </Link>
                </div>

                {/* Videos List */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Videos</CardTitle>
                        <CardDescription>
                            Your uploaded videos and their publishing status across platforms
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {videos.data.length === 0 ? (
                            <div className="text-center py-8">
                                <VideoIcon className="mx-auto h-12 w-12 text-muted-foreground" />
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
                                            <div className="flex items-center gap-2">
                                                <Link href={`/videos/${video.id}`}>
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