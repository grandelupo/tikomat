import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    Target,
    Clock,
    Eye,
    Heart,
    Share2,
    MessageCircle,
    Trophy,
    AlertTriangle,
    Lightbulb,
    Zap,
    RefreshCw,
    ArrowUp,
    ArrowDown,
    Activity,
    TestTube,
    Calendar,
    Users,
    Globe,
    Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PerformanceAnalysis {
    video_id: number;
    overall_performance: {
        total_views: number;
        total_engagement: number;
        engagement_rate: number;
        platform_count: number;
        average_views_per_platform: number;
        performance_tier: string;
        days_since_upload: number;
    };
    platform_breakdown: {
        [platform: string]: {
            views: number;
            engagement: number;
            engagement_rate: number;
            performance_score: number;
            ranking: number;
            strengths: string[];
            weaknesses: string[];
            recommendations: string[];
        };
    };
    optimization_opportunities: {
        [platform: string]: Array<{
            type: string;
            priority: string;
            title: string;
            description: string;
            potential_impact: string;
            actions: string[];
        }>;
    };
    comparative_analysis: {
        views_vs_industry: {
            your_views: number;
            industry_average: number;
            performance: string;
            difference_percentage: number;
        };
        engagement_vs_industry: {
            your_engagement_rate: number;
            industry_average: number;
            performance: string;
            difference_percentage: number;
        };
        growth_potential: {
            views_growth_potential: number;
            engagement_growth_potential: number;
        };
    };
    trend_analysis: {
        trend_direction: string;
        daily_average_views: number;
        peak_performance_day: number;
        projected_30_day_views: number;
        momentum_score: number;
        lifecycle_stage: string;
    };
    ab_test_suggestions: Array<{
        test_type: string;
        priority: string;
        title: string;
        description: string;
        test_variations: string[];
        success_metrics: string[];
        duration: string;
    }>;
    posting_time_optimization: {
        [platform: string]: {
            current_posting_time: string | null;
            current_day_type: string;
            optimal_times: string[];
            best_time: string;
            improvement_potential: string;
        };
    };
    content_recommendations: {
        content_type_suggestions: string[];
        topic_suggestions: string[];
        format_recommendations: string[];
        optimization_tips: string[];
    };
    performance_score: number;
    improvement_potential: number;
}

interface AIPerformanceOptimizerProps {
    videoId?: number;
    className?: string;
}

