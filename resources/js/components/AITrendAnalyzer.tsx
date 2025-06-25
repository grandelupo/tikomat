import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    TrendingUp,
    Target,
    Hash,
    Users,
    Zap,
    AlertTriangle,
    Star,
    Clock,
    Globe,
    Eye,
    Heart,
    MessageCircle,
    Share2,
    Sparkles,
    RefreshCw,
    BarChart3,
    Trophy,
    Lightbulb,
    CheckCircle,
    ArrowUp,
    ArrowDown,
    Minus,
    Activity,
    Flame,
    Crown,
    Rocket,
    Shield,
    Gauge
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TrendAnalysis {
    timestamp: string;
    timeframe: string;
    platforms: string[];
    trending_topics: TrendingTopic[];
    viral_content: ViralContent[];
    emerging_trends: EmergingTrend[];
    hashtag_trends: HashtagTrend[];
    content_opportunities: ContentOpportunity[];
    trend_predictions: TrendPrediction[];
    competitive_landscape: CompetitiveLandscape[];
    market_insights: MarketInsights;
    trend_score: number;
    recommendation_confidence: string;
}

interface TrendingTopic {
    topic: string;
    category: string;
    trend_velocity: number;
    engagement_rate: number;
    growth_rate: string;
    platforms: string[];
    peak_time: string;
    sentiment: string;
    geographic_spread: string[];
    related_keywords: string[];
    estimated_reach: number;
    competitor_adoption: number;
    trend_strength: string;
    opportunity_score: number;
    recommended_action: string;
}

interface ViralContent {
    content_type: string;
    viral_score: number;
    estimated_reach: number;
    engagement_rate: number;
    platforms: string[];
    success_factors: string[];
    optimal_timing: string;
    target_demographic: string;
    geographic_focus: string[];
    hashtag_strategy: string[];
    implementation_ease: string;
    trend_lifespan: string;
}

interface HashtagTrend {
    hashtag: string;
    usage_count: number;
    growth_rate: string;
    platforms: string[];
    engagement_boost: number;
    competition_level: string;
    optimal_usage: string;
    related_hashtags: string[];
    target_demographic: string;
    peak_posting_hours: string[];
    trend_momentum: string;
    longevity_prediction: string;
}

interface AITrendAnalyzerProps {
    userId?: number;
    className?: string;
}

