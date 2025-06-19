import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Video, 
    BarChart3, 
    FileText, 
    Image, 
    Hash,
    Clock,
    Eye,
    Heart,
    Share2,
    TrendingUp,
    Volume2,
    Settings,
    Brain,
    Zap,
    RefreshCw,
    CheckCircle,
    XCircle,
    AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface VideoAnalysis {
    basic_info: {
        duration: number;
        width: number;
        height: number;
        bitrate: number;
        format: string;
        has_audio: boolean;
        file_size: number;
    };
    transcript: {
        success: boolean;
        text: string;
        segments?: any[];
        language?: string;
        duration?: number;
        error?: string;
    };
    scenes: {
        scenes: any[];
        keyframes: Record<string, string>;
        total_scenes: number;
        error?: string;
    };
    mood_analysis: {
        dominant_mood: string;
        mood_scores: Record<string, number>;
        confidence: number;
    } | null;
    content_category: {
        primary_category: string;
        category_scores: Record<string, number>;
        confidence: number;
    } | null;
    quality_score: {
        overall_score: number;
        resolution_score: number;
        audio_score: number;
        bitrate_score: number;
        suggestions: string[];
    };
    suggested_thumbnails: {
        best_thumbnails: any[];
        all_suggestions: any[];
        total_analyzed: number;
        error?: string;
    };
    auto_chapters: any[];
    content_tags: string[];
    engagement_predictions: {
        engagement_score: number;
        predicted_views: {
            conservative: number;
            expected: number;
            optimistic: number;
        };
        predicted_likes: {
            conservative: number;
            expected: number;
            optimistic: number;
        };
        predicted_shares: {
            conservative: number;
            expected: number;
            optimistic: number;
        };
        virality_potential: string;
    };
    status?: string;
    errors?: string[];
}

interface AIVideoAnalyzerProps {
    videoPath?: string;
    onAnalysisComplete?: (analysis: VideoAnalysis) => void;
    className?: string;
}

