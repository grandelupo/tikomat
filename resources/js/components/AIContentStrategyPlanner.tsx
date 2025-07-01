import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, Target, Users, BarChart3, Shield, RefreshCw, Lightbulb, Award, CheckCircle, Clock, Zap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface AIContentStrategyPlannerProps {
    video?: any;
}

interface StrategyData {
    user_id: number;
    generated_at: string;
    timeframe: string;
    industry: string;
    platforms: string[];
    goals: string[];
    strategic_overview: any;
    content_pillars: any;
    competitive_analysis: any;
    content_calendar_strategy: any;
    platform_strategies: any;
    kpi_framework: any;
    growth_roadmap: any;
    risk_analysis: any;
    budget_recommendations: any;
    success_metrics: any;
    strategy_score: number;
    confidence_level: string;
}

const AIContentStrategyPlanner: React.FC<AIContentStrategyPlannerProps> = ({ video }) => {
    const [strategyData, setStrategyData] = useState<StrategyData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [settings, setSettings] = useState({
        timeframe: '90d',
        industry: 'technology',
        platforms: ['youtube', 'instagram', 'tiktok'],
        goals: ['growth', 'engagement']
    });

    const platformIcons = {
        youtube: '🎥',
        instagram: '📸',
        tiktok: '🎵',
        facebook: '👥',
        x: '𝕏',
        snapchat: '👻',
        pinterest: '📌'
    };

    const industryOptions = [
        { value: 'technology', label: 'Technology' },
        { value: 'education', label: 'Education' },
        { value: 'entertainment', label: 'Entertainment' },
        { value: 'business', label: 'Business' }
    ];

    const goalOptions = [
        { value: 'growth', label: 'Audience Growth' },
        { value: 'engagement', label: 'Engagement' },
        { value: 'revenue', label: 'Revenue' },
        { value: 'brand', label: 'Brand Awareness' }
    ];

    const generateStrategy = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/ai/strategy-generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(settings),
            });

            // Check if response is ok before parsing JSON
            if (!response.ok) {
                const errorText = await response.text();
                console.error('API Error Response:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            if (data.success) {
                setStrategyData(data.data);
            } else {
                throw new Error(data.message || 'Failed to generate strategy');
            }
        } catch (error) {
            console.error('Error generating strategy:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
            setError(`Failed to generate strategy: ${errorMessage}`);
            
            // Set a default strategy structure to prevent UI errors
            setStrategyData({
                user_id: 0,
                generated_at: new Date().toISOString(),
                timeframe: settings.timeframe,
                industry: settings.industry,
                platforms: settings.platforms,
                goals: settings.goals,
                strategic_overview: null,
                content_pillars: null,
                competitive_analysis: null,
                content_calendar_strategy: null,
                platform_strategies: null,
                kpi_framework: null,
                growth_roadmap: null,
                risk_analysis: null,
                budget_recommendations: null,
                success_metrics: null,
                strategy_score: 0,
                confidence_level: 'low',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        generateStrategy();
    }, []);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getConfidenceColor = (confidence: string) => {
        switch (confidence) {
            case 'high': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-red-100 text-red-800';
        }
    };

    const renderOverviewTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Strategy Score</p>
                                <p className={`text-2xl font-bold ${getScoreColor(strategyData?.strategy_score || 0)}`}>
                                    {strategyData?.strategy_score || 0}/100
                                </p>
                            </div>
                            <Target className="h-8 w-8 text-blue-600" />
                        </div>
                        <Progress value={strategyData?.strategy_score || 0} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Confidence Level</p>
                                <Badge className={`mt-1 ${getConfidenceColor(strategyData?.confidence_level || 'low')}`}>
                                    {strategyData?.confidence_level || 'Low'}
                                </Badge>
                            </div>
                            <Shield className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Platforms</p>
                                <div className="flex space-x-1 mt-1">
                                    {(strategyData?.platforms || []).map((platform: string) => (
                                        <span key={platform} className="text-lg">
                                            {platformIcons[platform as keyof typeof platformIcons]}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <BarChart3 className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {strategyData?.strategic_overview && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Lightbulb className="h-5 w-5 text-yellow-600" />
                            <span>Strategic Overview</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Mission Statement</h4>
                            <p className="text-gray-700">{strategyData.strategic_overview.mission_statement}</p>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Target Audience</h4>
                            <div className="space-y-2">
                                <p><strong>Primary:</strong> {strategyData.strategic_overview.target_audience?.primary}</p>
                                <p><strong>Secondary:</strong> {strategyData.strategic_overview.target_audience?.secondary}</p>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {(strategyData.strategic_overview.target_audience?.characteristics || []).map((char: string, index: number) => (
                                        <Badge key={index} variant="outline">{char.replace('_', ' ')}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    const renderPillarsTab = () => (
        <div className="space-y-6">
            {strategyData?.content_pillars && Object.entries(strategyData.content_pillars).map(([pillarId, pillar]: [string, any]) => (
                <Card key={pillarId}>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="capitalize">{pillar.name}</span>
                            <Badge variant="secondary">{pillar.recommended_percentage}%</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-gray-700">{pillar.description}</p>
                        
                        <div>
                            <h5 className="font-medium mb-2">Content Ideas</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {(pillar.content_ideas || []).map((idea: string, index: number) => (
                                    <Badge key={index} variant="outline" className="text-center">
                                        {idea}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h5 className="font-medium mb-2">Examples</h5>
                            <div className="flex flex-wrap gap-2">
                                {(pillar.examples || []).map((example: string, index: number) => (
                                    <Badge key={index} className="bg-blue-100 text-blue-800">
                                        {example}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <TrendingUp className="h-4 w-4 text-green-600" />
                                <span className="text-sm">Engagement Multiplier: {pillar.engagement_multiplier}x</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    const renderCompetitiveTab = () => (
        <div className="space-y-6">
            {strategyData?.competitive_analysis?.market_landscape && (
                <Card>
                    <CardHeader>
                        <CardTitle>Market Landscape</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <p className="text-2xl font-bold text-blue-600">
                                    {strategyData.competitive_analysis.market_landscape.total_competitors}
                                </p>
                                <p className="text-sm text-gray-600">Total Competitors</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-green-400">
                                    {strategyData.competitive_analysis.market_landscape.active_competitors}
                                </p>
                                <p className="text-sm text-gray-600">Active Competitors</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-yellow-600 capitalize">
                                    {strategyData.competitive_analysis.market_landscape.market_saturation}
                                </p>
                                <p className="text-sm text-gray-600">Market Saturation</p>
                            </div>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-purple-600">
                                    {strategyData.competitive_analysis.market_landscape.growth_rate}
                                </p>
                                <p className="text-sm text-gray-600">Growth Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {strategyData?.competitive_analysis?.competitor_profiles && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(strategyData.competitive_analysis.competitor_profiles).map(([type, profile]: [string, any]) => (
                        <Card key={type}>
                            <CardHeader>
                                <CardTitle className="capitalize">{type.replace('_', ' ')}</CardTitle>
                                <div className="flex space-x-2">
                                    <Badge variant="outline">{profile.market_share} market share</Badge>
                                    <Badge className={profile.growth_rate.includes('-') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                                        {profile.growth_rate} growth
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <h5 className="font-medium text-green-700 mb-1">Strengths</h5>
                                    <div className="flex flex-wrap gap-1">
                                        {(profile.strengths || []).map((strength: string, index: number) => (
                                            <Badge key={index} className="bg-green-100 text-green-800 text-xs">
                                                {strength.replace('_', ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h5 className="font-medium text-red-700 mb-1">Weaknesses</h5>
                                    <div className="flex flex-wrap gap-1">
                                        {(profile.weaknesses || []).map((weakness: string, index: number) => (
                                            <Badge key={index} className="bg-red-100 text-red-800 text-xs">
                                                {weakness.replace('_', ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h5 className="font-medium text-blue-700 mb-1">Opportunities</h5>
                                    <div className="flex flex-wrap gap-1">
                                        {(profile.opportunities || []).map((opportunity: string, index: number) => (
                                            <Badge key={index} className="bg-blue-100 text-blue-800 text-xs">
                                                {opportunity.replace('_', ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );

    const renderRoadmapTab = () => (
        <div className="space-y-6">
            {strategyData?.growth_roadmap?.growth_phases && (
                <div className="space-y-4">
                    {Object.entries(strategyData.growth_roadmap.growth_phases).map(([phase, data]: [string, any], index) => (
                        <Card key={phase} className="relative">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-3">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold">
                                        {index + 1}
                                    </div>
                                    <span className="capitalize">{phase}</span>
                                    <Badge variant="outline">{data.duration}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h5 className="font-medium mb-2">Objectives</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {(data.objectives || []).map((objective: string, idx: number) => (
                                            <Badge key={idx} className="bg-blue-100 text-blue-800">
                                                {objective.replace('_', ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h5 className="font-medium mb-2">Key Activities</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {(data.key_activities || []).map((activity: string, idx: number) => (
                                            <Badge key={idx} variant="outline">
                                                {activity.replace('_', ' ')}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h5 className="font-medium mb-2">Milestones</h5>
                                    <div className="space-y-2">
                                        {(data.milestones || []).map((milestone: string, idx: number) => (
                                            <div key={idx} className="flex items-center space-x-2">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                                <span className="text-sm">{milestone.replace('_', ' ')}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );

    const renderKPITab = () => (
        <div className="space-y-6">
            {strategyData?.success_metrics && (
                <Card>
                    <CardHeader>
                        <CardTitle>Success Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h5 className="font-medium mb-3">Primary Metrics</h5>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {Object.entries(strategyData.success_metrics.primary_metrics || {}).map(([metric, target]: [string, any]) => (
                                    <div key={metric} className="text-center p-3 bg-blue-950/20 rounded-lg">
                                        <p className="text-sm font-medium text-gray-600 mb-1">
                                            {metric.replace('_', ' ').toUpperCase()}
                                        </p>
                                        <p className="text-lg font-bold text-blue-600">{target}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h5 className="font-medium mb-3">Milestone Targets</h5>
                            <div className="space-y-3">
                                {Object.entries(strategyData.success_metrics.milestone_targets || {}).map(([timeframe, targets]: [string, any]) => (
                                    <div key={timeframe} className="flex items-center space-x-4 p-3 bg-muted rounded-lg">
                                        <div className="flex items-center space-x-2">
                                            <Clock className="h-4 w-4 text-gray-600" />
                                            <span className="font-medium">{timeframe.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {(targets || []).map((target: string, idx: number) => (
                                                <Badge key={idx} variant="outline">{target}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {strategyData?.budget_recommendations && (
                <Card>
                    <CardHeader>
                        <CardTitle>Budget Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                                                        <div className="text-center p-4 bg-green-950/20 rounded-lg">
                                                          <p className="text-sm text-muted-foreground">Recommended Monthly Budget</p>
                            <p className="text-2xl font-bold text-green-600">
                                {strategyData.budget_recommendations.monthly_budget_range}
                            </p>
                        </div>

                        <div>
                            <h5 className="font-medium mb-3">Budget Allocation</h5>
                            <div className="space-y-2">
                                {Object.entries(strategyData.budget_recommendations.allocation_breakdown || {}).map(([category, percentage]: [string, any]) => (
                                    <div key={category} className="flex items-center justify-between">
                                        <span className="text-sm capitalize">{category.replace('_', ' ')}</span>
                                        <div className="flex items-center space-x-2">
                                            <Progress value={percentage} className="w-20" />
                                            <span className="text-sm font-medium">{percentage}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    const renderRiskTab = () => (
        <div className="space-y-6">
            {strategyData?.risk_analysis && (
                <>
                    {['market_risks', 'operational_risks', 'platform_risks'].map((riskType) => (
                        <Card key={riskType}>
                            <CardHeader>
                                <CardTitle className="capitalize flex items-center space-x-2">
                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                    <span>{riskType.replace('_', ' ')}</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {Object.entries(strategyData.risk_analysis[riskType] || {}).map(([risk, details]: [string, any]) => (
                                        <div key={risk} className="p-3 border rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <h5 className="font-medium capitalize">{risk.replace('_', ' ')}</h5>
                                                <div className="flex space-x-2">
                                                    <Badge className={`${
                                                        details.probability === 'high' ? 'bg-red-100 text-red-800' :
                                                        details.probability === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {details.probability} probability
                                                    </Badge>
                                                    <Badge className={`${
                                                        details.impact === 'high' ? 'bg-red-100 text-red-800' :
                                                        details.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-green-100 text-green-800'
                                                    }`}>
                                                        {details.impact} impact
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Shield className="h-4 w-4 text-blue-600" />
                                                <span className="text-sm text-gray-700">
                                                    Mitigation: {details.mitigation.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </>
            )}
        </div>
    );

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Generating comprehensive content strategy...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Settings Panel */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <span>Strategy Configuration</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <Label htmlFor="timeframe">Timeframe</Label>
                            <Select value={settings.timeframe} onValueChange={(value) => setSettings({...settings, timeframe: value})}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="30d">30 Days</SelectItem>
                                    <SelectItem value="90d">90 Days</SelectItem>
                                    <SelectItem value="180d">6 Months</SelectItem>
                                    <SelectItem value="365d">1 Year</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label htmlFor="industry">Industry</Label>
                            <Select value={settings.industry} onValueChange={(value) => setSettings({...settings, industry: value})}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {industryOptions.map(option => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Platforms</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                                {Object.keys(platformIcons).map(platform => (
                                    <label key={platform} className="flex items-center space-x-1 cursor-pointer">
                                        <Checkbox
                                            checked={settings.platforms.includes(platform)}
                                            onCheckedChange={(checked) => {
                                                if (checked) {
                                                    setSettings({...settings, platforms: [...settings.platforms, platform]});
                                                } else {
                                                    setSettings({...settings, platforms: settings.platforms.filter(p => p !== platform)});
                                                }
                                            }}
                                        />
                                        <span className="text-sm">{platformIcons[platform as keyof typeof platformIcons]} {platform}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-end">
                            <Button onClick={generateStrategy} disabled={loading} className="w-full">
                                <Zap className="h-4 w-4 mr-2" />
                                Generate Strategy
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
                <Card>
                    <CardContent className="py-6">
                        <div className="flex items-center space-x-3 text-red-600">
                            <AlertCircle className="h-5 w-5" />
                            <div>
                                <p className="font-medium">Error</p>
                                <p className="text-sm text-red-500">{error}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Strategy Results */}
            {strategyData && (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="pillars">Pillars</TabsTrigger>
                        <TabsTrigger value="competitive">Competitive</TabsTrigger>
                        <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
                        <TabsTrigger value="kpis">KPIs</TabsTrigger>
                        <TabsTrigger value="risks">Risks</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview">{renderOverviewTab()}</TabsContent>
                    <TabsContent value="pillars">{renderPillarsTab()}</TabsContent>
                    <TabsContent value="competitive">{renderCompetitiveTab()}</TabsContent>
                    <TabsContent value="roadmap">{renderRoadmapTab()}</TabsContent>
                    <TabsContent value="kpis">{renderKPITab()}</TabsContent>
                    <TabsContent value="risks">{renderRiskTab()}</TabsContent>
                </Tabs>
            )}
        </div>
    );
};

export default AIContentStrategyPlanner; 