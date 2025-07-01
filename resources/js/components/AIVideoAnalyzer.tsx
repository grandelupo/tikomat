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
    videoId?: number;
    videoPath?: string;
    onAnalysisComplete?: (analysis: VideoAnalysis) => void;
    className?: string;
}

export default function AIVideoAnalyzer({
    videoId,
    videoPath,
    onAnalysisComplete,
    className
}: AIVideoAnalyzerProps) {
    const [analysis, setAnalysis] = useState<VideoAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const { toast } = useToast();

    const analyzeVideo = async () => {
        if (!videoId) {
            toast({
                title: "No Video Selected",
                description: "Please select a video first before analyzing.",
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
                    video_id: videoId,
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
                // Check if it's a 404 error (video file not found)
                if (response.status === 404) {
                    toast({
                        title: "Video File Not Found",
                        description: "The video file associated with this record could not be found. Please re-upload the video.",
                        variant: "destructive",
                    });
                } else {
                    toast({
                        title: "Analysis Failed",
                        description: data.message || "Failed to analyze video. Please try again.",
                        variant: "destructive",
                    });
                }
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

    const hasQualityIssues = () => {
        if (!analysis?.quality_score) return false;
        
        const resolutionScore = analysis.quality_score.resolution_score || 0;
        const audioScore = analysis.quality_score.audio_score || 0;
        const bitrateScore = analysis.quality_score.bitrate_score || 0;
        
        // Consider it a quality issue if any score is below 70
        return resolutionScore < 70 || audioScore < 70 || bitrateScore < 70;
    };

    const getQualityIssues = () => {
        if (!analysis?.quality_score) return [];
        
        const issues = [];
        const resolutionScore = analysis.quality_score.resolution_score || 0;
        const audioScore = analysis.quality_score.audio_score || 0;
        const bitrateScore = analysis.quality_score.bitrate_score || 0;
        
        if (resolutionScore < 70) {
            issues.push({
                type: 'Resolution',
                score: resolutionScore,
                severity: resolutionScore < 40 ? 'high' : 'medium'
            });
        }
        
        if (audioScore < 70) {
            issues.push({
                type: 'Audio Quality',
                score: audioScore,
                severity: audioScore < 40 ? 'high' : 'medium'
            });
        }
        
        if (bitrateScore < 70) {
            issues.push({
                type: 'Bitrate',
                score: bitrateScore,
                severity: bitrateScore < 40 ? 'high' : 'medium'
            });
        }
        
        return issues;
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
                    <p className="text-muted-foreground">
                        Get comprehensive insights about your video content using advanced AI analysis
                    </p>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="p-3 bg-background rounded-lg border">
                            <Video className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                            <p className="font-medium text-foreground">Video Quality</p>
                        </div>
                        <div className="p-3 bg-background rounded-lg border">
                            <FileText className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <p className="font-medium text-foreground">Transcription</p>
                        </div>
                        <div className="p-3 bg-background rounded-lg border">
                            <Image className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="font-medium text-foreground">Scene Analysis</p>
                        </div>
                        <div className="p-3 bg-background rounded-lg border">
                            <TrendingUp className="w-6 h-6 text-pink-600 mx-auto mb-2" />
                            <p className="font-medium text-foreground">Engagement Prediction</p>
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
                        <p className="text-sm text-muted-foreground">
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
                        <h3 className="text-xl font-bold text-foreground mb-2">Analyzing Your Video...</h3>
                        <p className="text-muted-foreground mb-4">
                            Our AI is processing your video to extract valuable insights
                        </p>
                        <Progress value={75} className="w-full max-w-md mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center justify-center gap-2 p-3 bg-background rounded-lg">
                            <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                            <span className="text-foreground">Extracting audio...</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 p-3 bg-background rounded-lg">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                            <span className="text-foreground">Analyzing scenes...</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 p-3 bg-background rounded-lg">
                            <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
                            <span className="text-foreground">Predicting engagement...</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Add safety check for analysis object
    if (!analysis || !analysis.basic_info) {
        return (
            <Card className={cn("border-2 border-red-200 bg-red-50", className)}>
                <CardContent className="p-8 text-center">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Analysis Error</h3>
                    <p className="text-red-600 mb-4">
                        The video analysis data is incomplete or corrupted.
                    </p>
                    <Button onClick={analyzeVideo} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
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
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="engagement">Engagement</TabsTrigger>
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
                                        <span className="font-medium">{formatDuration(analysis.basic_info?.duration || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Resolution:</span>
                                        <span className="font-medium">{analysis.basic_info?.width || 0}×{analysis.basic_info?.height || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">File Size:</span>
                                        <span className="font-medium">{formatFileSize(analysis.basic_info?.file_size || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Audio:</span>
                                        <Badge variant={analysis.basic_info?.has_audio ? "default" : "destructive"}>
                                            {analysis.basic_info?.has_audio ? "Present" : "Missing"}
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
                                        <Badge variant={analysis.transcript?.success ? "default" : "destructive"}>
                                            {analysis.transcript?.success ? (
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
                                        <span className="font-medium">{analysis.content_tags?.length || 0} tags</span>
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
                                        <div className={cn("text-3xl font-bold p-4 rounded-lg mb-2", getScoreColor(analysis.quality_score?.overall_score || 0))}>
                                            {analysis.quality_score?.overall_score || 0}/100
                                        </div>
                                        <p className="text-sm text-gray-600">Video Quality</p>
                                    </div>
                                    <div className="text-center">
                                        <div className={cn("text-3xl font-bold p-4 rounded-lg mb-2", getScoreColor(analysis.engagement_predictions?.engagement_score || 0))}>
                                            {analysis.engagement_predictions?.engagement_score || 0}/100
                                        </div>
                                        <p className="text-sm text-gray-600">Engagement Score</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold p-4 bg-purple-100 text-purple-800 rounded-lg mb-2">
                                            {analysis.engagement_predictions?.virality_potential || 'Unknown'}
                                        </div>
                                        <p className="text-sm text-gray-600">Virality Potential</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
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
                                            {(analysis.engagement_predictions?.predicted_views?.expected || 0).toLocaleString()}
                                        </div>
                                        <p className="text-sm text-blue-600">Expected Views</p>
                                    </div>
                                    <div className="text-center p-4 bg-pink-50 rounded-lg">
                                        <Heart className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-pink-800">
                                            {(analysis.engagement_predictions?.predicted_likes?.expected || 0).toLocaleString()}
                                        </div>
                                        <p className="text-sm text-pink-600">Expected Likes</p>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <Share2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-green-800">
                                            {(analysis.engagement_predictions?.predicted_shares?.expected || 0).toLocaleString()}
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
                                                <span>{(analysis.engagement_predictions?.predicted_views?.conservative || 0).toLocaleString()} - {(analysis.engagement_predictions?.predicted_views?.optimistic || 0).toLocaleString()}</span>
                                            </div>
                                            <Progress value={60} className="h-2" />
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span>Likes</span>
                                                <span>{(analysis.engagement_predictions?.predicted_likes?.conservative || 0).toLocaleString()} - {(analysis.engagement_predictions?.predicted_likes?.optimistic || 0).toLocaleString()}</span>
                                            </div>
                                            <Progress value={60} className="h-2" />
                                        </div>
                                    </div>
                                </div>
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
                                {(analysis.auto_chapters?.length || 0) === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No chapters detected</p>
                                        <p className="text-sm">Video may be too short or lack clear segment divisions</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {(analysis.auto_chapters || []).map((chapter, index) => (
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

                {/* Quality Issues Section - Show at bottom if there are quality issues */}
                {hasQualityIssues() && (
                    <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <AlertCircle className="w-5 h-5 text-orange-600" />
                            <h4 className="font-medium text-orange-800">Video Quality Suggestions</h4>
                        </div>
                        <div className="space-y-3">
                            {getQualityIssues().map((issue, index) => (
                                <div key={index} className={cn(
                                    "flex items-center justify-between p-3 rounded-lg",
                                    issue.severity === 'high' ? 'bg-red-100 border border-red-200' : 'bg-yellow-100 border border-yellow-200'
                                )}>
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "w-2 h-2 rounded-full",
                                            issue.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                                        )}></span>
                                        <span className={cn(
                                            "font-medium",
                                            issue.severity === 'high' ? 'text-red-800' : 'text-yellow-800'
                                        )}>
                                            {issue.type} needs improvement
                                        </span>
                                    </div>
                                    <Badge variant="outline" className={cn(
                                        issue.severity === 'high' ? 'border-red-300 text-red-700' : 'border-yellow-300 text-yellow-700'
                                    )}>
                                        Score: {issue.score}/100
                                    </Badge>
                                </div>
                            ))}
                            
                            {/* Show quality suggestions */}
                            {(analysis.quality_score?.suggestions || []).length > 0 && (
                                <div className="mt-4 pt-3 border-t border-orange-200">
                                    <h5 className="font-medium text-orange-800 mb-2">Recommendations:</h5>
                                    <div className="space-y-2">
                                        {(analysis.quality_score?.suggestions || []).map((suggestion, index) => (
                                            <div key={index} className="flex items-start gap-2 text-sm text-orange-700">
                                                <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0"></span>
                                                <span>{suggestion}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {analysis.status === 'partial_analysis' && analysis.errors?.length && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                            <h4 className="font-medium text-yellow-800">Partial Analysis</h4>
                        </div>
                        <div className="space-y-1">
                            {(analysis.errors || []).map((error, index) => (
                                <p key={index} className="text-sm text-yellow-700">{error}</p>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}