import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    Image, 
    Eye,
    MousePointer,
    Palette,
    Type,
    Sparkles,
    Download,
    TestTube,
    Target,
    RefreshCw,
    Play,
    TrendingUp,
    User,
    ZoomIn,
    Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ThumbnailAnalysis {
    video_path: string;
    extracted_frames: Frame[];
    thumbnail_suggestions: ThumbnailSuggestion[];
    design_analysis: DesignAnalysis;
    ctr_predictions: CTRPrediction[];
    platform_optimizations: PlatformOptimization[];
    text_overlay_suggestions: TextOverlay[];
    color_analysis: ColorAnalysis[];
    face_detection: FaceDetection;
    ab_test_variants: ABTestVariant[];
    improvement_recommendations: Recommendation[];
    overall_score: number;
}

interface Frame {
    id: string;
    timestamp: number;
    path: string;
    preview_url: string;
    quality_score: number;
    has_faces: boolean;
    face_count: number;
}

interface ThumbnailSuggestion {
    frame_id: string;
    timestamp: number;
    path: string;
    preview_url: string;
    predicted_ctr: number;
    confidence_score: number;
    reasons: string[];
    design_scores?: {
        contrast: number;
        face_visibility: number;
        text_readability: number;
        emotional_appeal: number;
        visual_hierarchy: number;
        brand_consistency: number;
        color_harmony: number;
        composition: number;
    };
}

interface AIThumbnailOptimizerProps {
    videoId?: number;
    videoPath?: string;
    title?: string;
    className?: string;
    onThumbnailSet?: () => void;
}

