import React, { useState, useEffect } from 'react';
import { 
    Users, TrendingUp, Target, Eye, Heart, MessageCircle, Share2, 
    Globe, Clock, Smartphone, Monitor, Tablet, MapPin, 
    DollarSign, GraduationCap, Star, ThumbsUp, BarChart3,
    ArrowUp, ArrowDown, Settings, Calendar, User, 
    Zap, CheckCircle, AlertTriangle, RefreshCw, AlertCircle, 
    Plus, ExternalLink
} from 'lucide-react';

interface AudienceInsightsProps {
    videoId?: number;
    onClose?: () => void;
}

interface DataSufficiency {
    sufficient: boolean;
    confidence: string;
    metrics: {
        video_count: number;
        publishing_targets: number;
        connected_platforms: number;
        publishing_history: number;
        timeframe_days: number;
    };
    requirements: {
        min_videos: number;
        min_publishing_history: number;
        min_platforms: number;
    };
    missing_data: Array<{
        type: string;
        message: string;
        current: number;
        required: number;
    }>;
}

interface InsightData {
    user_id: number;
    analysis_timestamp: string;
    timeframe: string;
    platforms: string[];
    data_sufficiency?: DataSufficiency;
    status?: string;
    message?: string;
    recommendations?: Array<{
        action: string;
        description: string;
        priority: string;
        estimated_time: string;
    }>;
    demographic_breakdown: any;
    behavior_patterns: any;
    audience_segments: any;
    engagement_insights: any;
    content_preferences: any;
    growth_opportunities: any;
    retention_analysis: any;
    competitor_audience_overlap: any;
    personalization_recommendations: any;
    audience_health_score: number;
    insights_confidence: string;
}

