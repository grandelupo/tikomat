import React, { useState, useEffect } from 'react';
import { 
    Users, TrendingUp, Target, Eye, Heart, MessageCircle, Share2, 
    Globe, Clock, Smartphone, Monitor, Tablet, MapPin, 
    DollarSign, GraduationCap, Star, ThumbsUp, BarChart3,
    ArrowUp, ArrowDown, Settings, Calendar, User, 
    Zap, CheckCircle, AlertTriangle, RefreshCw
} from 'lucide-react';

interface AudienceInsightsProps {
    videoId?: number;
    onClose?: () => void;
}

interface InsightData {
    user_id: number;
    analysis_timestamp: string;
    timeframe: string;
    platforms: string[];
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

    const renderOverviewTab = () => (
        <div className="space-y-6">
            {/* Health Score */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Audience Health Score</h3>
                        <div className="text-3xl font-bold">{insights?.audience_health_score || 0}/100</div>
                        <p className="text-purple-100 text-sm mt-1">
                            {insights?.insights_confidence === 'high' ? 'High Confidence' : 'Moderate Confidence'} Analysis
                        </p>
                    </div>
                    <div className="text-6xl opacity-20">
                        <Users />
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Average Engagement Rate</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {insights?.engagement_insights?.overall_metrics?.average_engagement_rate || 0}%
                            </p>
                            <p className="text-sm text-green-600 flex items-center mt-1">
                                <ArrowUp className="w-4 h-4 mr-1" />
                                {insights?.engagement_insights?.overall_metrics?.engagement_trend || '+12%'}
                            </p>
                        </div>
                        <Heart className="w-8 h-8 text-red-500" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Audience Segments</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {Object.keys(insights?.audience_segments || {}).length}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Active segments</p>
                        </div>
                        <Target className="w-8 h-8 text-blue-500" />
                    </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Platform Coverage</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {settings.platforms.length}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Platforms analyzed</p>
                        </div>
                        <Globe className="w-8 h-8 text-green-500" />
                    </div>
                </div>
            </div>

            {/* Top Performing Content */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Top Performing Content Type</h3>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-lg font-semibold text-gray-900">
                                {insights?.engagement_insights?.overall_metrics?.top_performing_content_type || 'Educational Tutorials'}
                            </p>
                            <p className="text-sm text-gray-600">Highest engagement content category</p>
                        </div>
                        <div className="text-2xl">🎯</div>
                    </div>
                </div>
            </div>

            {/* Platform Distribution */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Platform Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {settings.platforms.map((platform) => (
                        <div key={platform} className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <span className="text-2xl mr-3">{platformIcons[platform as keyof typeof platformIcons]}</span>
                            <div>
                                <p className="font-medium capitalize">{platform}</p>
                                <p className="text-sm text-gray-600">Active</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderDemographicsTab = () => (
        <div className="space-y-6">
            {/* Age Distribution */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Age Distribution</h3>
                <div className="space-y-3">
                    {Object.entries(insights?.demographic_breakdown?.overall?.age_distribution || {
                        '18-24': 25, '25-34': 35, '35-44': 20, '45-54': 15, '55+': 5
                    }).map(([ageGroup, percentage]) => (
                        <div key={ageGroup} className="flex items-center">
                            <div className="w-16 text-sm font-medium">{ageGroup}</div>
                            <div className="flex-1 mx-4">
                                <div className="bg-gray-200 rounded-full h-2">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                            </div>
                            <div className="w-12 text-sm text-gray-600">{percentage}%</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Gender Distribution */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Gender Distribution</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl mb-2">👨</div>
                        <div className="text-2xl font-bold text-blue-600">52%</div>
                        <div className="text-sm text-gray-600">Male</div>
                    </div>
                    <div className="text-center p-4 bg-pink-50 rounded-lg">
                        <div className="text-2xl mb-2">👩</div>
                        <div className="text-2xl font-bold text-pink-600">48%</div>
                        <div className="text-sm text-gray-600">Female</div>
                    </div>
                </div>
            </div>

            {/* Geographic Distribution */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Geographic Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries({
                        'North America': 45,
                        'Europe': 25,
                        'Asia': 20,
                        'Other': 10
                    }).map(([region, percentage]) => (
                        <div key={region} className="text-center p-4 bg-gray-50 rounded-lg">
                            <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                            <div className="text-lg font-bold text-gray-900">{percentage}%</div>
                            <div className="text-sm text-gray-600">{region}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Device Usage */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Device Usage</h3>
                <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <Smartphone className="w-8 h-8 mx-auto mb-2 text-green-600" />
                        <div className="text-xl font-bold text-green-600">70%</div>
                        <div className="text-sm text-gray-600">Mobile</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Monitor className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                        <div className="text-xl font-bold text-blue-600">25%</div>
                        <div className="text-sm text-gray-600">Desktop</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Tablet className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                        <div className="text-xl font-bold text-purple-600">5%</div>
                        <div className="text-sm text-gray-600">Tablet</div>
                    </div>
                </div>
            </div>

            {/* Income & Education */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Income Levels</h3>
                    <div className="space-y-3">
                        {Object.entries({
                            'Under $30k': 15,
                            '$30k-$50k': 25,
                            '$50k-$75k': 30,
                            '$75k-$100k': 20,
                            'Over $100k': 10
                        }).map(([range, percentage]) => (
                            <div key={range} className="flex items-center justify-between">
                                <span className="text-sm">{range}</span>
                                <div className="flex items-center">
                                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                        <div 
                                            className="bg-green-500 h-2 rounded-full"
                                            style={{ width: `${percentage * 3}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium">{percentage}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Education Levels</h3>
                    <div className="space-y-3">
                        {Object.entries({
                            'High School': 20,
                            'Some College': 25,
                            'Bachelor\'s Degree': 35,
                            'Graduate Degree': 20
                        }).map(([level, percentage]) => (
                            <div key={level} className="flex items-center justify-between">
                                <span className="text-sm">{level}</span>
                                <div className="flex items-center">
                                    <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                                        <div 
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{ width: `${percentage * 3}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-medium">{percentage}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSegmentsTab = () => (
        <div className="space-y-6">
            {Object.entries(insights?.audience_segments || {
                power_users: { name: 'Power Users', size_percentage: 15, value_score: 95, engagement_rate: 15.5 },
                casual_viewers: { name: 'Casual Viewers', size_percentage: 45, value_score: 70, engagement_rate: 8.2 },
                lurkers: { name: 'Lurkers', size_percentage: 25, value_score: 40, engagement_rate: 2.1 },
                new_discoverers: { name: 'New Discoverers', size_percentage: 15, value_score: 60, engagement_rate: 6.8 }
            }).map(([segmentId, segment]: [string, any]) => (
                <div key={segmentId} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold">{segment.name}</h3>
                            <p className="text-sm text-gray-600">{segment.description || 'Active audience segment'}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-purple-600">{segment.size_percentage}%</div>
                            <div className="text-sm text-gray-500">of audience</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <Star className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                            <div className="text-lg font-bold text-blue-600">{segment.value_score}</div>
                            <div className="text-xs text-gray-600">Value Score</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                            <Heart className="w-5 h-5 mx-auto mb-1 text-green-600" />
                            <div className="text-lg font-bold text-green-600">{segment.engagement_rate}%</div>
                            <div className="text-xs text-gray-600">Engagement</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                            <div className="text-lg font-bold text-purple-600">{segment.growth_potential || 'High'}</div>
                            <div className="text-xs text-gray-600">Growth</div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Content Preferences</h4>
                            <div className="flex flex-wrap gap-2">
                                {(segment.content_preferences || ['engaging_content', 'interactive_posts']).map((pref: string) => (
                                    <span key={pref} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                                        {pref.replace('_', ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-medium text-sm text-gray-700 mb-2">Recommended Strategies</h4>
                            <div className="space-y-1">
                                {(segment.recommended_strategies || ['Increase engagement', 'Personalize content']).slice(0, 3).map((strategy: string, index: number) => (
                                    <div key={index} className="flex items-center text-sm text-gray-600">
                                        <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                                        {strategy}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderBehaviorTab = () => (
        <div className="space-y-6">
            {/* Session Duration */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Session Duration</h3>
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <div className="text-3xl font-bold text-blue-600">8:45</div>
                        <div className="text-sm text-gray-600">Average Duration</div>
                    </div>
                    <div>
                        <div className="text-3xl font-bold text-green-600">6:30</div>
                        <div className="text-sm text-gray-600">Median Duration</div>
                    </div>
                </div>
                
                <div className="mt-4">
                    <h4 className="font-medium mb-3">Duration Distribution</h4>
                    <div className="space-y-2">
                        {Object.entries({
                            '0-2min': 25,
                            '2-5min': 30,
                            '5-15min': 25,
                            '15-30min': 15,
                            '30min+': 5
                        }).map(([duration, percentage]) => (
                            <div key={duration} className="flex items-center">
                                <div className="w-20 text-sm">{duration}</div>
                                <div className="flex-1 mx-3">
                                    <div className="bg-gray-200 rounded-full h-2">
                                        <div 
                                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                                            style={{ width: `${percentage * 2}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="w-10 text-sm text-gray-600">{percentage}%</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Peak Activity Times */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Peak Activity Times</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-medium mb-3 flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Weekdays
                        </h4>
                        <div className="space-y-2">
                            {['12:00-13:00', '19:00-21:00', '22:00-23:00'].map((time, index) => (
                                <div key={time} className="flex items-center p-2 bg-blue-50 rounded-lg">
                                    <Clock className="w-4 h-4 mr-2 text-blue-600" />
                                    <span className="text-sm font-medium">{time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-medium mb-3 flex items-center">
                            <Calendar className="w-4 h-4 mr-2" />
                            Weekends
                        </h4>
                        <div className="space-y-2">
                            {['10:00-12:00', '15:00-17:00', '20:00-22:00'].map((time, index) => (
                                <div key={time} className="flex items-center p-2 bg-green-50 rounded-lg">
                                    <Clock className="w-4 h-4 mr-2 text-green-600" />
                                    <span className="text-sm font-medium">{time}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Engagement Behaviors */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Engagement Behaviors</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                        <Heart className="w-8 h-8 mx-auto mb-2 text-red-500" />
                        <div className="text-lg font-bold text-red-600">7.0%</div>
                        <div className="text-sm text-gray-600">Like Rate</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                        <div className="text-lg font-bold text-blue-600">1.68%</div>
                        <div className="text-sm text-gray-600">Comment Rate</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <Share2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                        <div className="text-lg font-bold text-green-600">0.84%</div>
                        <div className="text-sm text-gray-600">Share Rate</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <Star className="w-8 h-8 mx-auto mb-2 text-purple-500" />
                        <div className="text-lg font-bold text-purple-600">2.52%</div>
                        <div className="text-sm text-gray-600">Save Rate</div>
                    </div>
                </div>
            </div>

            {/* Content Discovery */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Content Discovery Methods</h3>
                <div className="space-y-3">
                    {Object.entries({
                        'Recommendations': 40,
                        'Search': 35,
                        'Social Shares': 15,
                        'Direct Access': 10
                    }).map(([method, percentage]) => (
                        <div key={method} className="flex items-center">
                            <div className="w-24 text-sm font-medium">{method}</div>
                            <div className="flex-1 mx-4">
                                <div className="bg-gray-200 rounded-full h-3">
                                    <div 
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                                        style={{ width: `${percentage * 2}%` }}
                                    />
                                </div>
                            </div>
                            <div className="w-12 text-sm text-gray-600">{percentage}%</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderGrowthTab = () => (
        <div className="space-y-6">
            {/* Audience Expansion Opportunities */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Audience Expansion Opportunities</h3>
                <div className="space-y-4">
                    {[
                        { demographic: '45-54 age group', potential: 'high', strategy: 'Professional development content' },
                        { demographic: 'International audience', potential: 'medium', strategy: 'Subtitles and localization' },
                        { demographic: 'Mobile-first users', potential: 'high', strategy: 'Vertical video format' }
                    ].map((opportunity, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                                <div className="font-medium">{opportunity.demographic}</div>
                                <div className="text-sm text-gray-600">{opportunity.strategy}</div>
                            </div>
                            <div className="ml-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    opportunity.potential === 'high' 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {opportunity.potential} potential
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Geographic Expansion */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Geographic Expansion</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {['Europe', 'Asia-Pacific', 'Latin America'].map((region) => (
                        <div key={region} className="p-4 bg-blue-50 rounded-lg text-center">
                            <Globe className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                            <div className="font-medium">{region}</div>
                            <div className="text-sm text-gray-600 mt-1">Target Region</div>
                            <div className="text-xs text-blue-600 mt-2">+35% potential reach</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Gaps */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Content Gap Analysis</h3>
                <div className="space-y-3">
                    {[
                        { gap: 'Beginner tutorials', status: 'High demand, low supply', priority: 'high' },
                        { gap: 'Quick reference guides', status: 'Growing interest', priority: 'medium' },
                        { gap: 'Community challenges', status: 'Engagement booster opportunity', priority: 'medium' }
                    ].map((gap, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div>
                                <div className="font-medium">{gap.gap}</div>
                                <div className="text-sm text-gray-600">{gap.status}</div>
                            </div>
                            <div className="flex items-center">
                                <AlertTriangle className={`w-5 h-5 mr-2 ${
                                    gap.priority === 'high' ? 'text-red-500' : 'text-yellow-500'
                                }`} />
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    gap.priority === 'high' 
                                        ? 'bg-red-100 text-red-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                    {gap.priority} priority
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Platform Opportunities */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Platform Optimization</h3>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium">TikTok Opportunity</h4>
                            <p className="text-sm text-gray-600">Young audience growth potential</p>
                            <p className="text-sm text-purple-600 font-medium mt-1">
                                Recommended: Short-form content adaptation
                            </p>
                        </div>
                        <div className="text-2xl">🎵</div>
                    </div>
                    <div className="mt-3 text-sm text-gray-700">
                        <strong>Potential Impact:</strong> +50% reach in 18-24 demographic
                    </div>
                </div>
            </div>
        </div>
    );

    const renderPersonalizationTab = () => (
        <div className="space-y-6">
            {/* Content Personalization by Segment */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Content Personalization Strategies</h3>
                <div className="space-y-4">
                    {[
                        {
                            segment: 'Power Users',
                            content: 'Advanced tutorials, exclusive content',
                            frequency: 'Daily updates',
                            style: 'Direct community interaction'
                        },
                        {
                            segment: 'Casual Viewers',
                            content: 'Quick tips, beginner guides',
                            frequency: '2-3 times per week',
                            style: 'Easy-to-consume formats'
                        },
                        {
                            segment: 'New Discoverers',
                            content: 'Best of compilations, introductory series',
                            frequency: 'Consistent schedule',
                            style: 'Welcome sequences, onboarding'
                        }
                    ].map((strategy, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center mb-3">
                                <Target className="w-5 h-5 mr-2 text-purple-600" />
                                <h4 className="font-medium">{strategy.segment}</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Content:</span>
                                    <p className="font-medium">{strategy.content}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Frequency:</span>
                                    <p className="font-medium">{strategy.frequency}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Style:</span>
                                    <p className="font-medium">{strategy.style}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Platform-Specific Strategies */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Platform-Specific Strategies</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        {
                            platform: 'YouTube',
                            icon: '🎬',
                            length: '8-12 minutes',
                            style: 'Educational deep-dives',
                            strategy: 'High contrast with text overlays'
                        },
                        {
                            platform: 'Instagram',
                            icon: '📸',
                            length: 'Carousel posts',
                            style: 'Behind-the-scenes, quick wins',
                            strategy: 'Daily tips and polls'
                        },
                        {
                            platform: 'TikTok',
                            icon: '🎵',
                            length: '15-30 seconds',
                            style: 'Quick tutorials, trends',
                            strategy: 'Mix trending and niche tags'
                        }
                    ].map((platform, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center mb-3">
                                <span className="text-2xl mr-2">{platform.icon}</span>
                                <h4 className="font-medium">{platform.platform}</h4>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-gray-600">Optimal:</span>
                                    <p className="font-medium">{platform.length}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Style:</span>
                                    <p className="font-medium">{platform.style}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Strategy:</span>
                                    <p className="font-medium">{platform.strategy}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Timing Optimization */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Timing Optimization</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <Calendar className="w-6 h-6 mb-2 text-blue-600" />
                        <h4 className="font-medium mb-2">Weekday Strategy</h4>
                        <p className="text-sm text-gray-600">Professional content during lunch hours</p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                        <Calendar className="w-6 h-6 mb-2 text-green-600" />
                        <h4 className="font-medium mb-2">Weekend Strategy</h4>
                        <p className="text-sm text-gray-600">Casual, entertainment-focused content</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                        <Calendar className="w-6 h-6 mb-2 text-purple-600" />
                        <h4 className="font-medium mb-2">Seasonal Adjustments</h4>
                        <p className="text-sm text-gray-600">Back-to-school, New Year themes</p>
                    </div>
                </div>
            </div>

            {/* Engagement Tactics */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold mb-4">Engagement Tactics</h3>
                <div className="space-y-4">
                    {[
                        {
                            tactic: 'Call-to-Action Optimization',
                            description: 'Specific, actionable requests',
                            icon: <Zap className="w-5 h-5 text-yellow-500" />
                        },
                        {
                            tactic: 'Community Building',
                            description: 'Regular Q&A sessions, polls',
                            icon: <Users className="w-5 h-5 text-blue-500" />
                        },
                        {
                            tactic: 'User Generated Content',
                            description: 'Challenges, showcases',
                            icon: <Star className="w-5 h-5 text-purple-500" />
                        }
                    ].map((tactic, index) => (
                        <div key={index} className="flex items-center p-4 bg-gray-50 rounded-lg">
                            <div className="mr-4">{tactic.icon}</div>
                            <div>
                                <h4 className="font-medium">{tactic.tactic}</h4>
                                <p className="text-sm text-gray-600">{tactic.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

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
                    <p className="text-gray-600">Deep audience analysis and personalization recommendations</p>
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
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Settings className="w-5 h-5 text-gray-500" />
                        <span className="font-medium">Analysis Settings</span>
                    </div>
                    <div className="flex items-center space-x-6">
                        <div>
                            <label className="text-sm text-gray-600">Timeframe</label>
                            <select
                                value={settings.timeframe}
                                onChange={(e) => setSettings(prev => ({ ...prev, timeframe: e.target.value }))}
                                className="ml-2 px-3 py-1 border border-gray-300 rounded-md text-sm"
                            >
                                <option value="7d">7 days</option>
                                <option value="30d">30 days</option>
                                <option value="90d">90 days</option>
                                <option value="180d">180 days</option>
                                <option value="365d">1 year</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Platforms</label>
                            <span className="ml-2 text-sm font-medium">{settings.platforms.length} selected</span>
                        </div>
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