export default function AITrendAnalyzer({
    userId,
    className
}: AITrendAnalyzerProps) {
    const [analysis, setAnalysis] = useState<TrendAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState('topics');
    const [settings, setSettings] = useState({
        platforms: ['youtube', 'instagram', 'tiktok'],
        timeframe: '24h',
        include_competitors: false,
        categories: [],
    });
    const { toast } = useToast();

    const analyzeTrends = async () => {
        if (!userId) {
            toast({
                title: "User Required",
                description: "Please log in to analyze trends.",
                variant: "destructive",
            });
            return;
        }

        setIsAnalyzing(true);
        
        try {
            const response = await fetch('/ai/analyze-trends', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(settings),
            });

            const data = await response.json();

            if (data.success) {
                setAnalysis(data.data);
                toast({
                    title: "Trend Analysis Complete! 📊",
                    description: `Found ${data.data.trending_topics.length} trending topics with trend score of ${data.data.trend_score}/100.`,
                });
            } else {
                throw new Error(data.message || 'Failed to analyze trends');
            }
        } catch (error) {
            console.error('Trend analysis error:', error);
            toast({
                title: "Analysis Failed",
                description: "Failed to analyze trends. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getPlatformIcon = (platform: string) => {
        const icons = {
            youtube: '📺',
            instagram: '📷',
            tiktok: '🎵',
            facebook: '👥',
            twitter: '🐦',
            snapchat: '👻',
            pinterest: '📌',
        };
        return icons[platform as keyof typeof icons] || '📱';
    };

    const getTrendStrengthColor = (strength: string) => {
        switch (strength) {
            case 'very_strong': return 'text-red-600 bg-red-100';
            case 'strong': return 'text-orange-600 bg-orange-100';
            case 'moderate': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getCompetitionColor = (level: string) => {
        switch (level) {
            case 'low': return 'text-green-600 bg-green-100';
            case 'medium': return 'text-yellow-600 bg-yellow-100';
            case 'high': return 'text-red-600 bg-red-100';
            default: return 'text-gray-600 bg-gray-100';
        }
    };

    const getMomentumIcon = (momentum: string) => {
        switch (momentum) {
            case 'explosive': return <Rocket className="w-4 h-4 text-red-500" />;
            case 'strong': return <TrendingUp className="w-4 h-4 text-green-500" />;
            case 'moderate': return <Activity className="w-4 h-4 text-blue-500" />;
            default: return <Minus className="w-4 h-4 text-gray-500" />;
        }
    };

    if (!analysis && !isAnalyzing) {
        return (
            <Card className={cn("border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50", className)}>
                <CardHeader className="text-center pb-4">
                    <div className="mx-auto p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full w-fit">
                        <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        AI Trend Analyzer
                    </CardTitle>
                    <p className="text-gray-600">
                        Discover trending topics, viral content patterns, and competitive insights
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="p-3 bg-white rounded-lg border">
                            <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                            <p className="font-medium">Trending Topics</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                                                            <Flame className="w-6 h-6 text-red-600 mx-auto mb-2" />
                            <p className="font-medium">Viral Content</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                            <Hash className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                            <p className="font-medium">Hashtag Trends</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg border">
                            <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                            <p className="font-medium">Opportunities</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Platforms</label>
                                <div className="flex flex-wrap gap-2">
                                    {['youtube', 'instagram', 'tiktok', 'facebook', 'x'].map((platform) => (
                                        <Button
                                            key={platform}
                                            variant={settings.platforms.includes(platform) ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => {
                                                const newPlatforms = settings.platforms.includes(platform)
                                                    ? settings.platforms.filter(p => p !== platform)
                                                    : [...settings.platforms, platform];
                                                setSettings(prev => ({ ...prev, platforms: newPlatforms }));
                                            }}
                                        >
                                            <span className="mr-1">{getPlatformIcon(platform)}</span>
                                            <span className="capitalize">{platform}</span>
                                        </Button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Timeframe</label>
                                <Select value={settings.timeframe} onValueChange={(value) => 
                                    setSettings(prev => ({ ...prev, timeframe: value }))
                                }>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1h">Last Hour</SelectItem>
                                        <SelectItem value="6h">Last 6 Hours</SelectItem>
                                        <SelectItem value="24h">Last 24 Hours</SelectItem>
                                        <SelectItem value="7d">Last 7 Days</SelectItem>
                                        <SelectItem value="30d">Last 30 Days</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="competitors"
                                    checked={settings.include_competitors}
                                    onChange={(e) => setSettings(prev => ({ ...prev, include_competitors: e.target.checked }))}
                                    className="rounded"
                                />
                                <label htmlFor="competitors" className="text-sm font-medium">
                                    Include Competitor Analysis
                                </label>
                            </div>
                        </div>
                    </div>
                    
                    <Button 
                        onClick={analyzeTrends}
                        disabled={!userId || settings.platforms.length === 0}
                        size="lg"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                        <Sparkles className="w-5 h-5 mr-2" />
                        Analyze Trends
                    </Button>
                    
                    {!userId && (
                        <p className="text-sm text-gray-500 text-center">
                            Please log in to analyze trends
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
                        <TrendingUp className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Analyzing Trends...</h3>
                        <p className="text-gray-600 mb-4">
                            AI is analyzing real-time trends, viral content patterns, and market opportunities
                        </p>
                        <Progress value={75} className="w-full max-w-md mx-auto" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg">
                            <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                            <span>Scanning platforms...</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg">
                            <RefreshCw className="w-4 h-4 animate-spin text-pink-600" />
                            <span>Detecting viral content...</span>
                        </div>
                        <div className="flex items-center justify-center gap-2 p-3 bg-white rounded-lg">
                            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                            <span>Analyzing competition...</span>
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
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                AI Trend Analyzer
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                                Score: {analysis.trend_score}/100 • {analysis.platforms.length} platforms • {analysis.timeframe}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            onClick={analyzeTrends}
                            disabled={isAnalyzing}
                            size="sm"
                            variant="outline"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Refresh
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="topics">Topics</TabsTrigger>
                        <TabsTrigger value="viral">Viral</TabsTrigger>
                        <TabsTrigger value="hashtags">Hashtags</TabsTrigger>
                        <TabsTrigger value="opportunities">Opportunities</TabsTrigger>
                        <TabsTrigger value="emerging">Emerging</TabsTrigger>
                        <TabsTrigger value="competitive">Competitive</TabsTrigger>
                    </TabsList>

                    <TabsContent value="topics" className="space-y-4">
                        <div className="grid gap-4">
                            {analysis.trending_topics.map((topic, index) => (
                                <Card key={index}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <TrendingUp className="w-4 h-4" />
                                                    {topic.topic}
                                                </h4>
                                                <p className="text-sm text-gray-600 capitalize">
                                                    {topic.category} • {topic.sentiment} sentiment
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Badge className={getTrendStrengthColor(topic.trend_strength)}>
                                                    {topic.trend_strength.replace('_', ' ')}
                                                </Badge>
                                                <Badge variant="outline">
                                                    {topic.opportunity_score}/100
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                <div className="text-2xl font-bold text-purple-600">{topic.trend_velocity.toLocaleString()}</div>
                                                <div className="text-xs text-gray-600">Trend Velocity</div>
                                            </div>
                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                <div className="text-2xl font-bold text-green-600">{topic.engagement_rate}%</div>
                                                <div className="text-xs text-gray-600">Engagement Rate</div>
                                            </div>
                                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                <div className="text-2xl font-bold text-blue-600">{topic.estimated_reach.toLocaleString()}</div>
                                                <div className="text-xs text-gray-600">Estimated Reach</div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <h5 className="font-medium text-sm mb-2">Platforms:</h5>
                                                <div className="flex flex-wrap gap-1">
                                                    {topic.platforms.map((platform, platformIndex) => (
                                                        <div key={platformIndex} className="flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-1">
                                                            <span>{getPlatformIcon(platform)}</span>
                                                            <span className="capitalize">{platform}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h5 className="font-medium text-sm mb-2">Keywords:</h5>
                                                <div className="flex flex-wrap gap-1">
                                                    {topic.related_keywords.slice(0, 4).map((keyword, keywordIndex) => (
                                                        <Badge key={keywordIndex} variant="outline" className="text-xs">
                                                            {keyword}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t mt-3">
                                            <div className="text-sm">
                                                <span className="text-gray-600">Competition: </span>
                                                <span className="font-medium">{topic.competitor_adoption}%</span>
                                            </div>
                                            <div className="text-sm font-medium text-green-600">
                                                {topic.recommended_action}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="viral" className="space-y-4">
                        <div className="grid gap-4">
                            {analysis.viral_content.map((content, index) => (
                                <Card key={index}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <Flame className="w-4 h-4 text-red-500" />
                                                    {content.content_type}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {content.target_demographic} • {content.implementation_ease} to create
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Badge className="bg-red-100 text-red-800">
                                                    {content.viral_score}/100
                                                </Badge>
                                                <Badge variant="outline">
                                                    {content.trend_lifespan}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                                            <div className="text-center p-3 bg-red-50 rounded-lg">
                                                <Eye className="w-6 h-6 text-red-600 mx-auto mb-1" />
                                                <div className="text-lg font-bold">{content.estimated_reach.toLocaleString()}</div>
                                                <div className="text-xs text-gray-600">Est. Reach</div>
                                            </div>
                                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                                                <Heart className="w-6 h-6 text-orange-600 mx-auto mb-1" />
                                                <div className="text-lg font-bold">{content.engagement_rate}%</div>
                                                <div className="text-xs text-gray-600">Engagement</div>
                                            </div>
                                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                <Clock className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                                                <div className="text-lg font-bold">{content.optimal_timing}</div>
                                                <div className="text-xs text-gray-600">Best Time</div>
                                            </div>
                                        </div>

                                        <div>
                                            <h5 className="font-medium text-sm mb-2">Success Factors:</h5>
                                            <div className="space-y-1">
                                                {content.success_factors.map((factor, factorIndex) => (
                                                    <div key={factorIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                                        <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                                                        {factor}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4 pt-3 border-t mt-3">
                                            <div>
                                                <h5 className="font-medium text-sm mb-1">Platforms:</h5>
                                                <div className="flex flex-wrap gap-1">
                                                    {content.platforms.map((platform, platformIndex) => (
                                                        <div key={platformIndex} className="flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-1">
                                                            <span>{getPlatformIcon(platform)}</span>
                                                            <span className="capitalize">{platform}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="font-medium text-sm mb-1">Hashtags:</h5>
                                                <div className="flex flex-wrap gap-1">
                                                    {content.hashtag_strategy.map((hashtag, hashtagIndex) => (
                                                        <Badge key={hashtagIndex} variant="outline" className="text-xs">
                                                            {hashtag}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="hashtags" className="space-y-4">
                        <div className="grid gap-4">
                            {analysis.hashtag_trends.map((hashtag, index) => (
                                <Card key={index}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <Hash className="w-4 h-4 text-blue-500" />
                                                    {hashtag.hashtag}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {hashtag.usage_count.toLocaleString()} uses • {hashtag.target_demographic}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Badge className={getCompetitionColor(hashtag.competition_level)}>
                                                    {hashtag.competition_level} competition
                                                </Badge>
                                                <div className="flex items-center gap-1">
                                                    {getMomentumIcon(hashtag.trend_momentum)}
                                                    <span className="text-xs">{hashtag.trend_momentum}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-4 gap-4 mb-4">
                                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                <div className="text-lg font-bold text-blue-600">{hashtag.growth_rate}</div>
                                                <div className="text-xs text-gray-600">Growth Rate</div>
                                            </div>
                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                <div className="text-lg font-bold text-green-600">{hashtag.engagement_boost}x</div>
                                                <div className="text-xs text-gray-600">Engagement Boost</div>
                                            </div>
                                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                <div className="text-lg font-bold text-purple-600 capitalize">{hashtag.optimal_usage}</div>
                                                <div className="text-xs text-gray-600">Usage Type</div>
                                            </div>
                                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                                                <div className="text-lg font-bold text-orange-600">{hashtag.longevity_prediction}</div>
                                                <div className="text-xs text-gray-600">Lifespan</div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <h5 className="font-medium text-sm mb-2">Related Hashtags:</h5>
                                                <div className="flex flex-wrap gap-1">
                                                    {hashtag.related_hashtags.map((related, relatedIndex) => (
                                                        <Badge key={relatedIndex} variant="outline" className="text-xs">
                                                            {related}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <h5 className="font-medium text-sm mb-2">Peak Hours:</h5>
                                                <div className="flex flex-wrap gap-1">
                                                    {hashtag.peak_posting_hours.map((hour, hourIndex) => (
                                                        <Badge key={hourIndex} variant="outline" className="text-xs">
                                                            <Clock className="w-3 h-3 mr-1" />
                                                            {hour}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="opportunities" className="space-y-4">
                        <div className="grid gap-4">
                            {analysis.content_opportunities.map((opportunity, index) => (
                                <Card key={index}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <Target className="w-4 h-4 text-green-500" />
                                                    {opportunity.opportunity}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {opportunity.audience_demand} demand • {opportunity.competition_level} competition
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Badge className="bg-green-100 text-green-800">
                                                    {opportunity.market_gap_score}/100
                                                </Badge>
                                                <Badge variant="outline">
                                                    {opportunity.projected_performance.growth_potential}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                <Eye className="w-6 h-6 text-green-600 mx-auto mb-1" />
                                                <div className="text-lg font-bold">{opportunity.projected_performance.estimated_views.toLocaleString()}</div>
                                                <div className="text-xs text-gray-600">Est. Views</div>
                                            </div>
                                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                <Heart className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                                                <div className="text-lg font-bold">{opportunity.projected_performance.engagement_rate}%</div>
                                                <div className="text-xs text-gray-600">Engagement</div>
                                            </div>
                                            <div className="text-center p-3 bg-purple-50 rounded-lg">
                                                <Clock className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                                                <div className="text-lg font-bold">{opportunity.implementation.time_to_market}</div>
                                                <div className="text-xs text-gray-600">Time to Market</div>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div>
                                                <h5 className="font-medium text-sm mb-2">Format:</h5>
                                                <p className="text-sm text-gray-600 capitalize">{opportunity.recommended_format}</p>
                                                
                                                <h5 className="font-medium text-sm mb-2 mt-3">Difficulty:</h5>
                                                <Badge className={
                                                    opportunity.implementation.difficulty_level === 'easy' ? 'bg-green-100 text-green-800' :
                                                    opportunity.implementation.difficulty_level === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }>
                                                    {opportunity.implementation.difficulty_level}
                                                </Badge>
                                            </div>
                                            <div>
                                                <h5 className="font-medium text-sm mb-2">Platforms:</h5>
                                                <div className="flex flex-wrap gap-1">
                                                    {opportunity.platforms.map((platform, platformIndex) => (
                                                        <div key={platformIndex} className="flex items-center gap-1 text-xs bg-gray-100 rounded px-2 py-1">
                                                            <span>{getPlatformIcon(platform)}</span>
                                                            <span className="capitalize">{platform}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t mt-3">
                                            <h5 className="font-medium text-sm mb-2">Action Plan:</h5>
                                            <div className="space-y-2">
                                                {opportunity.action_plan.immediate_steps.slice(0, 3).map((step, stepIndex) => (
                                                    <div key={stepIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                                        <CheckCircle className="w-3 h-3 mt-0.5 text-green-500 flex-shrink-0" />
                                                        {step}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="emerging" className="space-y-4">
                        <div className="grid gap-4">
                            {analysis.emerging_trends.map((trend, index) => (
                                <Card key={index}>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h4 className="font-medium flex items-center gap-2">
                                                    <Rocket className="w-4 h-4 text-orange-500" />
                                                    {trend.trend}
                                                </h4>
                                                <p className="text-sm text-gray-600 capitalize">
                                                    {trend.category} • {trend.early_adopters.toLocaleString()} early adopters
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Badge className="bg-orange-100 text-orange-800">
                                                    {trend.emergence_score}/100
                                                </Badge>
                                                <Badge className={
                                                    trend.risk_assessment === 'low' ? 'bg-green-100 text-green-800' :
                                                    trend.risk_assessment === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }>
                                                    {trend.risk_assessment} risk
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                                            <div className="text-center p-3 bg-orange-50 rounded-lg">
                                                <div className="text-lg font-bold text-orange-600">{trend.growth_velocity}</div>
                                                <div className="text-xs text-gray-600">Growth Velocity</div>
                                            </div>
                                            <div className="text-center p-3 bg-blue-50 rounded-lg">
                                                <div className="text-lg font-bold text-blue-600">{trend.predicted_peak}</div>
                                                <div className="text-xs text-gray-600">Predicted Peak</div>
                                            </div>
                                            <div className="text-center p-3 bg-green-50 rounded-lg">
                                                <div className="text-lg font-bold text-green-600">{trend.opportunity_window}</div>
                                                <div className="text-xs text-gray-600">Opportunity Window</div>
                                            </div>
                                        </div>

                                        <div>
                                            <h5 className="font-medium text-sm mb-2">Trend Indicators:</h5>
                                            <div className="space-y-1">
                                                {trend.trend_indicators.map((indicator, indicatorIndex) => (
                                                    <div key={indicatorIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                                        <Activity className="w-3 h-3 mt-0.5 text-blue-500 flex-shrink-0" />
                                                        {indicator}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t mt-3">
                                            <div className="text-sm">
                                                <span className="text-gray-600">Competition: </span>
                                                <span className="font-medium capitalize">{trend.competition_level}</span>
                                            </div>
                                            <div className="text-sm font-medium text-orange-600">
                                                {trend.recommended_timeline}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="competitive" className="space-y-4">
                        {analysis.competitive_landscape && analysis.competitive_landscape.length > 0 ? (
                            <div className="space-y-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Crown className="w-5 h-5 text-yellow-500" />
                                            Market Leaders
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {analysis.competitive_landscape.market_leaders?.map((leader, index) => (
                                            <div key={index} className="p-4 bg-gray-50 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="font-medium">{leader.creator}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm">{getPlatformIcon(leader.platform)}</span>
                                                        <span className="text-sm font-medium">{leader.followers.toLocaleString()} followers</span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-600">Avg Views:</span>
                                                        <div className="font-medium">{leader.avg_views.toLocaleString()}</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Engagement:</span>
                                                        <div className="font-medium">{leader.engagement_rate}%</div>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Frequency:</span>
                                                        <div className="font-medium">{leader.content_frequency}</div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 text-sm">
                                                    <span className="text-gray-600">Strategy:</span>
                                                    <span className="ml-2 font-medium">{leader.unique_advantage}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Target className="w-5 h-5 text-green-500" />
                                            Market Opportunities
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div>
                                            <h5 className="font-medium mb-2">Underserved Niches:</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.competitive_landscape.market_opportunities?.underserved_niches?.map((niche, index) => (
                                                    <Badge key={index} variant="outline" className="bg-green-50">
                                                        {niche}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h5 className="font-medium mb-2">Content Gaps:</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {analysis.competitive_landscape.market_opportunities?.content_gaps?.map((gap, index) => (
                                                    <Badge key={index} variant="outline" className="bg-blue-50">
                                                        {gap}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Competitive Analysis Not Available</h3>
                                    <p className="text-gray-600 mb-4">
                                        Enable competitive analysis in settings to see detailed competitor insights.
                                    </p>
                                    <Button 
                                        onClick={() => setSettings(prev => ({ ...prev, include_competitors: true }))}
                                        variant="outline"
                                    >
                                        Enable Competitive Analysis
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
} 