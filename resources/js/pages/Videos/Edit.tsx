import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import AIVideoAnalyzer from '@/components/AIVideoAnalyzer';
import AIPerformanceOptimizer from '@/components/AIPerformanceOptimizer';
import AIThumbnailOptimizer from '@/components/AIThumbnailOptimizer';
import AISubtitleGenerator from '@/components/AISubtitleGenerator';
import ErrorBoundary from '@/components/ErrorBoundary';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { ArrowLeft, Save, Brain, Wand2, BarChart3, Image, Play, Clock, CheckCircle, XCircle, AlertCircle, Youtube, Instagram, Video as VideoIcon, ExternalLink, X, Trash2, Upload, Zap, Star, Eye, Heart, Share, ThumbsUp, Camera, Palette, Type, Target, Layers, TrendingUp, Plus, Minus, Settings2, Sparkles, Tag, RefreshCw } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import ThumbnailOptimizerPopup from '@/components/ThumbnailOptimizerPopup';

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
    video_path?: string; // Computed attribute from getVideoPathAttribute()
    original_file_path?: string; // Raw storage path
    tags?: string[];
    thumbnail?: string;
    targets?: VideoTarget[];
    width?: number;
    height?: number;
}

interface VideoEditProps {
    video: Video;
}

// Enhanced platform icons and status mapping
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

