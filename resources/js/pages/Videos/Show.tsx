import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Youtube, Instagram, Video as VideoIcon, Clock, CheckCircle, XCircle, AlertCircle, Edit, Trash2, ArrowLeft, ExternalLink, X } from 'lucide-react';
import { useState } from 'react';
import VideoThumbnail from '@/components/VideoThumbnail';

interface Video {
    id: number;
    title: string;
    description: string;
    duration: number;
    formatted_duration: string;
    created_at: string;
    video_path: string;
    targets: VideoTarget[];
}

interface VideoTarget {
    id: number;
    platform: string;
    status: string;
    error_message: string | null;
    publish_at: string | null;
    platform_video_id?: string;
    platform_url?: string;
}

interface VideoShowProps {
    video: Video;
}

const platformIcons = {
    youtube: Youtube,
    instagram: Instagram,
    tiktok: VideoIcon,
};

const statusIcons = {
    pending: Clock,
    processing: AlertCircle,
    success: CheckCircle,
    failed: XCircle,
};

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    success: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Videos',
        href: '/videos',
    },
    {
        title: 'Video Details',
        href: '#',
    },
];

export default function VideoShow({ video }: VideoShowProps) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteOption, setDeleteOption] = useState<'all' | 'tikomat' | 'archive'>('tikomat');

    const handleDeleteVideo = () => {
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        router.delete(`/videos/${video.id}`, {
            data: { delete_option: deleteOption },
            onSuccess: () => {
                router.visit('/videos');
            },
        });
    };

    const handleRemoveFromPlatform = (targetId: number, platform: string) => {
        if (confirm(`Are you sure you want to remove this video from ${platform}?`)) {
            router.delete(`/video-targets/${targetId}`, {
                preserveScroll: true,
                onSuccess: () => {
                    // Video page will be refreshed automatically
                },
                onError: (errors) => {
                    console.error('Failed to remove video from platform:', errors);
                    alert('Failed to remove video from platform. Please try again.');
                }
            });
        }
    };

    const getPlatformUrl = (target: VideoTarget) => {
        if (target.platform_url) {
            return target.platform_url;
        }

        // Default platform URLs based on platform_video_id
        switch (target.platform) {
            case 'youtube':
                return target.platform_video_id ? `https://youtube.com/watch?v=${target.platform_video_id}` : null;
            case 'instagram':
                return target.platform_video_id ? `https://instagram.com/p/${target.platform_video_id}` : null;
            case 'tiktok':
                return target.platform_video_id ? `https://tiktok.com/@username/video/${target.platform_video_id}` : null;
            default:
                return null;
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
                    {/* Video Player */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Video Preview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                                <video 
                                    src={video.video_path}
                                    controls
                                    className="w-full h-full"
                                />
                            </div>
                        </CardContent>
                    </Card>

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
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Publishing Status</CardTitle>
                            <CardDescription>
                                Status for each platform
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {video.targets.map((target) => {
                                    const StatusIcon = statusIcons[target.status as keyof typeof statusIcons];
                                    const PlatformIcon = platformIcons[target.platform as keyof typeof platformIcons];
                                    const platformUrl = getPlatformUrl(target);
                                    
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
                                                <Badge className={statusColors[target.status as keyof typeof statusColors]}>
                                                    <StatusIcon className="w-3 h-3 mr-1" />
                                                    {target.status}
                                                </Badge>
                                                {platformUrl && target.status === 'success' && (
                                                    <a 
                                                        href={platformUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-700"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </a>
                                                )}
                                                {target.status === 'success' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleRemoveFromPlatform(target.id, target.platform)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <X className="w-3 h-3 mr-1" />
                                                        Remove
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

                {/* Error Details */}
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
                                        id="delete-tikomat"
                                        name="delete-option"
                                        value="tikomat"
                                        checked={deleteOption === 'tikomat'}
                                        onChange={(e) => setDeleteOption(e.target.value as 'tikomat')}
                                        className="h-4 w-4 mt-0.5"
                                    />
                                    <div className="flex-1">
                                        <label htmlFor="delete-tikomat" className="text-sm font-medium cursor-pointer">
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
                                        id="delete-all"
                                        name="delete-option"
                                        value="all"
                                        checked={deleteOption === 'all'}
                                        onChange={(e) => setDeleteOption(e.target.value as 'all')}
                                        className="h-4 w-4 mt-0.5"
                                    />
                                    <div className="flex-1">
                                        <label htmlFor="delete-all" className="text-sm font-medium cursor-pointer">
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