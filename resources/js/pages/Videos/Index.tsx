import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Youtube, Instagram, Video as VideoIcon, Clock, CheckCircle, XCircle, AlertCircle, Eye, Edit, Trash2, Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import VideoThumbnail from '@/components/VideoThumbnail';

interface Video {
    id: number;
    title: string;
    description: string;
    duration: number;
    formatted_duration: string;
    created_at: string;
    tags?: string[];
    thumbnail_path: string | null;
    video_width: number | null;
    video_height: number | null;
    cloud_upload_providers?: string[];
    cloud_upload_status?: Record<string, string>;
    cloud_upload_results?: Record<string, any>;
    channel: {
        id: number;
        name: string;
        slug: string;
    } | null;
    targets: VideoTarget[];
}

interface VideoTarget {
    id: number;
    platform: string;
    status: 'pending' | 'processing' | 'success' | 'failed';
    publish_at: string | null;
    error_message: string | null;
}

interface Channel {
    id: number;
    name: string;
    slug: string;
}

interface VideosIndexProps {
    videos: {
        data: Video[];
        links: any;
        meta: any;
    };
    channels: Channel[];
    filters: {
        channel?: string;
        platform?: string;
        status?: string;
        search?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My channels',
        href: '/dashboard',
    },
    {
        title: 'All videos',
        href: '/videos',
    },
];