export default function AIVideoAnalyzer({
    videoPath,
    onAnalysisComplete,
    className
}: AIVideoAnalyzerProps) {
    const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const { toast } = useToast();

    const analyzeVideo = async () => {
        if (!videoPath) {
            toast({
                title: "No Video Selected",
                description: "Please upload a video first before analyzing.",
                variant: "destructive",
            });
            return;
        }

        setIsAnalyzing(true);
        
        try {
            const response = await fetch('/ai/analyze-video', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    video_path: videoPath,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setAnalysis(data.data);
                onAnalysisComplete?.(data.data);
                toast({
                    title: "Analysis Complete! 🎬",
                    description: "AI has analyzed your video and extracted valuable insights.",
                });
            } else {
                throw new Error(data.message || 'Failed to analyze video');
            }
        } catch (error) {
            console.error('Video analysis error:', error);
            toast({
                title: "Analysis Failed",
                description: "Failed to analyze video. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const formatDuration = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatFileSize = (bytes: number): string => {
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(1)} MB`;
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100';
        if (score >= 60) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const getMoodEmoji = (mood: string) => {
        const moodEmojis = {
            positive: '😊',
            energetic: '⚡',
            calm: '😌',
            professional: '💼',
            casual: '😎',
            inspirational: '✨',
            neutral: '😐',
        };
        return moodEmojis[mood as keyof typeof moodEmojis] || '😐';
    };

    const getCategoryEmoji = (category: string) => {
        const categoryEmojis = {
            educational: '📚',
            entertainment: '🎭',
            gaming: '🎮',
            lifestyle: '🏠',
            fitness: '💪',
            food: '🍳',
            travel: '✈️',
            tech: '💻',
            music: '🎵',
            fashion: '👗',
            business: '💼',
            diy: '🔨',
            general: '📹',
        };
        return categoryEmojis[category as keyof typeof categoryEmojis] || '📹';
    };

    if (!analysis && !isAnalyzing) {
        return (
            <Card className={cn("border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50", className)}>
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full w-fit">
                        <Brain className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        AI Video Analyzer
                    </CardTitle>
                    <p className="text-gray-600">
                        Get comprehensive insights about your video content using advanced AI analysis
                    </p>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="p-3 bg-white rounded-lg border">
                            <Video className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                            <p className="font-medium">Video Quality</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                            <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <p className="font-medium">Transcription</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                            <Image className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="font-medium">Scene Analysis</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                            <TrendingUp className="w-6 h-6 text-pink-600 mx-auto mb-2" />
                            <p className="font-medium">Engagement Prediction</p>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={analyzeVideo}
                        disabled={!videoPath}
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                        <Brain className="w-5 h-5 mr-2" />
                        Start AI Analysis
                    </Button>
                    
                    {!videoPath && (
                        <p className="text-sm text-gray-500">
                            Upload a video first to enable AI analysis
                        </p>
                    )}
                </CardContent>
            </Card>
        );
    }

    if (isAnalyzing) {
        return (
            <Card className={cn("border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50", className)}>
                <CardContent className="p-8 text-center space-y-6">
                    <div className="mx-auto p-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full w-fit animate-pulse">
                        <Brain className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Your Video...</h3>
                        <p className="text-gray-600 mb-4">
                            Our AI is processing your video to extract valuable insights
                        </p>
                        <Progress value={75} className="w-full max-w-md mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg">
                            <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                            <span>Extracting audio...</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                            <span>Analyzing scenes...</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg">
                            <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
                            <span>Predicting engagement...</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50", className)}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                                AI Video Analysis Results
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                                Comprehensive insights powered by artificial intelligence
                            </p>
                        </div>
                    </div>
                    <Button 
                        onClick={analyzeVideo}
                        disabled={isAnalyzing}
                        size="sm"
                        variant="outline"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Re-analyze
                    </Button>
                </div>
            </CardHeader>

            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="quality">Quality</TabsTrigger>
                        <TabsTrigger value="content">Content</TabsTrigger>
                        <TabsTrigger value="engagement">Engagement</TabsTrigger>
                        <TabsTrigger value="thumbnails">Thumbnails</TabsTrigger>
                        <TabsTrigger value="chapters">Chapters</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Video Info */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Video className="w-5 h-5" />
                                        Video Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Duration:</span>
                                        <span className="font-medium">{formatDuration(analysis.basic_info.duration)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Resolution:</span>
                                        <span className="font-medium">{analysis.basic_info.width}×{analysis.basic_info.height}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">File Size:</span>
                                        <span className="font-medium">{formatFileSize(analysis.basic_info.file_size)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Audio:</span>
                                        <Badge variant={analysis.basic_info.has_audio ? "default" : "destructive"}>
                                            {analysis.basic_info.has_audio ? "Present" : "Missing"}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Brain className="w-5 h-5" />
                                        Content Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {analysis.content_category && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Category:</span>
                                            <Badge className="bg-blue-100 text-blue-800">
                                                {getCategoryEmoji(analysis.content_category.primary_category)} {analysis.content_category.primary_category}
                                            </Badge>
                                        </div>
                                    )}
                                    {analysis.mood_analysis && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">Mood:</span>
                                            <Badge className="bg-green-100 text-green-800">
                                                {getMoodEmoji(analysis.mood_analysis.dominant_mood)} {analysis.mood_analysis.dominant_mood}
                                            </Badge>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Transcript:</span>
                                        <Badge variant={analysis.transcript.success ? "default" : "destructive"}>
                                            {analysis.transcript.success ? (
                                                <>
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Available
                                                </>
                                            ) : (
                                                <>
                                                    <XCircle className="w-3 h-3 mr-1" />
                                                    Failed
                                                </>
                                            )}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Content Tags:</span>
                                        <span className="font-medium">{analysis.content_tags.length} tags</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Overall Scores */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <BarChart3 className="w-5 h-5" />
                                    Overall Scores
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="text-center">
                                        <div className={cn("text-3xl font-bold p-4 rounded-lg mb-2", getScoreColor(analysis.quality_score.overall_score))}>
                                            {analysis.quality_score.overall_score}/100
                                        </div>
                                        <p className="text-sm text-gray-600">Video Quality</p>
                                    </div>
                                    <div className="text-center">
                                        <div className={cn("text-3xl font-bold p-4 rounded-lg mb-2", getScoreColor(analysis.engagement_predictions.engagement_score))}>
                                            {analysis.engagement_predictions.engagement_score}/100
                                        </div>
                                        <p className="text-sm text-gray-600">Engagement Score</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold p-4 bg-purple-100 text-purple-800 rounded-lg mb-2">
                                            {analysis.engagement_predictions.virality_potential}
                                        </div>
                                        <p className="text-sm text-gray-600">Virality Potential</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="quality" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="w-5 h-5" />
                                    Quality Assessment
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span>Resolution Quality</span>
                                            <span className="font-medium">{analysis.quality_score.resolution_score}/100</span>
                                        </div>
                                        <Progress value={analysis.quality_score.resolution_score} className="mb-2" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span>Audio Quality</span>
                                            <span className="font-medium">{analysis.quality_score.audio_score}/100</span>
                                        </div>
                                        <Progress value={analysis.quality_score.audio_score} className="mb-2" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span>Bitrate Quality</span>
                                            <span className="font-medium">{analysis.quality_score.bitrate_score}/100</span>
                                        </div>
                                        <Progress value={analysis.quality_score.bitrate_score} className="mb-2" />
                                    </div>
                                </div>
                                
                                <div className="mt-6">
                                    <h4 className="font-medium mb-3 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4" />
                                        Improvement Suggestions
                                    </h4>
                                    <div className="space-y-2">
                                        {analysis.quality_score.suggestions.map((suggestion, index) => (
                                            <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                                                <span className="text-sm text-blue-800">{suggestion}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="content" className="space-y-4">
                        <div className="grid gap-6">
                            {analysis.transcript.success && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="w-5 h-5" />
                                            Transcript
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                                            <p className="text-sm text-gray-700">{analysis.transcript.text}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Hash className="w-5 h-5" />
                                        Content Tags
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {analysis.content_tags.map((tag, index) => (
                                            <Badge key={index} variant="outline">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="engagement" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5" />
                                    Engagement Predictions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-blue-800">
                                            {analysis.engagement_predictions.predicted_views.expected.toLocaleString()}
                                        </div>
                                        <p className="text-sm text-blue-600">Expected Views</p>
                                    </div>
                                    <div className="text-center p-4 bg-pink-50 rounded-lg">
                                        <Heart className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-pink-800">
                                            {analysis.engagement_predictions.predicted_likes.expected.toLocaleString()}
                                        </div>
                                        <p className="text-sm text-pink-600">Expected Likes</p>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <Share2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-green-800">
                                            {analysis.engagement_predictions.predicted_shares.expected.toLocaleString()}
                                        </div>
                                        <p className="text-sm text-green-600">Expected Shares</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="font-medium">Prediction Ranges</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Views</span>
                                                <span>{analysis.engagement_predictions.predicted_views.conservative.toLocaleString()} - {analysis.engagement_predictions.predicted_views.optimistic.toLocaleString()}</span>
                                            </div>
                                            <Progress value={60} className="h-2" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Likes</span>
                                                <span>{analysis.engagement_predictions.predicted_likes.conservative.toLocaleString()} - {analysis.engagement_predictions.predicted_likes.optimistic.toLocaleString()}</span>
                                            </div>
                                            <Progress value={60} className="h-2" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="thumbnails" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Image className="w-5 h-5" />
                                    Thumbnail Suggestions
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {analysis.suggested_thumbnails.error ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>Thumbnail analysis not available</p>
                                        <p className="text-sm">{analysis.suggested_thumbnails.error}</p>
                                    </div>
                                ) : (
                                    <div className="grid md:grid-cols-3 gap-4">
                                        {analysis.suggested_thumbnails.best_thumbnails.map((thumb, index) => (
                                            <div key={index} className="p-4 border rounded-lg">
                                                <div className="aspect-video bg-gray-100 rounded mb-3 flex items-center justify-center">
                                                    <Image className="w-8 h-8 text-gray-400" />
                                                </div>
                                                <div className="text-center">
                                                    <Badge className="mb-2">
                                                        Score: {Math.round(thumb.recommendation_score)}
                                                    </Badge>
                                                    <p className="text-xs text-gray-600">
                                                        At {formatDuration(thumb.timestamp)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="chapters" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Auto-Generated Chapters
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {analysis.auto_chapters.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No chapters detected</p>
                                        <p className="text-sm">Video may be too short or lack clear segment divisions</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {analysis.auto_chapters.map((chapter, index) => (
                                            <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                <Badge variant="outline" className="mt-1">
                                                    {formatDuration(chapter.start_time)}
                                                </Badge>
                                                <div>
                                                    <h4 className="font-medium">{chapter.title}</h4>
                                                    <p className="text-sm text-gray-600">{chapter.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {analysis.status === 'partial_analysis' && analysis.errors && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                            <h4 className="font-medium text-yellow-800">Partial Analysis</h4>
                        </div>
                        <div className="space-y-1">
                            {analysis.errors.map((error, index) => (
                                <p key={index} className="text-sm text-yellow-700">{error}</p>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}