// Video quality assessment helper
const getVideoQualityStatus = (width?: number, height?: number) => {
    if (!width || !height) return { status: 'unknown', color: 'text-gray-500', label: 'Unknown' };
    
    const pixels = width * height;
    if (pixels >= 1920 * 1080) return { status: 'great', color: 'text-green-600', label: '1080p+' };
    if (pixels >= 1280 * 720) return { status: 'good', color: 'text-orange-500', label: '720p' };
    return { status: 'poor', color: 'text-red-600', label: 'Low Quality' };
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
    const [generatingTitle, setGeneratingTitle] = useState(false);
    const [generatingDescription, setGeneratingDescription] = useState(false);
    const [selectedThumbnail, setSelectedThumbnail] = useState<string | null>(video.thumbnail || null);
    const [thumbnailSliderValue, setThumbnailSliderValue] = useState([0]);
    const [customThumbnail, setCustomThumbnail] = useState<File | null>(null);
    const [videoAnalysis, setVideoAnalysis] = useState<any>(null);
    const [thumbnailSuggestions, setThumbnailSuggestions] = useState<any[]>([]);
    const [showThumbnailOptimizer, setShowThumbnailOptimizer] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isGeneratingTags, setIsGeneratingTags] = useState(false);
    const [availablePlatforms] = useState(['youtube', 'instagram', 'tiktok', 'facebook', 'twitter', 'pinterest', 'snapchat']);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const videoQuality = getVideoQualityStatus(video.width, video.height);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/videos/${video.id}`);
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

    const generateAITitle = async () => {
        setGeneratingTitle(true);
        try {
            const response = await fetch('/ai/generate-video-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    video_id: video.id,
                    content_type: 'title',
                    current_title: data.title
                }),
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data.optimized_title) {
                    setData('title', result.data.optimized_title);
                    
                    // Show analysis info if available
                    const analysis = result.data.analysis_summary;
                    let message = "Title generated based on video content analysis";
                    
                    if (analysis) {
                        const details = [];
                        if (analysis.has_transcript) details.push("audio transcription");
                        if (analysis.scenes_detected > 0) details.push(`${analysis.scenes_detected} visual scenes`);
                        if (analysis.content_category !== 'unknown') details.push(`${analysis.content_category} content`);
                        
                        if (details.length > 0) {
                            message += `. Analyzed: ${details.join(', ')}.`;
                        }
                    }
                    
                    alert(`✅ AI Title Generated!\n\n${message}`);
                }
            } else {
                const error = await response.json();
                console.error('Failed to generate AI title:', error);
                alert(`Failed to generate title: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to generate AI title:', error);
            alert('An error occurred while generating the title. Please try again.');
        } finally {
            setGeneratingTitle(false);
        }
    };

    const generateAIDescription = async () => {
        setGeneratingDescription(true);
        try {
            const response = await fetch('/ai/generate-video-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    video_id: video.id,
                    content_type: 'description',
                    current_description: data.description
                }),
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.data.optimized_description) {
                    setData('description', result.data.optimized_description);
                    
                    // Show analysis info if available
                    const analysis = result.data.analysis_summary;
                    let message = "Description generated based on video content analysis";
                    
                    if (analysis) {
                        const details = [];
                        if (analysis.has_transcript) details.push("audio transcription");
                        if (analysis.scenes_detected > 0) details.push(`${analysis.scenes_detected} visual scenes`);
                        if (analysis.content_category !== 'unknown') details.push(`${analysis.content_category} content`);
                        
                        if (details.length > 0) {
                            message += `. Analyzed: ${details.join(', ')}.`;
                        }
                    }
                    
                    alert(`✅ AI Description Generated!\n\n${message}`);
                }
            } else {
                const error = await response.json();
                console.error('Failed to generate AI description:', error);
                alert(`Failed to generate description: ${error.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to generate AI description:', error);
            alert('An error occurred while generating the description. Please try again.');
        } finally {
            setGeneratingDescription(false);
        }
    };

    const handleThumbnailUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setCustomThumbnail(file);
            const reader = new FileReader();
            reader.onload = (e) => {
                setSelectedThumbnail(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleVideoAnalysisComplete = (analysis: any) => {
        setVideoAnalysis(analysis);
    };

    const generateThumbnailSuggestions = async () => {
        try {
            const response = await fetch('/ai/generate-thumbnail-suggestions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ video_id: video.id }),
            });
            
            if (response.ok) {
                const result = await response.json();
                setThumbnailSuggestions(result.suggestions || []);
            }
        } catch (error) {
            console.error('Failed to generate thumbnail suggestions:', error);
        }
    };

    // Mock data for demonstration - replace with real API calls
    const mockScores = {
        videoQuality: 8.5,
        engagementScore: 7.2,
        viralityPotential: 6.8,
        expectedViews: '12.5K',
        expectedLikes: '850',
        expectedShares: '120'
    };

    const mockThumbnailRating = {
        contrast: 8.2,
        faceVisibility: 9.1,
        textReadability: 7.5,
        emotionalAppeal: 8.7,
        visualHierarchy: 7.8,
        brandConsistency: 8.0,
        predictedCTR: 6.9
    };

    // Track changes for platform update button
    useEffect(() => {
        const initialData = {
            title: video.title || '',
            description: video.description || '',
            tags: video.tags || []
        };
        
        const hasChanges = JSON.stringify(data) !== JSON.stringify(initialData);
        setHasUnsavedChanges(hasChanges);
    }, [data, video]);

    const generateTags = async () => {
        setIsGeneratingTags(true);
        
        const makeRequest = async (retryCount = 0) => {
            try {
                // Get CSRF token with fallback
                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ||
                                document.querySelector('input[name="_token"]')?.getAttribute('value') || '';
                
                if (!csrfToken) {
                    throw new Error('CSRF token not found');
                }

                const response = await fetch('/ai/analyze-video-tags', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        video_id: video.id,
                        title: data.title || '',
                        description: data.description || ''
                    }),
                });

                // If we get a CSRF error and haven't retried yet, try to refresh the token
                if (response.status === 419 && retryCount === 0) {
                    console.log('CSRF token expired, refreshing...');
                    
                    // Try to refresh the CSRF token
                    const tokenResponse = await fetch('/');
                    if (tokenResponse.ok) {
                        const html = await tokenResponse.text();
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const newToken = doc.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                        
                        if (newToken) {
                            // Update the token in the current page
                            const currentTokenMeta = document.querySelector('meta[name="csrf-token"]');
                            if (currentTokenMeta) {
                                currentTokenMeta.setAttribute('content', newToken);
                            }
                            
                            // Retry the request with the new token
                            return makeRequest(1);
                        }
                    }
                }

                return response;
            } catch (error) {
                if (retryCount === 0) {
                    console.log('Request failed, retrying once...', error);
                    return makeRequest(1);
                } else {
                    throw error;
                }
            }
        };

        try {
            const response = await makeRequest();
            
            if (response.ok) {
                const result = await response.json();
                console.log('Tag generation response:', result);
                
                if (result.success && result.data && result.data.analysis.tags) {
                    setData('tags', result.data.analysis.tags);
                } else {
                    console.warn('Unexpected response structure:', result);
                    // Show user-friendly error message
                    const errorElement = document.createElement('div');
                    errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                    errorElement.textContent = '⚠️ Tag generation failed - unexpected response';
                    document.body.appendChild(errorElement);
                    setTimeout(() => {
                        if (document.body.contains(errorElement)) {
                            document.body.removeChild(errorElement);
                        }
                    }, 5000);
                }
            } else {
                // Handle HTTP error response
                const errorText = await response.text();
                console.error('HTTP Error:', response.status, response.statusText, errorText);
                
                // Show user-friendly error message
                const errorElement = document.createElement('div');
                errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                errorElement.textContent = `⚠️ Tag generation failed - Server error (${response.status})`;
                document.body.appendChild(errorElement);
                setTimeout(() => {
                    if (document.body.contains(errorElement)) {
                        document.body.removeChild(errorElement);
                    }
                }, 5000);
            }
        } catch (error) {
            console.error('Failed to generate tags:', error);
            
            // Show user-friendly error message
            const errorElement = document.createElement('div');
            errorElement.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            errorElement.textContent = '⚠️ Tag generation failed - Network error';
            document.body.appendChild(errorElement);
            setTimeout(() => {
                if (document.body.contains(errorElement)) {
                    document.body.removeChild(errorElement);
                }
            }, 5000);
        } finally {
            setIsGeneratingTags(false);
        }
    };

    const addTag = (tag: string) => {
        if (!data.tags.includes(tag)) {
            setData('tags', [...data.tags, tag]);
        }
    };

    const removeTag = (tagToRemove: string) => {
        setData('tags', data.tags.filter(tag => tag !== tagToRemove));
    };

    const updateAllPlatforms = async () => {
        try {
            const response = await fetch(`/videos/${video.id}/update-platforms`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    title: data.title,
                    description: data.description,
                    tags: data.tags
                }),
            });
            
            if (response.ok) {
                setHasUnsavedChanges(false);
                // Show success message
                const confirmElement = document.createElement('div');
                confirmElement.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                confirmElement.textContent = '✓ All platforms updated successfully!';
                document.body.appendChild(confirmElement);
                
                setTimeout(() => {
                    if (document.body.contains(confirmElement)) {
                        document.body.removeChild(confirmElement);
                    }
                }, 3000);
            }
        } catch (error) {
            console.error('Failed to update platforms:', error);
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

                {/* Update Platforms Button - Show when there are unsaved changes */}
                {hasUnsavedChanges && (
                    <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500 rounded-full">
                                        <RefreshCw className="w-4 h-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-blue-900">Unsaved Changes Detected</p>
                                        <p className="text-sm text-blue-700">Update all connected platforms with your changes</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button 
                                        onClick={updateAllPlatforms}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Update All Platforms
                                    </Button>
                                    <Button 
                                        variant="outline"
                                        onClick={() => {/* Add platform manager */}}
                                    >
                                        <Settings2 className="w-4 h-4 mr-2" />
                                        Manage Platforms
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Simplified Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="overview">Overview/Edit</TabsTrigger>
                        <TabsTrigger value="performance">Performance</TabsTrigger>
                    </TabsList>

                    {/* Overview/Edit Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-6">

                                {/* 2. Subtitle Generator Button */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            Video Editor
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ErrorBoundary>
                                            <AISubtitleGenerator 
                                                videoPath={video.video_path || video.file_path || ''}
                                                videoId={video.id}
                                                videoTitle={video.title}
                                            />
                                        </ErrorBoundary>
                                    </CardContent>
                                </Card>

                                {/* AI Analysis Section */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className="w-5 h-5" />
                                            AI Analysis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ErrorBoundary>
                                            <AIVideoAnalyzer 
                                                videoId={video.id}
                                                videoPath={video.video_path || video.file_path}
                                                onAnalysisComplete={handleVideoAnalysisComplete}
                                            />
                                        </ErrorBoundary>
                                        {videoAnalysis && (
                                            <div className="mt-4 space-y-3">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                                                    <p className="text-lg">{videoAnalysis.category || 'Entertainment'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Mood</p>
                                                    <p className="text-lg">{videoAnalysis.mood || 'Positive'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">AI Tags</p>
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {(videoAnalysis.tags || ['creative', 'engaging', 'trending']).map((tag: string, index: number) => (
                                                            <Badge key={index} variant="secondary" className="text-xs">
                                                                {tag}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* AI Suggestions Section */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Zap className="w-5 h-5" />
                                            AI Suggestions
                                        </CardTitle>
                                        <CardDescription>
                                            Most important optimization recommendations
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <TrendingUp className="w-5 h-5 text-orange-600 mt-0.5" />
                                                    <div>
                                                        <h4 className="font-medium text-orange-900">Increase Engagement</h4>
                                                        <p className="text-sm text-orange-700">Add a call-to-action in the first 5 seconds to boost viewer retention.</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-4 border border-blue-200 bg-blue-50 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
                                                    <div>
                                                        <h4 className="font-medium text-blue-900">Optimize Thumbnail</h4>
                                                        <p className="text-sm text-blue-700">Consider adding text overlay to your thumbnail to increase click-through rate.</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                                                <div className="flex items-start gap-3">
                                                    <Tag className="w-5 h-5 text-green-600 mt-0.5" />
                                                    <div>
                                                        <h4 className="font-medium text-green-900">Add More Tags</h4>
                                                        <p className="text-sm text-green-700">Include platform-specific hashtags to improve discoverability.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

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
                            </div>

                            {/* Right Column */}
                            <div className="space-y-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* 3. Editable Title Field */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Title</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex gap-2">
                                                <Input
                                                    value={data.title}
                                                    onChange={(e) => setData('title', e.target.value)}
                                                    placeholder="Enter video title"
                                                    className="flex-1"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={generateAITitle}
                                                    disabled={generatingTitle}
                                                >
                                                    {generatingTitle ? (
                                                        <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                                                    ) : (
                                                        <Brain className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </div>
                                            {errors.title && (
                                                <p className="text-sm text-red-600 mt-1">{errors.title}</p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* 4. Editable Description Field */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Description</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <Textarea
                                                    value={data.description}
                                                    onChange={(e) => setData('description', e.target.value)}
                                                    placeholder="Enter video description"
                                                    rows={4}
                                                />
                                                <div className="flex justify-end">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={generateAIDescription}
                                                        disabled={generatingDescription}
                                                    >
                                                        {generatingDescription ? (
                                                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                                        ) : (
                                                            <Brain className="w-4 h-4 mr-2" />
                                                        )}
                                                        AI Generate
                                                    </Button>
                                                </div>
                                            </div>
                                            {errors.description && (
                                                <p className="text-sm text-red-600">{errors.description}</p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    {/* Tags Section */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Tag className="w-5 h-5" />
                                                Tags
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex flex-wrap gap-2">
                                                    {data.tags.map((tag, index) => (
                                                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                                                            {tag}
                                                            <button
                                                                type="button"
                                                                onClick={() => removeTag(tag)}
                                                                className="ml-1 text-xs hover:text-red-600"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </Badge>
                                                    ))}
                                                    {data.tags.length === 0 && (
                                                        <p className="text-sm text-gray-500">No tags added yet</p>
                                                    )}
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="Add a tag..."
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                const tag = e.currentTarget.value.trim();
                                                                if (tag) {
                                                                    addTag(tag);
                                                                    e.currentTarget.value = '';
                                                                }
                                                            }
                                                        }}
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={generateTags}
                                                        disabled={isGeneratingTags}
                                                    >
                                                        {isGeneratingTags ? (
                                                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                                        ) : (
                                                            <Sparkles className="w-4 h-4 mr-2" />
                                                        )}
                                                        AI Generate
                                                    </Button>
                                                </div>
                                                
                                                {data.tags.length > 0 && (
                                                    <p className="text-xs text-gray-500">
                                                        Tags help categorize your video and improve discoverability across platforms
                                                    </p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Submit Button */}
                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={processing}>
                                            {processing ? (
                                                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                                            ) : (
                                                <Save className="w-4 h-4 mr-2" />
                                            )}
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>

                                {/* 5. Video Details Section */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Video Details</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                                                <p className="text-lg">{video.formatted_duration}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Resolution</p>
                                                <p className={`text-lg ${videoQuality.color}`}>
                                                    {video.width && video.height ? `${video.width}x${video.height}` : 'Unknown'}
                                                </p>
                                                <p className={`text-sm ${videoQuality.color}`}>{videoQuality.label}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Upload Date</p>
                                            <p className="text-lg">{new Date(video.created_at).toLocaleString()}</p>
                                        </div>
                                    </CardContent>
                                </Card>


                            </div>
                        </div>

                        {/* 10. Thumbnail Optimization Section */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Image className="w-5 h-5" />
                                    Thumbnail Optimization
                                </CardTitle>
                                <CardDescription>
                                    Set your video thumbnail using AI optimization or custom upload
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => setShowThumbnailOptimizer(true)}
                                        className="bg-purple-600 hover:bg-purple-700"
                                    >
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        AI Optimize Thumbnail
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Upload Custom Thumbnail
                                    </Button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleThumbnailUpload}
                                        className="hidden"
                                    />
                                </div>
                                
                                {selectedThumbnail && (
                                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-sm text-green-700">
                                            ✓ Thumbnail has been set for this video
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>


                    </TabsContent>

                    {/* Performance Tab */}
                    <TabsContent value="performance" className="space-y-6">
                        <ErrorBoundary>
                            <AIPerformanceOptimizer videoId={video.id} />
                        </ErrorBoundary>
                    </TabsContent>
                </Tabs>

                {/* Delete Dialog */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Video</DialogTitle>
                            <DialogDescription>
                                This action cannot be undone. Choose what you want to delete:
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="delete-tikomat"
                                    name="delete-option"
                                    value="tikomat"
                                    checked={deleteOption === 'tikomat'}
                                    onChange={(e) => setDeleteOption(e.target.value as 'tikomat' | 'all')}
                                />
                                <Label htmlFor="delete-tikomat">Delete only from Tikomat (keep on social platforms)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="radio"
                                    id="delete-all"
                                    name="delete-option"
                                    value="all"
                                    checked={deleteOption === 'all'}
                                    onChange={(e) => setDeleteOption(e.target.value as 'tikomat' | 'all')}
                                />
                                <Label htmlFor="delete-all">Delete from everywhere (Tikomat + all social platforms)</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={confirmDelete}>
                                Delete Video
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Thumbnail Optimizer Popup */}
                <ThumbnailOptimizerPopup
                    isOpen={showThumbnailOptimizer}
                    onClose={() => setShowThumbnailOptimizer(false)}
                    videoId={video.id}
                    videoPath={video.video_path || video.file_path || ''}
                    title={data.title}
                    onThumbnailSet={() => {
                        setSelectedThumbnail('optimized');
                        setShowThumbnailOptimizer(false);
                    }}
                />
            </div>
        </AppLayout>
    );
} 