export default function AIThumbnailOptimizer({
    videoId,
    videoPath,
    title,
    className,
    onThumbnailSet
}: AIThumbnailOptimizerProps) {
    const [analysis, setAnalysis] = useState<ThumbnailAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [selectedFrame, setSelectedFrame] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('suggestions');
    const { toast } = useToast();

    const optimizeThumbnails = async () => {
        if (!videoId) {
            toast({
                title: "No Video ID",
                description: "Please provide a video ID to optimize thumbnails.",
                variant: "destructive",
            });
            return;
        }

        setIsAnalyzing(true);
        
        try {
            const response = await fetch('/ai/optimize-thumbnails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    video_id: videoId,
                    title: title || 'Amazing Video',
                    platforms: ['youtube', 'instagram', 'tiktok'],
                }),
            });

            const data = await response.json();

            if (data.success) {
                setAnalysis(data.data);
                toast({
                    title: "Thumbnail Optimization Complete! 🎨",
                    description: `AI has analyzed your video and extracted ${data.data.extracted_frames?.length || 0} thumbnail frames.`,
                });
            } else {
                throw new Error(data.message || 'Failed to optimize thumbnails');
            }
        } catch (error) {
            console.error('Thumbnail optimization error:', error);
            toast({
                title: "Optimization Failed",
                description: "Failed to optimize thumbnails. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const setVideoThumbnail = async (frameId: string, thumbnailPath: string) => {
        if (!videoId) {
            toast({
                title: "Error",
                description: "Video ID is required to set thumbnail.",
                variant: "destructive",
            });
            return;
        }

        try {
            const response = await fetch('/ai/set-video-thumbnail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    video_id: videoId,
                    frame_id: frameId,
                    thumbnail_path: thumbnailPath,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "Thumbnail Set Successfully! 🎯",
                    description: "This thumbnail has been set for all platforms.",
                });
                
                // Call the callback if provided
                if (onThumbnailSet) {
                    onThumbnailSet();
                }
            } else {
                throw new Error(data.message || 'Failed to set thumbnail');
            }
        } catch (error) {
            console.error('Set thumbnail error:', error);
            toast({
                title: "Setting Failed",
                description: "Failed to set thumbnail. Please try again.",
                variant: "destructive",
            });
        }
    };

    if (!analysis && !isAnalyzing) {
        return (
            <Card className={cn("border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50", className)}>
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full w-fit">
                        <Image className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        AI Thumbnail Optimizer
                    </CardTitle>
                    <p className="text-gray-600">
                        Generate eye-catching thumbnails with AI-powered optimization and CTR predictions
                    </p>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="p-3 bg-white rounded-lg border">
                            <Eye className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                            <p className="font-medium">CTR Prediction</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                                                            <User className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <p className="font-medium">Face Detection</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                            <Palette className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="font-medium">Color Analysis</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                            <Type className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                            <p className="font-medium">Text Optimization</p>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={optimizeThumbnails}
                        disabled={!videoId}
                        size="lg"
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Analyze Video & Extract Thumbnails
                    </Button>
                    
                    {!videoId && (
                        <p className="text-sm text-gray-500">
                            Video ID required for thumbnail analysis
                        </p>
                    )}
                </CardContent>
            </Card>
        );
    }

    if (isAnalyzing) {
        return (
            <Card className={cn("border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50", className)}>
                <CardContent className="p-8 text-center space-y-6">
                    <div className="mx-auto p-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full w-fit animate-pulse">
                        <Image className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Optimizing Thumbnails...</h3>
                        <p className="text-gray-600 mb-4">
                            AI is analyzing frames, detecting faces, and predicting CTR
                        </p>
                        <div className="w-full max-w-md mx-auto bg-gray-200 rounded-full h-2">
                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg">
                            <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                            <span>Extracting frames...</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                            <span>Analyzing faces...</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg">
                            <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
                            <span>Predicting CTR...</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50", className)}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg">
                            <Image className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                Thumbnail Optimization Results
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                                Score: {analysis.overall_score}/100 • {analysis.extracted_frames.length} frames analyzed
                            </p>
                        </div>
                    </div>
                    <Button 
                        onClick={optimizeThumbnails}
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
                        <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                        <TabsTrigger value="platforms">Platform Thumbnail Specifications</TabsTrigger>
                        <TabsTrigger value="testing">A/B Testing</TabsTrigger>
                    </TabsList>

                    <TabsContent value="suggestions" className="space-y-4">
                        <div className="grid gap-4">
                            {analysis.thumbnail_suggestions.slice(0, 3).map((suggestion, index) => (
                                <Card key={suggestion.frame_id} className={index === 0 ? "border-2 border-gold" : ""}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-4">
                                            <div className="relative">
                                                <img 
                                                    src={suggestion.preview_url} 
                                                    alt={`Thumbnail at ${suggestion.timestamp}s`}
                                                    className="w-32 h-18 object-cover rounded-lg border-2 border-gray-200"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                        target.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                                <div className="w-32 h-18 bg-gray-200 rounded-lg flex items-center justify-center hidden">
                                                    <Play className="w-6 h-6 text-gray-400" />
                                                </div>
                                                {index === 0 && (
                                                    <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black">
                                                        <Star className="w-3 h-3 mr-1" />
                                                        Best
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h4 className="font-medium">Frame at {suggestion.timestamp}s</h4>
                                                    <Badge variant="outline">
                                                        {suggestion.predicted_ctr}% CTR
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {suggestion.confidence_score}% confidence
                                                    </Badge>
                                                </div>
                                                <div className="space-y-3">
                                                    <div>
                                                        <h5 className="text-sm font-medium text-gray-700 mb-1">Why this frame:</h5>
                                                        <ul className="text-sm text-gray-600">
                                                            {suggestion.reasons.map((reason, i) => (
                                                                <li key={i} className="flex items-start gap-2">
                                                                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                                                                    {reason}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                    
                                                    {suggestion.design_scores && (
                                                        <div>
                                                            <h5 className="text-sm font-medium text-gray-700 mb-2">Design Feature Scores:</h5>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {Object.entries(suggestion.design_scores).map(([feature, score]) => (
                                                                    <div key={feature} className="flex items-center justify-between text-xs">
                                                                        <span className="text-gray-600 capitalize">
                                                                            {feature.replace('_', ' ')}:
                                                                        </span>
                                                                        <Badge 
                                                                            variant="outline" 
                                                                            className={cn(
                                                                                "text-xs px-1.5 py-0.5",
                                                                                score >= 80 ? "border-green-500 text-green-700 bg-green-50" :
                                                                                score >= 60 ? "border-yellow-500 text-yellow-700 bg-yellow-50" :
                                                                                "border-red-500 text-red-700 bg-red-50"
                                                                            )}
                                                                        >
                                                                            {score}
                                                                        </Badge>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <Button 
                                                    size="sm" 
                                                    onClick={() => setVideoThumbnail(suggestion.frame_id, suggestion.path)}
                                                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                                >
                                                    <Target className="w-4 h-4 mr-2" />
                                                    Set as Thumbnail
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>



                    <TabsContent value="platforms" className="space-y-4">
                        <div className="grid gap-4">
                            {Object.entries(analysis.platform_optimizations).map(([platform, optimization]) => (
                                <Card key={platform}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg capitalize flex items-center gap-2">
                                            <Target className="w-5 h-5" />
                                            {platform}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="font-medium mb-2">Specifications</h4>
                                                <div className="text-sm space-y-1">
                                                    <div>Dimensions: {optimization.specifications.width}×{optimization.specifications.height}</div>
                                                    <div>Aspect Ratio: {optimization.specifications.aspect_ratio}</div>
                                                    <div>Max Size: {optimization.specifications.max_file_size}KB</div>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-medium mb-2">Optimization Focus</h4>
                                                <div className="text-sm space-y-1">
                                                    {optimization.design_adjustments.map((adjustment, index) => (
                                                        <div key={index} className="flex items-start gap-2">
                                                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mt-2 flex-shrink-0"></span>
                                                            {adjustment}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <span className="text-sm text-gray-600">Expected Improvement:</span>
                                            <Badge className="bg-green-100 text-green-800">
                                                <TrendingUp className="w-3 h-3 mr-1" />
                                                {optimization.expected_improvement}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="testing" className="space-y-4">
                        <div className="grid gap-4">
                            {analysis.ab_test_variants.map((variant) => (
                                <Card key={variant.variant_id}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <TestTube className="w-5 h-5" />
                                                {variant.variant_id.replace('_', ' ').toUpperCase()}
                                            </CardTitle>
                                            <Badge variant="outline">
                                                {variant.confidence_level}% confidence
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h4 className="font-medium mb-2">Test Hypothesis</h4>
                                            <p className="text-sm text-gray-600">{variant.test_hypothesis}</p>
                                        </div>
                                        <div>
                                            <h4 className="font-medium mb-2">Planned Modifications</h4>
                                            <div className="space-y-1">
                                                {variant.modifications.map((mod, index) => (
                                                    <div key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                                                        {mod}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between pt-2 border-t">
                                            <span className="text-sm text-gray-600">Expected CTR Increase:</span>
                                            <Badge className="bg-blue-100 text-blue-800">
                                                +{variant.expected_outcome.expected_ctr_increase}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
} 