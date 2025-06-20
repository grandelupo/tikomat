import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import AIVideoAnalyzer from '@/components/AIVideoAnalyzer';
import AIContentOptimizer from '@/components/AIContentOptimizer';
import ErrorBoundary from '@/components/ErrorBoundary';
import AIPerformanceOptimizer from '@/components/AIPerformanceOptimizer';
import AIThumbnailOptimizer from '@/components/AIThumbnailOptimizer';
import AIContentCalendar from '@/components/AIContentCalendar';
import AITrendAnalyzer from '@/components/AITrendAnalyzer';
import AIAudienceInsights from '@/components/AIAudienceInsights';
import AIContentStrategyPlanner from '@/components/AIContentStrategyPlanner';
import AISEOOptimizer from '@/components/AISEOOptimizer';
import AIWatermarkRemover from '@/components/AIWatermarkRemover';
import AISubtitleGenerator from '@/components/AISubtitleGenerator';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Save, Brain, Wand2, BarChart3, Image, Calendar, TrendingUp, Users, Target, Search, Scan, Mic, Trash2, ExternalLink, X, Youtube, Instagram, Video as VideoIcon, Clock, CheckCircle, XCircle, AlertCircle, Play } from 'lucide-react';
import { useState } from 'react';

interface VideoTarget {
    id: number;
    platform: string;
    status: string;
    error_message: string | null;
    publish_at: string | null;
    platform_video_id?: string;
    platform_url?: string;
}

interface Video {
    id: number;
    title: string;
    description: string;
    duration: number;
    formatted_duration: string;
    created_at: string;
    file_path?: string;
    video_path?: string;
    original_file_path?: string;
    tags?: string[];
    thumbnail?: string;
    targets?: VideoTarget[];
}

interface VideoEditProps {
    video: Video;
}

