import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    Calendar, 
    Clock, 
    TrendingUp, 
    Target, 
    Zap, 
    BarChart3, 
    RefreshCw,
    Plus,
    CheckCircle,
    AlertCircle,
    Calendar as CalendarIcon,
    Filter,
    Download,
    Settings,
    Brain,
    Upload,
    Users,
    LinkIcon,
    Star,
    ArrowRight,
    Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface CalendarData {
    user_id: number;
    has_data: boolean;
    period: {
        start_date: string;
        end_date: string;
        total_days: number;
    };
    platforms: string[];
    data_sources?: {
        total_videos: number;
        published_videos: number;
        connected_platforms: string[];
        has_sufficient_data: boolean;
        data_quality: string;
    };
    optimal_schedule: Array<{
        date: string;
        day_of_week: string;
        is_weekend: boolean;
        historical_performance?: number;
        video_count?: number;
        platforms: Record<string, {
            platform: string;
            historical_performance?: number;
            video_count?: number;
            success_rate?: number;
            recommended_posts: number;
            optimal_times: string[];
            confidence?: string;
            note?: string;
        }>;
        recommended_posts: number;
        optimal_times: string[];
        confidence_level?: string;
        note?: string;
    }>;
    content_recommendations: Array<{
        type: string;
        title?: string;
        description?: string;
        performance_score?: number;
        video_count?: number;
        success_rate?: number;
        best_platforms?: string[];
        optimal_duration?: number;
        example_titles?: string[];
        suggested_frequency: string;
        platforms?: string[];
        tips?: string[];
        note?: string;
    }>;
    trending_opportunities?: Array<{
        type: string;
        title: string;
        description: string;
        performance_score?: number;
        recommended_action?: string;
        confidence: string;
    }>;
    engagement_predictions?: Array<{
        date: string;
        day_of_week: string;
        predicted_engagement: number;
        confidence: string;
        based_on_videos?: number;
        recommendation?: string;
    }>;
    content_gaps?: Array<{
        type: string;
        missing_type?: string;
        current_count: number;
        recommended_count: number;
        priority: string;
        suggestion: string;
    }>;
    performance_forecasts?: Record<string, {
        platform: string;
        status?: string;
        message?: string;
        avg_performance_score?: number;
        success_rate?: number;
        video_count?: number;
        trend?: string;
        recommendation?: string;
    }>;
    best_performing_content?: Array<{
        id: number;
        title: string;
        content_type: string;
        total_engagement: number;
        best_platform: string;
        created_at: string;
        success_factors: string[];
    }>;
    platform_insights?: Record<string, {
        platform: string;
        status?: string;
        message?: string;
        total_videos?: number;
        successful_videos?: number;
        success_rate?: number;
        avg_performance?: number;
        best_content_type?: string;
        recommendations?: string[];
    }>;
    setup_guide?: {
        steps: Array<{
            title: string;
            description: string;
            action: string;
            importance: string;
        }>;
        estimated_time: string;
        benefits: string[];
    };
    seasonal_insights: any;
    posting_frequency: Record<string, {
        platform: string;
        posts_per_week: number;
        posts_per_day: number;
        confidence: string;
        note: string;
    }>;
    calendar_score: number;
}

interface AIContentCalendarProps {
    userId?: number;
    className?: string;
}

