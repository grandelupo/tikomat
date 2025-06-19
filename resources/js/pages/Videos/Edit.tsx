import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import AIVideoAnalyzer from '@/components/AIVideoAnalyzer';
import AIContentOptimizer from '@/components/AIContentOptimizer';
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
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Brain, Wand2, BarChart3, Image, Calendar, TrendingUp, Users, Target, Search, Scan, Mic } from 'lucide-react';
import { useState } from 'react';

interface Video {
    id: number;
    title: string;
    description: string;
    duration: number;
    formatted_duration: string;
    created_at: string;
    file_path?: string;
    tags?: string[];
    thumbnail?: string;
}

interface VideoEditProps {
    video: Video;
}

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
            href: `/videos/${video.id}`,
        },
        {
            title: 'Edit',
            href: `/videos/${video.id}/edit`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm<Video>({
        title: video.title || '',
        description: video.description || '',
        tags: video.tags || [],
        thumbnail: null,
    });

    const [activeTab, setActiveTab] = useState('edit');

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit: ${video.title}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Link href={`/videos/${video.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Video
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Video</h1>
                        <p className="text-muted-foreground">
                            Update your video with AI-powered optimization and analysis
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Edit Form */}
                    <div className="lg:col-span-2">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-12">
                                <TabsTrigger value="edit">Edit</TabsTrigger>
                                <TabsTrigger value="ai-optimize">AI Optimize</TabsTrigger>
                                <TabsTrigger value="ai-analyze">AI Analyze</TabsTrigger>
                                <TabsTrigger value="ai-performance">AI Performance</TabsTrigger>
                                <TabsTrigger value="ai-thumbnails">AI Thumbnails</TabsTrigger>
                                <TabsTrigger value="ai-calendar">AI Calendar</TabsTrigger>
                                <TabsTrigger value="ai-trends">AI Trends</TabsTrigger>
                                <TabsTrigger value="ai-audience">AI Audience</TabsTrigger>
                                <TabsTrigger value="ai-strategy">AI Strategy</TabsTrigger>
                                <TabsTrigger value="ai-seo">AI SEO</TabsTrigger>
                                <TabsTrigger value="ai-watermark">AI Watermark</TabsTrigger>
                                <TabsTrigger value="ai-subtitles">AI Subtitles</TabsTrigger>
                            </TabsList>

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
                                                <Link href={`/videos/${video.id}`}>
                                                    <Button type="button" variant="outline">
                                                        Cancel
                                                    </Button>
                                                </Link>
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
                                    initialTitle={data.title}
                                    initialDescription={data.description}
                                    onOptimizationApply={handleOptimizationApply}
                                />
                            </TabsContent>

                            <TabsContent value="ai-analyze" className="space-y-6">
                                <AIVideoAnalyzer
                                    videoPath={video.file_path}
                                    onAnalysisComplete={handleAnalysisComplete}
                                />
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
                                    videoPath="/path/to/video" // In real implementation, this would come from video data
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

                            <TabsContent value="ai-watermark">
                                <AIWatermarkRemover 
                                    videoPath={video.file_path}
                                    onRemovalComplete={(result) => console.log('Watermark removal completed:', result)}
                                />
                            </TabsContent>

                            <TabsContent value="ai-subtitles">
                                <AISubtitleGenerator 
                                    videoPath={video.file_path}
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

                                    <div className="p-3 bg-white rounded-lg border border-red-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Scan className="w-4 h-4 text-red-600" />
                                            <span className="font-medium text-sm">AI Watermark Remover</span>
                                        </div>
                                        <p className="text-xs text-gray-600">
                                            Automatically detect and remove watermarks from your videos using advanced AI techniques.
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

                        {/* Quick Actions */}
                        <Card>
                            <CardHeader className="pb-4">
                                <CardTitle className="text-lg">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        // Switch to optimize tab
                                        const tabTrigger = document.querySelector('[data-value="ai-optimize"]') as HTMLElement;
                                        tabTrigger?.click();
                                    }}
                                >
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Optimize Content
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => {
                                        // Switch to analyze tab
                                        const tabTrigger = document.querySelector('[data-value="ai-analyze"]') as HTMLElement;
                                        tabTrigger?.click();
                                    }}
                                >
                                    <Brain className="w-4 h-4 mr-2" />
                                    Analyze Video
                                </Button>
                                
                                <Button 
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                    onClick={() => setActiveTab('ai-performance')}
                                >
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Performance Optimizer
                                </Button>

                                <Button 
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                                    onClick={() => setActiveTab('ai-thumbnails')}
                                >
                                    <Image className="w-4 h-4 mr-2" />
                                    Thumbnail Optimizer
                                </Button>

                                <Button 
                                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                                    onClick={() => setActiveTab('ai-calendar')}
                                >
                                    <Calendar className="w-4 h-4 mr-2" />
                                    Content Calendar
                                </Button>

                                <Button 
                                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                                    onClick={() => setActiveTab('ai-trends')}
                                >
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Trend Analyzer
                                </Button>

                                <Button 
                                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                                    onClick={() => setActiveTab('ai-audience')}
                                >
                                    <Users className="w-4 h-4 mr-2" />
                                    Audience Insights
                                </Button>

                                <Button 
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                                    onClick={() => setActiveTab('ai-strategy')}
                                >
                                    <Target className="w-4 h-4 mr-2" />
                                    Strategy Planner
                                </Button>

                                <Button 
                                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                                    onClick={() => setActiveTab('ai-seo')}
                                >
                                    <Search className="w-4 h-4 mr-2" />
                                    SEO Optimizer
                                </Button>

                                <Button 
                                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white"
                                    onClick={() => setActiveTab('ai-watermark')}
                                >
                                    <Scan className="w-4 h-4 mr-2" />
                                    Watermark Remover
                                </Button>

                                <Button 
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                                    onClick={() => setActiveTab('ai-subtitles')}
                                >
                                    <Mic className="w-4 h-4 mr-2" />
                                    Subtitle Generator
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 