const platformIcons = {
    youtube: Youtube,
    instagram: Instagram,
    tiktok: VideoIcon,
    facebook: VideoIcon,
    snapchat: VideoIcon,
    pinterest: VideoIcon,
    twitter: VideoIcon,
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

export default function VideoEdit({ video }: VideoEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'My channels',
            href: '/dashboard',
        },
        {
            title: 'Videos',
            href: '/videos',
        },
        {
            title: video.title,
            href: `/videos/${video.id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        title: video.title || '',
        description: video.description || '',
        tags: video.tags || [],
        thumbnail: null,
    });

    const [activeTab, setActiveTab] = useState('overview');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteOption, setDeleteOption] = useState<'all' | 'tikomat'>('tikomat');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/videos/${video.id}`);
    };

    const handleOptimizationApply = (optimizedData: any) => {
        // Apply optimized content to the form
        if (optimizedData.title) {
            setData('title', optimizedData.title);
        }
        if (optimizedData.description) {
            setData('description', optimizedData.description);
        }
    };

    const handleAnalysisComplete = (analysis: any) => {
        // Use analysis data to pre-populate content if needed
        if (analysis.content_tags && analysis.content_tags.length > 0) {
            // Could add tags to description or use for optimization
            console.log('Video analysis completed:', analysis);
        }
    };

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
            <Head title={`Edit: ${video.title}`} />
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
                                Edit and optimize your video with AI-powered tools
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
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

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-1">
                                <TabsTrigger value="overview" className="text-xs px-2 py-1">Overview</TabsTrigger>
                                <TabsTrigger value="edit" className="text-xs px-2 py-1">Edit</TabsTrigger>
                                <TabsTrigger value="ai-optimize" className="text-xs px-2 py-1">AI Optimize</TabsTrigger>
                                <TabsTrigger value="ai-analyze" className="text-xs px-2 py-1">AI Analyze</TabsTrigger>
                                <TabsTrigger value="ai-performance" className="text-xs px-2 py-1">Performance</TabsTrigger>
                                <TabsTrigger value="ai-thumbnails" className="text-xs px-2 py-1">Thumbnails</TabsTrigger>
                                <TabsTrigger value="ai-calendar" className="text-xs px-2 py-1">Calendar</TabsTrigger>
                                <TabsTrigger value="ai-trends" className="text-xs px-2 py-1">Trends</TabsTrigger>
                                <TabsTrigger value="ai-audience" className="text-xs px-2 py-1">Audience</TabsTrigger>
                                <TabsTrigger value="ai-strategy" className="text-xs px-2 py-1">Strategy</TabsTrigger>
                                <TabsTrigger value="ai-seo" className="text-xs px-2 py-1">SEO</TabsTrigger>
                                <TabsTrigger value="ai-subtitles" className="text-xs px-2 py-1">Subtitles</TabsTrigger>
                            </TabsList>

                            {/* Overview Tab - Video Preview and Details */}
                            <TabsContent value="overview" className="space-y-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    {/* Video Player */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Play className="w-5 h-5" />
                                                Video Preview
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
                                                {video.video_path || video.file_path ? (
                                                    <video 
                                                        src={video.video_path || video.file_path}
                                                        controls
                                                        className="w-full h-full"
                                                        onError={(e) => {
                                                            console.error('Video failed to load:', e);
                                                            e.currentTarget.style.display = 'none';
                                                            const errorDiv = e.currentTarget.nextElementSibling as HTMLElement;
                                                            if (errorDiv) errorDiv.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full text-white">
                                                        <div className="text-center">
                                                            <Play className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                                            <p>No video file available</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-center h-full text-white" style={{display: 'none'}}>
                                                    <div className="text-center">
                                                        <XCircle className="w-12 h-12 mx-auto mb-2 text-red-500" />
                                                        <p>Failed to load video</p>
                                                        <p className="text-sm opacity-75">Check if the video file exists</p>
                                                    </div>
                                                </div>
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
                                </div>

                                {/* Publishing Status */}
                                {video.targets && video.targets.length > 0 && (
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Publishing Status</CardTitle>
                                            <CardDescription>
                                                Current status for each platform
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
                                )}

                                {/* Error Details */}
                                {video.targets && video.targets.some(target => target.status === 'failed' && target.error_message) && (
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
                            </TabsContent>

                            {/* Edit Tab */}
                            <TabsContent value="edit" className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Video Information</CardTitle>
                                        <CardDescription>
                                            Edit the basic information for your video
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleSubmit} className="space-y-6">
                                            {/* Video Info (Read-only) */}
                                            <div className="p-4 bg-gray-50 rounded-lg dark:bg-gray-800">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Duration</p>
                                                        <p className="text-lg dark:text-gray-400">{video.formatted_duration}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upload Date</p>
                                                        <p className="text-lg dark:text-gray-400">{new Date(video.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Title */}
                                            <div className="space-y-2">
                                                <Label htmlFor="title">Title</Label>
                                                <Input
                                                    id="title"
                                                    value={data.title}
                                                    onChange={(e) => setData('title', e.target.value)}
                                                    placeholder="Enter video title"
                                                />
                                                {errors.title && (
                                                    <p className="text-sm text-red-600">{errors.title}</p>
                                                )}
                                            </div>

                                            {/* Description */}
                                            <div className="space-y-2">
                                                <Label htmlFor="description">Description</Label>
                                                <Textarea
                                                    id="description"
                                                    value={data.description}
                                                    onChange={(e) => setData('description', e.target.value)}
                                                    placeholder="Enter video description"
                                                    rows={4}
                                                />
                                                {errors.description && (
                                                    <p className="text-sm text-red-600">{errors.description}</p>
                                                )}
                                            </div>

                                            {/* Submit Buttons */}
                                            <div className="flex justify-end space-x-4">
                                                <Button type="button" variant="outline" onClick={() => setActiveTab('overview')}>
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    type="submit" 
                                                    disabled={processing}
                                                >
                                                    <Save className="mr-2 h-4 w-4" />
                                                    {processing ? 'Saving...' : 'Save Changes'}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="ai-optimize" className="space-y-6">
                                <AIContentOptimizer
                                    title={data.title}
                                    description={data.description}
                                    platforms={video.targets?.map(t => t.platform) || ['youtube']}
                                    onTitleChange={(title) => setData('title', title)}
                                    onDescriptionChange={(description) => setData('description', description)}
                                    onTagsUpdate={(platform, tags) => {
                                        // Handle tags update for specific platform
                                        console.log(`Tags for ${platform}:`, tags);
                                    }}
                                />
                            </TabsContent>

                            <TabsContent value="ai-analyze" className="space-y-6">
                                <ErrorBoundary>
                                    <AIVideoAnalyzer
                                        videoPath={video.original_file_path}
                                        onAnalysisComplete={handleAnalysisComplete}
                                    />
                                </ErrorBoundary>
                            </TabsContent>

                            <TabsContent value="ai-performance">
                                <AIPerformanceOptimizer 
                                    videoId={video.id}
                                    className="mb-4"
                                />
                            </TabsContent>

                            <TabsContent value="ai-thumbnails">
                                <AIThumbnailOptimizer 
                                    videoId={video.id}
                                    videoPath={video.original_file_path || "/path/to/video"}
                                    title={data.title}
                                    className="mb-4"
                                />
                            </TabsContent>

                            <TabsContent value="ai-calendar">
                                <AIContentCalendar 
                                    userId={1} // In real implementation, this would come from auth
                                    className="mb-4"
                                />
                            </TabsContent>

                            <TabsContent value="ai-trends">
                                <AITrendAnalyzer 
                                    userId={1} // In real implementation, this would come from auth
                                    className="mb-4"
                                />
                            </TabsContent>

                            <TabsContent value="ai-audience">
                                <AIAudienceInsights 
                                    videoId={video.id}
                                />
                            </TabsContent>

                            <TabsContent value="ai-strategy">
                                <AIContentStrategyPlanner 
                                    video={video}
                                />
                            </TabsContent>

                            <TabsContent value="ai-seo">
                                <AISEOOptimizer 
                                    video={video}
                                    contentId={video.id}
                                    contentType="video"
                                />
                            </TabsContent>

                            <TabsContent value="ai-subtitles">
                                <AISubtitleGenerator 
                                    videoPath={video.original_file_path || "/path/to/video"}
                                />
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* AI Sidebar */}
                    <div className="space-y-6">
                        <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
                            <CardHeader className="pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                                        <Brain className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                            AI Assistant
                                        </CardTitle>
                                        <p className="text-sm text-gray-600">
                                            Powered by advanced AI
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="p-3 bg-white rounded-lg border border-purple-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Wand2 className="w-4 h-4 text-purple-600" />
                                            <span className="font-medium text-sm">AI Content Optimization</span>
                                        </div>
                                        <p className="text-xs text-gray-600">
                                            Generate platform-specific titles, descriptions, and hashtags optimized for maximum engagement.
                                        </p>
                                    </div>
                                    
                                    <div className="p-3 bg-white rounded-lg border border-blue-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Brain className="w-4 h-4 text-blue-600" />
                                            <span className="font-medium text-sm">AI Video Analysis</span>
                                        </div>
                                        <p className="text-xs text-gray-600">
                                            Deep analysis of your video content including quality assessment, transcription, and engagement predictions.
                                        </p>
                                    </div>

                                    <div className="p-3 bg-white rounded-lg border border-purple-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Mic className="w-4 h-4 text-purple-600" />
                                            <span className="font-medium text-sm">AI Subtitle Generator</span>
                                        </div>
                                        <p className="text-xs text-gray-600">
                                            Automatically generate precise subtitles with perfect timing and customizable animated styles.
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-purple-100">
                                    <p className="text-xs text-gray-500 text-center">
                                        ✨ Switch between tabs to access different AI features
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        
                    </div>
                </div>

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