const AIAudienceInsights: React.FC<AudienceInsightsProps> = ({ videoId, onClose }) => {
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(false);
    const [insights, setInsights] = useState<InsightData | null>(null);
    const [settings, setSettings] = useState({
        platforms: ['youtube', 'instagram', 'tiktok'],
        timeframe: '30d',
        includeSegmentation: true,
    });

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Users },
        { id: 'demographics', label: 'Demographics', icon: Globe },
        { id: 'segments', label: 'Segments', icon: Target },
        { id: 'behavior', label: 'Behavior', icon: Eye },
        { id: 'growth', label: 'Growth', icon: TrendingUp },
        { id: 'personalization', label: 'Personalization', icon: User },
    ];

    const platformIcons = {
        youtube: '🎬',
        instagram: '📸',
        tiktok: '🎵',
        facebook: '👥',
        twitter: '🐦',
        snapchat: '👻',
    };

    const analyzeAudienceInsights = async () => {
        setLoading(true);
        try {
            const response = await fetch('/ai/audience-insights', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    platforms: settings.platforms,
                    timeframe: settings.timeframe,
                    include_segmentation: settings.includeSegmentation,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setInsights(data.data);
            } else {
                console.error('Failed to analyze audience insights:', data.error);
            }
        } catch (error) {
            console.error('Error analyzing audience insights:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        analyzeAudienceInsights();
    }, [settings]);

    const renderInsufficientDataMessage = () => {
        if (!insights || insights.status !== 'insufficient_data') return null;

        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-amber-950/20 border border-amber-800 rounded-lg p-6 mb-6">
                    <div className="flex items-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-amber-400 mr-3" />
                        <h3 className="text-lg font-semibold text-amber-300">Not Enough Data for Analysis</h3>
                    </div>
                    <p className="text-amber-200 mb-4">{insights.message}</p>
                    
                    {insights.data_sufficiency && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-background rounded-lg p-4 border border-amber-800">
                                <div className="text-sm text-muted-foreground">Videos Created</div>
                                <div className="text-2xl font-bold text-amber-300">
                                    {insights.data_sufficiency.metrics.video_count}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Need {insights.data_sufficiency.requirements.min_videos}+
                                </div>
                            </div>
                            
                            <div className="bg-background rounded-lg p-4 border border-amber-800">
                                <div className="text-sm text-muted-foreground">Connected Platforms</div>
                                <div className="text-2xl font-bold text-amber-300">
                                    {insights.data_sufficiency.metrics.connected_platforms}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Need {insights.data_sufficiency.requirements.min_platforms}+
                                </div>
                            </div>
                            
                            <div className="bg-background rounded-lg p-4 border border-amber-800">
                                <div className="text-sm text-muted-foreground">Publishing History</div>
                                <div className="text-2xl font-bold text-amber-300">
                                    {insights.data_sufficiency.metrics.publishing_history}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Need 1+ successful publish
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {insights.recommendations && insights.recommendations.length > 0 && (
                    <div className="bg-blue-950/20 border border-blue-800 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-blue-300 mb-4 flex items-center">
                            <Zap className="w-5 h-5 mr-2" />
                            Recommended Actions
                        </h4>
                        <div className="space-y-4">
                            {insights.recommendations.map((recommendation, index) => (
                                <div key={index} className="bg-background rounded-lg p-4 border border-blue-800">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h5 className="font-medium text-blue-300 mb-1">
                                                {recommendation.action}
                                            </h5>
                                            <p className="text-blue-200 text-sm mb-2">
                                                {recommendation.description}
                                            </p>
                                            <div className="flex items-center space-x-4 text-xs text-blue-300">
                                                <span className={`px-2 py-1 rounded-full ${
                                                    recommendation.priority === 'critical' 
                                                        ? 'bg-red-950/20 text-red-300' 
                                                        : recommendation.priority === 'high'
                                                        ? 'bg-orange-950/20 text-orange-300'
                                                        : 'bg-blue-950/20 text-blue-300'
                                                }`}>
                                                    {recommendation.priority} priority
                                                </span>
                                                <span className="flex items-center">
                                                    <Clock className="w-3 h-3 mr-1" />
                                                    {recommendation.estimated_time}
                                                </span>
                                            </div>
                                        </div>
                                        <Plus className="w-5 h-5 text-blue-500 ml-4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderDataWarning = (sectionData: any, sectionName: string) => {
        if (sectionData && (sectionData.status === 'insufficient_data' || sectionData.status === 'no_data' || sectionData.status === 'error')) {
            return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                        <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                        <div>
                            <div className="font-medium text-yellow-800">Limited {sectionName} Data</div>
                            <div className="text-sm text-yellow-700">{sectionData.message}</div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    const renderOverviewTab = () => {
        if (insights?.status === 'insufficient_data') {
            return renderInsufficientDataMessage();
        }

        return (
            <div className="space-y-6">
                {/* Data Quality Indicator */}
                {insights?.data_sufficiency && (
                    <div className={`rounded-lg p-4 ${
                        insights.data_sufficiency.confidence === 'high' 
                            ? 'bg-green-950/20 border border-green-800' 
                            : insights.data_sufficiency.confidence === 'medium'
                            ? 'bg-yellow-950/20 border border-yellow-800'
                            : 'bg-red-950/20 border border-red-800'
                    }`}>
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className={`font-medium ${
                                    insights.data_sufficiency.confidence === 'high' 
                                        ? 'text-green-300' 
                                        : insights.data_sufficiency.confidence === 'medium'
                                        ? 'text-yellow-300'
                                        : 'text-red-300'
                                }`}>
                                    Data Quality: {insights.data_sufficiency.confidence.charAt(0).toUpperCase() + insights.data_sufficiency.confidence.slice(1)} Confidence
                                </h3>
                                <p className={`text-sm ${
                                    insights.data_sufficiency.confidence === 'high' 
                                        ? 'text-green-200' 
                                        : insights.data_sufficiency.confidence === 'medium'
                                        ? 'text-yellow-200'
                                        : 'text-red-200'
                                }`}>
                                    Based on {insights.data_sufficiency.metrics.video_count} videos and {insights.data_sufficiency.metrics.publishing_history} publications
                                </p>
                            </div>
                            <CheckCircle className={`w-6 h-6 ${
                                insights.data_sufficiency.confidence === 'high' 
                                    ? 'text-green-500' 
                                    : insights.data_sufficiency.confidence === 'medium'
                                    ? 'text-yellow-500'
                                    : 'text-red-500'
                            }`} />
                        </div>
                    </div>
                )}

                {/* Health Score */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Audience Health Score</h3>
                            <div className="text-3xl font-bold">{insights?.audience_health_score || 0}/100</div>
                            <p className="text-purple-100 text-sm mt-1">
                                {insights?.insights_confidence === 'high' ? 'High Confidence' : 
                                 insights?.insights_confidence === 'medium' ? 'Medium Confidence' : 'Limited Data'} Analysis
                            </p>
                        </div>
                        <div className="text-6xl opacity-20">
                            <Users />
                        </div>
                    </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-background rounded-lg p-6 shadow-sm border border-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-foreground">Success Rate</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {insights?.engagement_insights?.overall_metrics?.success_rate || 0}%
                                </p>
                                <p className="text-sm text-muted-foreground flex items-center mt-1">
                                    <ArrowUp className="w-4 h-4 mr-1" />
                                    Publishing success
                                </p>
                            </div>
                            <Heart className="w-8 h-8 text-red-500" />
                        </div>
                    </div>

                    <div className="bg-background rounded-lg p-6 shadow-sm border border-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-foreground">Total Publications</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {insights?.engagement_insights?.overall_metrics?.total_publications || 0}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">Across platforms</p>
                            </div>
                            <Target className="w-8 h-8 text-blue-500" />
                        </div>
                    </div>

                    <div className="bg-background rounded-lg p-6 shadow-sm border border-gray-800">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-foreground">Platform Coverage</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {insights?.engagement_insights?.overall_metrics?.platform_coverage || settings.platforms.length}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">Platforms active</p>
                            </div>
                            <Globe className="w-8 h-8 text-green-500" />
                        </div>
                    </div>
                </div>

                {/* Platform Distribution */}
                <div className="bg-background rounded-lg p-6 shadow-sm border border-gray-800">
                    <h3 className="text-lg font-semibold mb-4">Platform Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {settings.platforms.map((platform) => (
                            <div key={platform} className="flex items-center p-3 bg-muted rounded-lg">
                                <span className="text-2xl mr-3">{platformIcons[platform as keyof typeof platformIcons]}</span>
                                <div>
                                    <p className="font-medium capitalize">{platform}</p>
                                    <p className="text-sm text-muted-foreground">Active</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderDemographicsTab = () => {
        if (insights?.status === 'insufficient_data') {
            return renderInsufficientDataMessage();
        }

        return (
            <div className="space-y-6">
                {renderDataWarning(insights?.demographic_breakdown, 'Demographics')}
                
                {insights?.demographic_breakdown?.status ? (
                    <div className="bg-background rounded-lg p-6 shadow-sm border border-gray-800">
                        <h3 className="text-lg font-semibold mb-4">Demographics Analysis</h3>
                        <p className="text-muted-foreground">
                            {insights.demographic_breakdown.message || 'No demographic data available yet.'}
                        </p>
                        <div className="mt-4 p-4 bg-background rounded-lg">
                            <p className="text-foreground text-sm">
                                💡 <strong>Tip:</strong> Connect more social media accounts and publish videos to gather demographic insights.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Platform Activity */}
                        <div className="bg-background rounded-lg p-6 shadow-sm border border-gray-800">
                            <h3 className="text-lg font-semibold mb-4">Platform Activity</h3>
                            <div className="space-y-4">
                                {Object.entries(insights?.demographic_breakdown || {})
                                    .filter(([key]) => !['overall', 'analysis_period'].includes(key))
                                    .map(([platform, data]: [string, any]) => (
                                    <div key={platform} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                        <div className="flex items-center">
                                            <span className="text-2xl mr-3">{platformIcons[platform as keyof typeof platformIcons]}</span>
                                            <div>
                                                <div className="font-medium capitalize">{platform}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {data.publishing_count} publications
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-foreground">{data.success_rate}%</div>
                                            <div className="text-sm text-muted-foreground">Success rate</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Overall Demographics */}
                        {insights?.demographic_breakdown?.overall && (
                            <div className="bg-background rounded-lg p-6 shadow-sm border border-gray-800">
                                <h3 className="text-lg font-semibold mb-4">Overall Statistics</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold text-foreground">
                                            {insights.demographic_breakdown.overall.total_publications}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Total Publications</div>
                                    </div>
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold text-foreground">
                                            {insights.demographic_breakdown.overall.average_success_rate}%
                                        </div>
                                        <div className="text-sm text-muted-foreground">Avg Success Rate</div>
                                    </div>
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <div className="text-2xl font-bold text-foreground">
                                            {insights.demographic_breakdown.overall.platform_diversity}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Platforms Used</div>
                                    </div>
                                    <div className="text-center p-4 bg-muted rounded-lg">
                                        <div className="text-lg font-bold text-foreground capitalize">
                                            {insights.demographic_breakdown.overall.most_active_platform}
                                        </div>
                                        <div className="text-sm text-muted-foreground">Most Active</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        );
    };

    const renderSegmentsTab = () => {
        if (insights?.status === 'insufficient_data') {
            return renderInsufficientDataMessage();
        }
        
        return (
            <div className="space-y-6">
                {renderDataWarning(insights?.audience_segments, 'Segmentation')}
                <div className="bg-background rounded-lg p-6 shadow-sm border border-gray-800">
                    <h3 className="text-lg font-semibold mb-4">Audience Segments</h3>
                    <p className="text-muted-foreground">Segment analysis based on your content and publishing patterns.</p>
                </div>
            </div>
        );
    };

    const renderBehaviorTab = () => {
        if (insights?.status === 'insufficient_data') {
            return renderInsufficientDataMessage();
        }
        
        return (
            <div className="space-y-6">
                {renderDataWarning(insights?.behavior_patterns, 'Behavior')}
                <div className="bg-background rounded-lg p-6 shadow-sm border border-gray-800">
                    <h3 className="text-lg font-semibold mb-4">Behavior Patterns</h3>
                    <p className="text-muted-foreground">Analysis of content creation and publishing behavior.</p>
                </div>
            </div>
        );
    };

    const renderGrowthTab = () => {
        if (insights?.status === 'insufficient_data') {
            return renderInsufficientDataMessage();
        }
        
        return (
            <div className="space-y-6">
                {renderDataWarning(insights?.growth_opportunities, 'Growth')}
                <div className="bg-background rounded-lg p-6 shadow-sm border border-gray-800">
                    <h3 className="text-lg font-semibold mb-4">Growth Opportunities</h3>
                    <p className="text-muted-foreground">Recommendations for expanding your audience reach.</p>
                </div>
            </div>
        );
    };

    const renderPersonalizationTab = () => {
        if (insights?.status === 'insufficient_data') {
            return renderInsufficientDataMessage();
        }
        
        return (
            <div className="space-y-6">
                {renderDataWarning(insights?.personalization_recommendations, 'Personalization')}
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Personalization Recommendations</h3>
                    <p className="text-gray-600">Tailored strategies for your content and audience.</p>
                </div>
            </div>
        );
    };

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'overview': return renderOverviewTab();
            case 'demographics': return renderDemographicsTab();
            case 'segments': return renderSegmentsTab();
            case 'behavior': return renderBehaviorTab();
            case 'growth': return renderGrowthTab();
            case 'personalization': return renderPersonalizationTab();
            default: return renderOverviewTab();
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">AI Audience Insights</h1>
                    <p className="text-gray-600">
                        {insights?.insights_confidence === 'insufficient' 
                            ? 'Gather more data for comprehensive insights'
                            : 'Deep audience analysis and personalization recommendations'
                        }
                    </p>
                </div>
                <div className="flex items-center space-x-4">
                    <button
                        onClick={analyzeAudienceInsights}
                        disabled={loading}
                        className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Analyzing...' : 'Refresh Analysis'}
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Settings */}
            <div className="bg-white rounded-lg p-4 mb-6 shadow-sm border border-gray-200">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center space-x-2">
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Timeframe:</span>
                        <select
                            value={settings.timeframe}
                            onChange={(e) => setSettings({...settings, timeframe: e.target.value})}
                            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                        >
                            <option value="7d">Last 7 days</option>
                            <option value="30d">Last 30 days</option>
                            <option value="90d">Last 90 days</option>
                            <option value="180d">Last 6 months</option>
                            <option value="365d">Last year</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                activeTab === tab.id
                                    ? 'bg-white text-purple-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <Icon className="w-4 h-4 mr-2" />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div 
                key={activeTab}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
            >
                {loading ? (
                    <div className="text-center py-12">
                        <RefreshCw className="w-8 h-8 mx-auto mb-4 text-purple-600 animate-spin" />
                        <p className="text-gray-600">Analyzing audience insights...</p>
                    </div>
                ) : (
                    renderActiveTab()
                )}
            </div>
        </div>
    );
};

export default AIAudienceInsights; 