import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Youtube, Instagram, Video as VideoIcon, Clock, CheckCircle, XCircle, AlertCircle, Edit, Trash2, ArrowLeft } from 'lucide-react';

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

interface VideoShowProps {
    video: Video;
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

export default function VideoShow({ video }: VideoShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Videos',
            href: '/videos',
        },
        {
            title: video.title,
            href: `/videos/${video.id}`,
        },
    ];

    const handleRetryTarget = (targetId: number) => {
        router.post(`/video-targets/${targetId}/retry`);
    };

    const handleDeleteVideo = () => {
        if (confirm('Are you sure you want to delete this video?')) {
            router.delete(`/videos/${video.id}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Video: ${video.title}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/videos">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Videos
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{video.title}</h1>
                            <p className="text-muted-foreground">
                                Uploaded {new Date(video.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={`/videos/${video.id}/edit`}>
                            <Button variant="outline">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button 
                            variant="outline" 
                            onClick={handleDeleteVideo}
                            className="text-red-600 hover:text-red-700"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Video Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Video Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground">Title</h3>
                                <p className="mt-1">{video.title}</p>
                            </div>
                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground">Description</h3>
                                <p className="mt-1">{video.description}</p>
                            </div>
                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground">Duration</h3>
                                <p className="mt-1">{video.formatted_duration}</p>
                            </div>
                            <div>
                                <h3 className="font-medium text-sm text-muted-foreground">Upload Date</h3>
                                <p className="mt-1">{new Date(video.created_at).toLocaleString()}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Publishing Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Publishing Status</CardTitle>
                            <CardDescription>
                                Status for each platform
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {video.targets.map((target) => {
                                    const StatusIcon = statusIcons[target.status];
                                    const PlatformIcon = platformIcons[target.platform as keyof typeof platformIcons];
                                    
                                    return (
                                        <div key={target.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <PlatformIcon className="h-5 w-5" />
                                                <div>
                                                    <p className="font-medium capitalize">{target.platform}</p>
                                                    {target.publish_at && (
                                                        <p className="text-sm text-muted-foreground">
                                                            Scheduled: {new Date(target.publish_at).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge 
                                                    variant="secondary"
                                                    className={`${statusColors[target.status]} flex items-center gap-1`}
                                                >
                                                    <StatusIcon className="h-3 w-3" />
                                                    {target.status}
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
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Error Messages */}
                {video.targets.some(target => target.status === 'failed' && target.error_message) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-red-600">Error Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {video.targets
                                    .filter(target => target.status === 'failed' && target.error_message)
                                    .map((target) => (
                                        <div key={target.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <div className="flex items-center gap-2 mb-2">
                                                <XCircle className="h-4 w-4 text-red-600" />
                                                <span className="font-medium capitalize text-red-600">
                                                    {target.platform} Error
                                                </span>
                                            </div>
                                            <p className="text-sm text-red-700">{target.error_message}</p>
                                        </div>
                                    ))
                                }
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
} 