const platformIcons = {
    youtube: Youtube,
    instagram: Instagram,
    tiktok: VideoIcon,
    facebook: VideoIcon,
    x: VideoIcon,
    snapchat: VideoIcon,
    pinterest: VideoIcon,
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

export default function VideosIndex({ videos, channels, filters }: VideosIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedChannel, setSelectedChannel] = useState(filters.channel || '');
    const [selectedPlatform, setSelectedPlatform] = useState(filters.platform || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteVideoId, setDeleteVideoId] = useState<number | null>(null);
    const [deleteOption, setDeleteOption] = useState<'all' | 'filmate'>('filmate');

    const handleFilterChange = () => {
        const params = new URLSearchParams();
        if (searchTerm) params.set('search', searchTerm);
        if (selectedChannel && selectedChannel !== 'all') params.set('channel', selectedChannel);
        if (selectedPlatform && selectedPlatform !== 'all') params.set('platform', selectedPlatform);
        if (selectedStatus && selectedStatus !== 'all') params.set('status', selectedStatus);

        router.get('/videos', Object.fromEntries(params), { preserveState: true });
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedChannel('');
        setSelectedPlatform('');
        setSelectedStatus('');
        router.get('/videos', {}, { preserveState: true });
    };

    const handleRetryTarget = (targetId: number) => {
        router.post(`/video-targets/${targetId}/retry`);
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

    const getDefaultChannel = () => {
        return channels.find(c => c.name.toLowerCase().includes('default')) || channels[0];
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Recently Uploaded Videos" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Recently Uploaded</h1>
                        <p className="text-muted-foreground">
                            Manage all your uploaded videos and their publishing status
                        </p>
                    </div>
                    {channels.length > 0 && getDefaultChannel() && getDefaultChannel()?.slug && (
                        <Link href={`/channels/${getDefaultChannel()?.slug}/videos/create`}>
                            <Button size="lg">
                                <Plus className="mr-2 h-4 w-4" />
                                Upload Video
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Filter className="w-4 h-4 mr-2" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        placeholder="Search videos..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                        onKeyPress={(e) => e.key === 'Enter' && handleFilterChange()}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Channel</label>
                                <Select value={selectedChannel || 'all'} onValueChange={(value) => setSelectedChannel(value === 'all' ? '' : value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All channels" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All channels</SelectItem>
                                        {channels.map((channel) => (
                                            <SelectItem key={channel.id} value={channel.slug}>
                                                {channel.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Platform</label>
                                <Select value={selectedPlatform || 'all'} onValueChange={(value) => setSelectedPlatform(value === 'all' ? '' : value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All platforms" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All platforms</SelectItem>
                                        <SelectItem value="youtube">YouTube</SelectItem>
                                        <SelectItem value="instagram">Instagram</SelectItem>
                                        <SelectItem value="tiktok">TikTok</SelectItem>
                                        <SelectItem value="facebook">Facebook</SelectItem>
                                        <SelectItem value="x">X</SelectItem>
                                        <SelectItem value="snapchat">Snapchat</SelectItem>
                                        <SelectItem value="pinterest">Pinterest</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Status</label>
                                <Select value={selectedStatus || 'all'} onValueChange={(value) => setSelectedStatus(value === 'all' ? '' : value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All statuses" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All statuses</SelectItem>
                                        <SelectItem value="pending">Pending</SelectItem>
                                        <SelectItem value="processing">Processing</SelectItem>
                                        <SelectItem value="success">Success</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end gap-2">
                                <Button onClick={handleFilterChange} className="flex-1">
                                    Apply Filters
                                </Button>
                                <Button variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Videos Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Videos ({videos.meta?.total || 0})</CardTitle>
                        <CardDescription>
                            Your uploaded videos and their publishing status across platforms
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {videos.data.length === 0 ? (
                            <div className="text-center py-8">
                                <VideoIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-2 text-sm font-semibold text-gray-900">No videos found</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    {Object.values(filters).some(f => f) ? 'Try adjusting your filters.' : 'Get started by uploading your first video.'}
                                </p>
                                {!Object.values(filters).some(f => f) && channels.length > 0 && getDefaultChannel() && getDefaultChannel()?.slug && (
                                    <div className="mt-6">
                                        <Link href={`/channels/${getDefaultChannel()?.slug}/videos/create`}>
                                            <Button>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Upload Video
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                                                        <TableHead className="w-20">Thumbnail</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Channel</TableHead>
                                <TableHead>Tags</TableHead>
                                <TableHead>Duration</TableHead>
                                <TableHead>Platforms</TableHead>
                                <TableHead>Cloud Backup</TableHead>
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
                                                    <p className="font-medium">{video.title}</p>
                                                    {video.description && (
                                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                                            {video.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {video.channel ? (
                                                    <Link
                                                        href={`/channels/${video.channel.slug}`}
                                                        className="text-blue-600 hover:text-blue-700"
                                                    >
                                                        {video.channel.name}
                                                    </Link>
                                                ) : (
                                                    <span className="text-muted-foreground">No Channel</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {video.tags && video.tags.length > 0 ? (
                                                        video.tags.slice(0, 3).map((tag) => (
                                                            <Badge key={tag} variant="secondary" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-muted-foreground text-xs">No tags</span>
                                                    )}
                                                    {video.tags && video.tags.length > 3 && (
                                                        <Badge variant="outline" className="text-xs">
                                                            +{video.tags.length - 3}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>{video.formatted_duration}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {video.targets.map((target) => {
                                                        const StatusIcon = statusIcons[target.status];
                                                        const PlatformIcon = platformIcons[target.platform as keyof typeof platformIcons];

                                                        return (
                                                            <div key={target.id} className="flex items-center">
                                                                <Badge
                                                                    variant="secondary"
                                                                    className={`${statusColors[target.status]} flex items-center gap-1 text-xs text-foreground`}
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
                                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted cursor-pointer" onClick={() => setDeleteOption('filmate')}>
                                    <input
                                        type="radio"
                                        id="delete-filmate-videos"
                                        name="delete-option"
                                        value="filmate"
                                        checked={deleteOption === 'filmate'}
                                        onChange={(e) => setDeleteOption(e.target.value as 'filmate')}
                                        className="h-4 w-4 mt-0.5"
                                    />
                                    <div className="flex-1">
                                        <label htmlFor="delete-filmate-videos" className="text-sm font-medium cursor-pointer">
                                            Remove only from Filmate
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Video will remain published on all platforms but removed from Filmate's tracking
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted cursor-pointer" onClick={() => setDeleteOption('all')}>
                                    <input
                                        type="radio"
                                        id="delete-all-videos"
                                        name="delete-option"
                                        value="all"
                                        checked={deleteOption === 'all'}
                                        onChange={(e) => setDeleteOption(e.target.value as 'all')}
                                        className="h-4 w-4 mt-0.5"
                                    />
                                    <div className="flex-1">
                                        <label htmlFor="delete-all-videos" className="text-sm font-medium cursor-pointer">
                                            Take down from all platforms
                                        </label>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Video will be completely removed from all platforms and Filmate
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
                                {deleteOption === 'all' ? 'Take Down Video' : 'Remove from Filmate'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}