const AIContentCalendar: React.FC<AIContentCalendarProps> = ({ userId, className }) => {
    const [calendarData, setCalendarData] = useState<CalendarData | null>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('calendar');
    const [selectedFilter, setSelectedFilter] = useState<string>('all');
    const { toast } = useToast();

    const generateCalendar = async () => {
        setLoading(true);
        try {
            const response = await fetch('/ai/generate-content-calendar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    user_id: userId,
                    platforms: ['youtube', 'instagram', 'tiktok'],
                    days: 30,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setCalendarData(data.data);
                toast({
                    title: data.data.has_data ? "Calendar Generated! 📅" : "Basic Calendar Generated 📅",
                    description: data.message,
                });
            } else {
                throw new Error(data.message || 'Failed to generate calendar');
            }
        } catch (error) {
            console.error('Calendar generation error:', error);
            toast({
                title: "Error",
                description: "Failed to generate calendar. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const getDataQualityColor = (quality: string) => {
        switch (quality) {
            case 'excellent': return 'text-green-600 bg-green-50';
            case 'good': return 'text-blue-600 bg-blue-50';
            case 'fair': return 'text-yellow-600 bg-yellow-50';
            case 'poor': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const getConfidenceIcon = (confidence: string) => {
        switch (confidence) {
            case 'high': return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
            case 'low': return <AlertCircle className="h-4 w-4 text-red-500" />;
            default: return <Info className="h-4 w-4 text-gray-500" />;
        }
    };

    const getPlatformIcon = (platform: string) => {
        const iconMap: Record<string, string> = {
            youtube: '📺',
            instagram: '📷',
            tiktok: '🎵',
            twitter: '🐦',
            facebook: '👥',
        };
        return iconMap[platform] || '📱';
    };

    const DataSourcesSection = () => {
        if (!calendarData?.data_sources) return null;

        const { data_sources } = calendarData;

        return (
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Data Sources
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-foreground">{data_sources.total_videos}</div>
                            <div className="text-sm text-muted-foreground">Total Videos</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-foreground">{data_sources.published_videos}</div>
                            <div className="text-sm text-muted-foreground">Published Videos</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-foreground">{data_sources.connected_platforms.length}</div>
                            <div className="text-sm text-muted-foreground">Connected Platforms</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded-lg">
                            <Badge className={cn("text-xs", getDataQualityColor(data_sources.data_quality))}>
                                {data_sources.data_quality}
                            </Badge>
                            <div className="text-sm text-muted-foreground mt-1">Data Quality</div>
                        </div>
                    </div>

                    {!data_sources.has_sufficient_data && (
                        <Alert className="mt-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Upload more videos and publish to platforms to get personalized insights and better recommendations.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        );
    };

    const SetupGuideSection = () => {
        if (!calendarData?.setup_guide) return null;

        const { setup_guide } = calendarData;

        return (
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Get Started
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-gray-600 mb-4">
                            Follow these steps to unlock AI-powered personalized insights:
                        </p>

                        <div className="space-y-3">
                            {setup_guide.steps.map((step, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                        step.importance === 'high' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    )}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium">{step.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                                        <Badge variant="outline" className="mt-2 text-xs">
                                            {step.action}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-900">Benefits of Setup:</h4>
                            <ul className="mt-2 space-y-1">
                                {setup_guide.benefits.map((benefit, index) => (
                                    <li key={index} className="text-sm text-blue-700 flex items-center gap-2">
                                        <Star className="h-3 w-3" />
                                        {benefit}
                                    </li>
                                ))}
                            </ul>
                            <p className="text-xs text-blue-600 mt-3">
                                Estimated time: {setup_guide.estimated_time}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    const BestPerformingContentSection = () => {
        if (!calendarData?.best_performing_content?.length) return null;

        return (
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Your Best Performing Content
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {calendarData.best_performing_content.map((content, index) => (
                            <div key={content.id} className="p-3 border rounded-lg">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium">{content.title}</h4>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                            <span>{getPlatformIcon(content.best_platform)} Best on {content.best_platform}</span>
                                            <span>Score: {content.total_engagement}</span>
                                            <span>{content.content_type}</span>
                                        </div>
                                        {content.success_factors.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {content.success_factors.map((factor, idx) => (
                                                    <Badge key={idx} variant="secondary" className="text-xs">
                                                        {factor}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <Badge className="bg-green-100 text-green-800">
                                        #{index + 1}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    };

    const ScheduleSection = () => {
        if (!calendarData?.optimal_schedule?.length) return null;

        const upcomingDays = calendarData.optimal_schedule.slice(0, 7);

        return (
            <div className="space-y-4">
                {upcomingDays.map((day) => (
                    <Card key={day.date}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <h3 className="font-medium capitalize">{day.day_of_week}</h3>
                                    <p className="text-sm text-gray-600">{day.date}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {calendarData.has_data && day.confidence_level && 
                                        getConfidenceIcon(day.confidence_level)
                                    }
                                    <Badge variant={day.recommended_posts > 0 ? "default" : "secondary"}>
                                        {day.recommended_posts} posts
                                    </Badge>
                                </div>
                            </div>

                            {day.note && (
                                <Alert className="mb-3">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>{day.note}</AlertDescription>
                                </Alert>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {Object.values(day.platforms).map((platform) => (
                                    <div key={platform.platform} className="p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span>{getPlatformIcon(platform.platform)}</span>
                                            <span className="font-medium capitalize">{platform.platform}</span>
                                            {platform.confidence && getConfidenceIcon(platform.confidence)}
                                        </div>
                                        
                                        <div className="text-sm space-y-1">
                                            {platform.recommended_posts > 0 && (
                                                <p>Recommended posts: {platform.recommended_posts}</p>
                                            )}
                                            
                                            <p>Best times: {platform.optimal_times.join(', ')}</p>
                                            
                                            {calendarData.has_data && platform.video_count !== undefined && (
                                                <p className="text-gray-600">
                                                    Based on {platform.video_count} videos
                                                    {platform.success_rate && ` (${platform.success_rate}% success rate)`}
                                                </p>
                                            )}
                                            
                                            {platform.note && (
                                                <p className="text-xs text-gray-500 italic">{platform.note}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    const ContentRecommendationsSection = () => {
        if (!calendarData?.content_recommendations?.length) return null;

        return (
            <div className="space-y-4">
                {calendarData.content_recommendations.map((rec, index) => (
                    <Card key={index}>
                        <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h3 className="font-medium">
                                        {rec.title || `${rec.type.charAt(0).toUpperCase() + rec.type.slice(1)} Content`}
                                    </h3>
                                    {rec.description && (
                                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                                    )}
                                </div>
                                {rec.performance_score && (
                                    <Badge className="bg-blue-100 text-blue-800">
                                        Score: {Math.round(rec.performance_score)}
                                    </Badge>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <div>
                                    <p className="text-sm"><strong>Frequency:</strong> {rec.suggested_frequency}</p>
                                    {rec.optimal_duration && (
                                        <p className="text-sm"><strong>Optimal Duration:</strong> {Math.round(rec.optimal_duration)}s</p>
                                    )}
                                    {rec.platforms && (
                                        <p className="text-sm">
                                            <strong>Best Platforms:</strong> {rec.platforms.map(p => getPlatformIcon(p)).join(' ')}
                                        </p>
                                    )}
                                </div>
                                
                                {calendarData.has_data && rec.video_count !== undefined && (
                                    <div>
                                        <p className="text-sm"><strong>Based on:</strong> {rec.video_count} videos</p>
                                        {rec.success_rate && (
                                            <p className="text-sm"><strong>Success Rate:</strong> {Math.round(rec.success_rate)}%</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {rec.example_titles && rec.example_titles.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-sm font-medium mb-1">Example titles from your content:</p>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                        {rec.example_titles.map((title, idx) => (
                                            <li key={idx}>• {title}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {rec.tips && rec.tips.length > 0 && (
                                <div className="mb-3">
                                    <p className="text-sm font-medium mb-1">Tips:</p>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                        {rec.tips.map((tip, idx) => (
                                            <li key={idx}>• {tip}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {rec.note && (
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>{rec.note}</AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    const PlatformInsightsSection = () => {
        if (!calendarData?.platform_insights) return null;

        return (
            <div className="space-y-4">
                {Object.values(calendarData.platform_insights).map((insight) => (
                    <Card key={insight.platform}>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xl">{getPlatformIcon(insight.platform)}</span>
                                <h3 className="font-medium capitalize">{insight.platform}</h3>
                            </div>

                            {insight.status === 'no_data' ? (
                                <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{insight.message}</AlertDescription>
                                </Alert>
                            ) : (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="text-center p-2 bg-gray-50 rounded">
                                            <div className="font-bold">{insight.total_videos}</div>
                                            <div className="text-xs text-gray-600">Total Videos</div>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded">
                                            <div className="font-bold">{insight.successful_videos}</div>
                                            <div className="text-xs text-gray-600">Successful</div>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded">
                                            <div className="font-bold">{Math.round(insight.success_rate || 0)}%</div>
                                            <div className="text-xs text-gray-600">Success Rate</div>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded">
                                            <div className="font-bold">{Math.round(insight.avg_performance || 0)}</div>
                                            <div className="text-xs text-gray-600">Avg Performance</div>
                                        </div>
                                    </div>

                                    {insight.best_content_type && (
                                        <p className="text-sm">
                                            <strong>Best Content Type:</strong> {insight.best_content_type}
                                        </p>
                                    )}

                                    {insight.recommendations && insight.recommendations.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium mb-1">Recommendations:</p>
                                            <ul className="text-xs text-gray-600 space-y-1">
                                                {insight.recommendations.map((rec, idx) => (
                                                    <li key={idx}>• {rec}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    };

    if (!calendarData) {
        return (
            <div className={cn("space-y-6", className)}>
                <Card>
                    <CardContent className="p-8 text-center">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-lg font-medium mb-2">AI Content Calendar</h3>
                        <p className="text-gray-600 mb-6">
                            Generate a personalized content calendar based on your video performance data and AI insights.
                        </p>
                        <Button 
                            onClick={generateCalendar}
                            disabled={loading}
                            className="w-full max-w-sm"
                        >
                            {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                            Generate Content Calendar
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Content Calendar</h2>
                    <p className="text-gray-600">
                        {calendarData.has_data 
                            ? `Personalized insights based on your ${calendarData.data_sources?.total_videos || 0} videos`
                            : 'Basic recommendations - upload videos for personalized insights'
                        }
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge 
                        className={cn(
                            calendarData.has_data ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        )}
                    >
                        Score: {calendarData.calendar_score}/100
                    </Badge>
                    <Button onClick={generateCalendar} disabled={loading} variant="outline">
                        {loading && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                        Regenerate
                    </Button>
                </div>
            </div>

            {!calendarData.has_data && <SetupGuideSection />}
            <DataSourcesSection />
            {calendarData.has_data && <BestPerformingContentSection />}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="calendar">Schedule</TabsTrigger>
                    <TabsTrigger value="recommendations">Content Ideas</TabsTrigger>
                    <TabsTrigger value="insights">Platform Insights</TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="calendar" className="space-y-4">
                    <ScheduleSection />
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                    <ContentRecommendationsSection />
                </TabsContent>

                <TabsContent value="insights" className="space-y-4">
                    <PlatformInsightsSection />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(calendarData.posting_frequency).map(([platform, freq]) => (
                            <Card key={platform}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span>{getPlatformIcon(platform)}</span>
                                        <h3 className="font-medium capitalize">{platform}</h3>
                                        {getConfidenceIcon(freq.confidence)}
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-sm">
                                            <strong>Recommended:</strong> {freq.posts_per_week} posts/week
                                        </p>
                                        <p className="text-sm">
                                            <strong>Daily average:</strong> {freq.posts_per_day} posts
                                        </p>
                                        <p className="text-xs text-gray-600 italic">{freq.note}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AIContentCalendar; 