export default function AIPerformanceOptimizer({
    videoId,
    className
}: AIPerformanceOptimizerProps) {
    const [analysis, setAnalysis] = useState<PerformanceAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    const [showABTestDialog, setShowABTestDialog] = useState(false);
    const [selectedTest, setSelectedTest] = useState<any>(null);
    const { toast } = useToast();

    const analyzePerformance = async () => {
        if (!videoId) {
            toast({
                title: "No Video Selected",
                description: "Please select a video to analyze performance.",
                variant: "destructive",
            });
            return;
        }

        setIsAnalyzing(true);

        try {
            const response = await fetch('/ai/analyze-video-performance', {
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
                toast({
                    title: "Performance Analysis Complete! 📊",
                    description: "AI has analyzed your video performance across all platforms.",
                });
            } else {
                throw new Error(data.message || 'Failed to analyze performance');
            }
        } catch (error) {
            console.error('Performance analysis error:', error);
            toast({
                title: "Analysis Failed",
                description: "Failed to analyze video performance. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const createABTest = async (testConfig: any) => {
        try {
            const response = await fetch('/ai/create-ab-test', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    video_id: videoId,
                    ...testConfig,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast({
                    title: "A/B Test Created! 🧪",
                    description: "Your A/B test has been set up and will start collecting data.",
                });
                setShowABTestDialog(false);
            } else {
                throw new Error(data.message || 'Failed to create A/B test');
            }
        } catch (error) {
            console.error('A/B test creation error:', error);
            toast({
                title: "A/B Test Failed",
                description: "Failed to create A/B test. Please try again.",
                variant: "destructive",
            });
        }
    };

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const getPerformanceTierColor = (tier: string) => {
        switch (tier) {
            case 'excellent': return 'text-green-600 bg-green-100';
            case 'good': return 'text-blue-600 bg-blue-100';
            case 'average': return 'text-yellow-600 bg-yellow-100';
            case 'needs_improvement': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getTrendIcon = (direction: string) => {
        switch (direction) {
            case 'increasing': return <TrendingUp className="w-4 h-4 text-green-600" />;
            case 'decreasing': return <TrendingDown className="w-4 h-4 text-red-600" />;
            default: return <Activity className="w-4 h-4 text-blue-600" />;
        }
    };

    const getPlatformIcon = (platform: string) => {
        const icons = {
            youtube: '📺',
            instagram: '📷',
            tiktok: '🎵',
            x: '𝕏',
            facebook: '👥',
        };
        return icons[platform as keyof typeof icons] || '📱';
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'text-red-600 bg-red-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'low': return 'text-green-600 bg-green-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    if (!analysis && !isAnalyzing) {
        return (
            <Card className={cn("border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50", className)}>
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto p-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-fit">
                        <BarChart3 className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        AI Performance Optimizer
                    </CardTitle>
                    <p className="text-gray-600">
                        Analyze your video performance and get AI-powered optimization recommendations
                    </p>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="p-3 bg-white rounded-lg border">
                            <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <p className="font-medium">Performance Analysis</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                            <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="font-medium">Optimization Tips</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                            <TestTube className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                            <p className="font-medium">A/B Testing</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                            <Calendar className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                            <p className="font-medium">Timing Optimization</p>
                        </div>
                    </div>

                    <Button
                        onClick={analyzePerformance}
                        disabled={!videoId}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        <BarChart3 className="w-5 h-5 mr-2" />
                        Start Performance Analysis
                    </Button>

                    {!videoId && (
                        <p className="text-sm text-gray-500">
                            Select a video first to enable performance analysis
                        </p>
                    )}
                </CardContent>
            </Card>
        );
    }

    if (isAnalyzing) {
        return (
            <Card className={cn("border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50", className)}>
                <CardContent className="p-8 text-center space-y-6">
                    <div className="mx-auto p-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full w-fit animate-pulse">
                        <BarChart3 className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Performance...</h3>
                        <p className="text-gray-600 mb-4">
                            AI is analyzing your video performance across all platforms
                        </p>
                        <Progress value={85} className="w-full max-w-md mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                            <span>Analyzing metrics...</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg">
                            <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                            <span>Finding opportunities...</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg">
                            <RefreshCw className="w-4 h-4 animate-spin text-green-600" />
                            <span>Generating recommendations...</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Safety checks for analysis data
    if (!analysis || !analysis.overall_performance || !analysis.comparative_analysis ||
        !analysis.platform_breakdown || !analysis.trend_analysis) {
        return (
            <Card className={cn("border-2 border-red-200 bg-gradient-to-br from-red-50 to-orange-50", className)}>
                <CardContent className="p-8 text-center space-y-4">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
                    <div>
                        <h3 className="text-lg font-semibold text-red-700 mb-2">Analysis Data Incomplete</h3>
                        <p className="text-red-600 mb-4">
                            The performance analysis data is incomplete or missing.
                        </p>
                        <Button onClick={analyzePerformance} variant="outline" className="border-red-300 text-red-700">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50", className)}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                            <BarChart3 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Performance Analysis Results
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                                AI-powered performance insights and optimization recommendations
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={analyzePerformance}
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
                        <TabsTrigger value="platforms">Platforms</TabsTrigger>
                        <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                        <TabsTrigger value="trends">Trends</TabsTrigger>
                        <TabsTrigger value="timing">Timing</TabsTrigger>
                        <TabsTrigger value="testing">A/B Testing</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Performance Overview */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Eye className="w-5 h-5" />
                                        Total Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-blue-600">
                                            {analysis.performance_score}/100
                                        </div>
                                        <p className="text-sm text-gray-600">Performance Score</p>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Views:</span>
                                        <span className="font-medium">{formatNumber(analysis.overall_performance?.total_views || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Engagement Rate:</span>
                                        <span className="font-medium">{analysis.overall_performance?.engagement_rate || 0}%</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Performance Tier:</span>
                                        <Badge className={getPerformanceTierColor(analysis.overall_performance?.performance_tier || 'unknown')}>
                                            {(analysis.overall_performance?.performance_tier || 'unknown').replace('_', ' ')}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" />
                                        Industry Comparison
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Views vs Industry:</span>
                                            <div className="flex items-center gap-1">
                                                {(analysis.comparative_analysis?.views_vs_industry?.performance || 'below_average') === 'above_average' ? (
                                                    <ArrowUp className="w-3 h-3 text-green-600" />
                                                ) : (
                                                    <ArrowDown className="w-3 h-3 text-red-600" />
                                                )}
                                                <span className={cn(
 "text-sm font-medium",
                                                    (analysis.comparative_analysis?.views_vs_industry?.performance || 'below_average') === 'above_average' ?
 "text-green-600" : "text-red-600"
                                                )}>
                                                    {Math.abs(analysis.comparative_analysis?.views_vs_industry?.difference_percentage || 0)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Engagement vs Industry:</span>
                                            <div className="flex items-center gap-1">
                                                {(analysis.comparative_analysis?.engagement_vs_industry?.performance || 'below_average') === 'above_average' ? (
                                                    <ArrowUp className="w-3 h-3 text-green-600" />
                                                ) : (
                                                    <ArrowDown className="w-3 h-3 text-red-600" />
                                                )}
                                                <span className={cn(
 "text-sm font-medium",
                                                    (analysis.comparative_analysis?.engagement_vs_industry?.performance || 'below_average') === 'above_average' ?
 "text-green-600" : "text-red-600"
                                                )}>
                                                    {Math.abs(analysis.comparative_analysis?.engagement_vs_industry?.difference_percentage || 0)}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-2 border-t">
                                        <div className="text-sm text-gray-600">Growth Potential:</div>
                                        <div className="text-lg font-medium text-purple-600">
                                            {formatNumber(analysis.comparative_analysis?.growth_potential?.views_growth_potential || 0)} more views
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Target className="w-5 h-5" />
                                        Improvement Potential
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-orange-600">
                                            {analysis.improvement_potential}%
                                        </div>
                                        <p className="text-sm text-gray-600">Improvement Potential</p>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Platforms:</span>
                                        <span className="font-medium">{analysis.overall_performance?.platform_count || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Days Since Upload:</span>
                                        <span className="font-medium">{analysis.overall_performance?.days_since_upload || 0}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Lifecycle Stage:</span>
                                        <Badge variant="outline">
                                            {analysis.trend_analysis?.lifecycle_stage || 'unknown'}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Quick Stats */}
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Activity className="w-5 h-5" />
                                    Platform Performance Overview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {Object.entries(analysis.platform_breakdown || {}).map(([platform, data]) => (
                                        <div key={platform} className="text-center p-4 bg-muted rounded-lg">
                                            <div className="text-2xl mb-2">{getPlatformIcon(platform)}</div>
                                            <div className="font-medium capitalize mb-1">{platform}</div>
                                            <div className="text-sm text-muted-foreground">#{data?.ranking || 0}</div>
                                            <div className="text-lg font-bold text-blue-400">{data?.performance_score || 0}/100</div>
                                            <div className="text-xs text-muted-foreground">{formatNumber(data?.views || 0)} views</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="platforms" className="space-y-4">
                        <div className="grid gap-4">
                            {Object.entries(analysis.platform_breakdown || {}).map(([platform, data]) => (
                                <Card key={platform}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg flex items-center gap-2">
                                                <span className="text-xl">{getPlatformIcon(platform)}</span>
                                                <span className="capitalize">{platform}</span>
                                                <Badge className="ml-2">#{data?.ranking || 0}</Badge>
                                            </CardTitle>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold text-blue-600">{data?.performance_score || 0}/100</div>
                                                <div className="text-sm text-gray-600">Performance Score</div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid md:grid-cols-3 gap-4">
                                            <div className="text-center p-3 bg-blue-950/20 rounded-lg">
                                                <Eye className="w-6 h-6 text-blue-400 mx-auto mb-1" />
                                                <div className="text-lg font-bold">{formatNumber(data?.views || 0)}</div>
                                                <div className="text-xs text-muted-foreground">Views</div>
                                            </div>
                                            <div className="text-center p-3 bg-green-950/20 rounded-lg">
                                                <Heart className="w-6 h-6 text-green-400 mx-auto mb-1" />
                                                <div className="text-lg font-bold">{formatNumber(data?.engagement || 0)}</div>
                                                <div className="text-xs text-muted-foreground">Total Engagement</div>
                                            </div>
                                            <div className="text-center p-3 bg-purple-950/20 rounded-lg">
                                                <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-1" />
                                                <div className="text-lg font-bold">{data?.engagement_rate || 0}%</div>
                                                <div className="text-xs text-muted-foreground">Engagement Rate</div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            {(data?.strengths || []).length > 0 && (
                                                <div>
                                                    <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                                                        <Trophy className="w-4 h-4" />
                                                        Strengths
                                                    </h4>
                                                    <ul className="space-y-1">
                                                        {(data?.strengths || []).map((strength, index) => (
                                                            <li key={index} className="text-sm text-green-600 flex items-start gap-2">
                                                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                                                                {strength}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {(data?.weaknesses || []).length > 0 && (
                                                <div>
                                                    <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        Areas for Improvement
                                                    </h4>
                                                    <ul className="space-y-1">
                                                        {(data?.weaknesses || []).map((weakness, index) => (
                                                            <li key={index} className="text-sm text-red-600 flex items-start gap-2">
                                                                <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                                                                {weakness}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>

                                        {(data?.recommendations || []).length > 0 && (
                                            <div>
                                                <h4 className="font-medium text-blue-700 mb-2 flex items-center gap-2">
                                                    <Lightbulb className="w-4 h-4" />
                                                    Recommendations
                                                </h4>
                                                <div className="space-y-2">
                                                    {(data?.recommendations || []).map((recommendation, index) => (
                                                        <div key={index} className="p-3 bg-blue-50 rounded-lg">
                                                            <span className="text-sm text-blue-800">{recommendation}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="opportunities" className="space-y-4">
                        <div className="grid gap-4">
                            {Object.entries(analysis.optimization_opportunities || {}).map(([platform, opportunities]) => (
                                <Card key={platform}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <span className="text-xl">{getPlatformIcon(platform)}</span>
                                            <span className="capitalize">{platform} Opportunities</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {(opportunities || []).map((opportunity, index) => (
                                            <div key={index} className="p-4 border rounded-lg">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div>
                                                        <h4 className="font-medium flex items-center gap-2">
                                                            <Target className="w-4 h-4" />
                                                            {opportunity?.title || 'Untitled'}
                                                        </h4>
                                                        <p className="text-sm text-gray-600 mt-1">{opportunity?.description || 'No description available'}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Badge className={getPriorityColor(opportunity?.priority || 'low')}>
                                                            {opportunity?.priority || 'low'}
                                                        </Badge>
                                                        <Badge variant="outline">
                                                            {opportunity?.potential_impact || 'unknown'} impact
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-sm mb-2">Action Steps:</h5>
                                                    <div className="space-y-1">
                                                        {(opportunity?.actions || []).map((action, actionIndex) => (
                                                            <div key={actionIndex} className="flex items-start gap-2 text-sm">
                                                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                                                                {action}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="trends" className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Activity className="w-5 h-5" />
                                        Trend Analysis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-600">Trend Direction:</span>
                                        <div className="flex items-center gap-2">
                                            {getTrendIcon(analysis.trend_analysis?.trend_direction || 'stable')}
                                            <span className="font-medium capitalize">{analysis.trend_analysis?.trend_direction || 'stable'}</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Daily Avg Views:</span>
                                        <span className="font-medium">{formatNumber(analysis.trend_analysis?.daily_average_views || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Momentum Score:</span>
                                        <span className="font-medium">{analysis.trend_analysis?.momentum_score || 0}/100</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Lifecycle Stage:</span>
                                        <Badge variant="outline">{analysis.trend_analysis?.lifecycle_stage || 'unknown'}</Badge>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" />
                                        Performance Projections
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {formatNumber(analysis.trend_analysis?.projected_30_day_views || 0)}
                                        </div>
                                        <div className="text-sm text-blue-600">Projected 30-Day Views</div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Peak Performance Day:</span>
                                        <span className="font-medium">Day {analysis.trend_analysis?.peak_performance_day || 0}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="timing" className="space-y-4">
                        <div className="grid gap-4">
                            {Object.entries(analysis.posting_time_optimization || {}).map(([platform, timing]) => (
                                <Card key={platform}>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <span className="text-xl">{getPlatformIcon(platform)}</span>
                                            <span className="capitalize">{platform} Timing Optimization</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="font-medium mb-2">Current Status</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Posted at:</span>
                                                        <span className="font-medium">{timing?.current_posting_time || 'Unknown'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Day type:</span>
                                                        <span className="font-medium">{timing?.current_day_type || 'unknown'}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Improvement potential:</span>
                                                        <Badge className={getPriorityColor(timing?.improvement_potential || 'low')}>
                                                            {timing?.improvement_potential || 'low'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <h4 className="font-medium mb-2">Optimal Times</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Best time:</span>
                                                        <span className="font-medium text-green-600">{timing?.best_time || 'unknown'}</span>
                                                    </div>
                                                    <div className="text-sm text-gray-600">All optimal times:</div>
                                                    <div className="flex flex-wrap gap-1">
                                                        {(timing?.optimal_times || []).map((time, index) => (
                                                            <Badge key={index} variant="outline" className="text-xs">
                                                                {time}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="testing" className="space-y-4">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <TestTube className="w-5 h-5" />
                                    A/B Testing Suggestions
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4">
                                    {(analysis.ab_test_suggestions || []).map((suggestion, index) => (
                                        <div key={index} className="p-4 border rounded-lg">
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <h4 className="font-medium flex items-center gap-2">
                                                        <TestTube className="w-4 h-4" />
                                                        {suggestion?.title || 'Untitled Test'}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1">{suggestion?.description || 'No description available'}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Badge className={getPriorityColor(suggestion?.priority || 'low')}>
                                                        {suggestion?.priority || 'low'}
                                                    </Badge>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedTest(suggestion);
                                                            setShowABTestDialog(true);
                                                        }}
                                                    >
                                                        Start Test
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="grid md:grid-cols-2 gap-4">
                                                <div>
                                                    <h5 className="font-medium text-sm mb-2">Test Variations:</h5>
                                                    <div className="space-y-1">
                                                        {(suggestion?.test_variations || []).map((variation, vIndex) => (
                                                            <div key={vIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></span>
                                                                {variation}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h5 className="font-medium text-sm mb-2">Success Metrics:</h5>
                                                    <div className="space-y-1">
                                                        {(suggestion?.success_metrics || []).map((metric, mIndex) => (
                                                            <Badge key={mIndex} variant="outline" className="text-xs mr-1">
                                                                {metric.replace('_', ' ')}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-2">
                                                        Duration: {suggestion?.duration || 'Unknown'}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* A/B Test Dialog */}
                <Dialog open={showABTestDialog} onOpenChange={setShowABTestDialog}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Create A/B Test</DialogTitle>
                            <DialogDescription>
                                Set up an A/B test for "{selectedTest?.title}"
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Test Duration (days)</label>
                                <Select defaultValue="14">
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">7 days</SelectItem>
                                        <SelectItem value="14">14 days</SelectItem>
                                        <SelectItem value="21">21 days</SelectItem>
                                        <SelectItem value="30">30 days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="text-sm font-medium mb-2 block">Success Metrics</label>
                                <div className="space-y-2">
                                    {(selectedTest?.success_metrics || []).map((metric: string, index: number) => (
                                        <div key={index} className="flex items-center space-x-2">
                                            <Checkbox id={`metric-${index}`} defaultChecked />
                                            <label htmlFor={`metric-${index}`} className="text-sm">
                                                {metric.replace('_', ' ')}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setShowABTestDialog(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={() => createABTest({
                                    test_type: selectedTest?.test_type,
                                    test_variations: selectedTest?.test_variations,
                                    success_metrics: selectedTest?.success_metrics,
                                    test_duration_days: 14,
                                })}>
                                    Create Test
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}