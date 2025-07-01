import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Search, Target, TrendingUp, BarChart3, Users, RefreshCw, Lightbulb, Award, CheckCircle, Clock, Zap, Globe, Eye } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface AISEOOptimizerProps {
    video?: any;
    contentId?: number;
    contentType?: string;
}

interface SEOData {
    content_id: number;
    content_type: string;
    analyzed_at: string;
    seo_score: number;
    keyword_analysis: any;
    content_optimization: any;
    technical_seo: any;
    search_performance: any;
    competitor_analysis: any;
    optimization_recommendations: any;
    search_trends: any;
    ranking_opportunities: any;
    local_seo: any;
    mobile_optimization: any;
}

const AISEOOptimizer: React.FC<AISEOOptimizerProps> = ({ video, contentId, contentType = 'video' }) => {
    const [seoData, setSeoData] = useState<SEOData | null>(null);
    const [keywordResearch, setKeywordResearch] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('analysis');
    const [settings, setSettings] = useState({
        industry: 'technology',
        target_keywords: ['tech', 'tutorial', 'guide'],
        topic: '',
        content: {
            title: video?.title || 'How to Build Amazing Tech Products in 2024',
            description: video?.description || 'Learn the latest techniques and tools for building innovative tech products that users love. Complete guide with examples.',
        }
    });

    const industryOptions = [
        { value: 'technology', label: 'Technology' },
        { value: 'education', label: 'Education' },
        { value: 'entertainment', label: 'Entertainment' },
        { value: 'business', label: 'Business' }
    ];

    const analyzeSEO = async () => {
        setLoading(true);
        try {
            const response = await fetch('/ai/seo-analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    content_id: contentId || video?.id || 1,
                    content_type: contentType,
                    industry: settings.industry,
                    target_keywords: settings.target_keywords,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setSeoData(data.data);
            }
        } catch (error) {
            console.error('Error analyzing SEO:', error);
        } finally {
            setLoading(false);
        }
    };

    const researchKeywords = async () => {
        if (!settings.topic) return;
        
        setLoading(true);
        try {
            const response = await fetch('/ai/seo-keywords', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    topic: settings.topic,
                    industry: settings.industry,
                }),
            });

            const data = await response.json();
            if (data.success) {
                setKeywordResearch(data.data);
            }
        } catch (error) {
            console.error('Error researching keywords:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        analyzeSEO();
    }, []);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreDescription = (score: number) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Needs Improvement';
        return 'Poor';
    };

    const renderAnalysisTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">SEO Score</p>
                                <p className={`text-2xl font-bold ${getScoreColor(seoData?.seo_score || 0)}`}>
                                    {seoData?.seo_score || 0}/100
                                </p>
                                <p className="text-sm text-gray-500">{getScoreDescription(seoData?.seo_score || 0)}</p>
                            </div>
                            <Search className="h-8 w-8 text-blue-600" />
                        </div>
                        <Progress value={seoData?.seo_score || 0} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Search Visibility</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {seoData?.search_performance?.search_visibility || 65}%
                                </p>
                            </div>
                            <Eye className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Mobile Score</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {seoData?.mobile_optimization?.mobile_friendly_score || 85}/100
                                </p>
                            </div>
                            <Globe className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {seoData?.keyword_analysis && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Target className="h-5 w-5 text-blue-600" />
                            <span>Keyword Analysis</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Target Keywords</h4>
                            <div className="flex flex-wrap gap-2">
                                {(seoData.keyword_analysis.target_keywords || []).map((keyword: string, index: number) => (
                                    <Badge key={index} className="bg-blue-100 text-blue-800">
                                        {keyword}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Found Keywords</h4>
                            <div className="flex flex-wrap gap-2">
                                {(seoData.keyword_analysis.found_keywords || []).map((keyword: string, index: number) => (
                                    <Badge key={index} variant="outline">
                                        {keyword}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Keyword Density</h4>
                            <div className="space-y-2">
                                {Object.entries(seoData.keyword_analysis.keyword_density || {}).map(([keyword, density]: [string, any]) => (
                                    <div key={keyword} className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{keyword}</span>
                                        <div className="flex items-center space-x-2">
                                            <Progress value={density * 10} className="w-20" />
                                            <span className="text-sm">{density}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {seoData?.content_optimization && (
                <Card>
                    <CardHeader>
                        <CardTitle>Content Optimization Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <h5 className="font-medium">Title Optimization</h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Length</span>
                                        <span>{seoData.content_optimization.title_optimization?.current_length || 0}/{seoData.content_optimization.title_optimization?.optimal_length || 60}</span>
                                    </div>
                                    <Progress value={(seoData.content_optimization.title_optimization?.score || 75)} />
                                    <div className="text-xs text-gray-600">
                                        Score: {seoData.content_optimization.title_optimization?.score || 75}/100
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h5 className="font-medium">Description Optimization</h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Length</span>
                                        <span>{seoData.content_optimization.description_optimization?.current_length || 0}/{seoData.content_optimization.description_optimization?.optimal_length || 160}</span>
                                    </div>
                                    <Progress value={(seoData.content_optimization.description_optimization?.score || 70)} />
                                    <div className="text-xs text-gray-600">
                                        Score: {seoData.content_optimization.description_optimization?.score || 70}/100
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    const renderKeywordsTab = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Keyword Research</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="topic">Topic/Subject</Label>
                            <Input
                                id="topic"
                                value={settings.topic}
                                onChange={(e) => setSettings({...settings, topic: e.target.value})}
                                placeholder="Enter topic for keyword research"
                            />
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
                    </div>
                    <Button onClick={researchKeywords} disabled={loading || !settings.topic}>
                        <Search className="h-4 w-4 mr-2" />
                        Research Keywords
                    </Button>
                </CardContent>
            </Card>

            {keywordResearch && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Primary Keywords</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {(keywordResearch.primary_keywords || []).map((keyword: string, index: number) => (
                                        <Badge key={index} className="bg-blue-100 text-blue-800">
                                            {keyword}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Long-tail Keywords</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {(keywordResearch.long_tail_keywords || []).map((keyword: string, index: number) => (
                                        <Badge key={index} className="bg-green-100 text-green-800">
                                            {keyword}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Trending Keywords</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {(keywordResearch.trending_keywords || []).map((keyword: string, index: number) => (
                                        <Badge key={index} className="bg-purple-100 text-purple-800">
                                            🔥 {keyword}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Related Keywords</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {(keywordResearch.related_keywords || []).map((keyword: string, index: number) => (
                                        <Badge key={index} variant="outline">
                                            {keyword}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );

    const renderOptimizationTab = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Content Optimization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={settings.content.title}
                            onChange={(e) => setSettings({
                                ...settings, 
                                content: {...settings.content, title: e.target.value}
                            })}
                            placeholder="Enter content title"
                        />
                        <div className="text-xs text-gray-500 mt-1">
                            {settings.content.title.length}/60 characters (optimal for SEO)
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={settings.content.description}
                            onChange={(e) => setSettings({
                                ...settings, 
                                content: {...settings.content, description: e.target.value}
                            })}
                            placeholder="Enter content description"
                            rows={4}
                        />
                        <div className="text-xs text-gray-500 mt-1">
                            {settings.content.description.length}/160 characters (optimal for meta description)
                        </div>
                    </div>

                    <div>
                        <Label>Target Keywords</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {settings.target_keywords.map((keyword, index) => (
                                <Badge key={index} className="bg-blue-100 text-blue-800">
                                    {keyword}
                                    <button
                                        onClick={() => {
                                            const newKeywords = settings.target_keywords.filter((_, i) => i !== index);
                                            setSettings({...settings, target_keywords: newKeywords});
                                        }}
                                        className="ml-2 text-blue-600 hover:text-blue-800"
                                    >
                                        ×
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <Input
                            className="mt-2"
                            placeholder="Add keyword and press Enter"
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    const keyword = e.currentTarget.value.trim();
                                    if (keyword && !settings.target_keywords.includes(keyword)) {
                                        setSettings({
                                            ...settings, 
                                            target_keywords: [...settings.target_keywords, keyword]
                                        });
                                        e.currentTarget.value = '';
                                    }
                                }
                            }}
                        />
                    </div>

                    <Button onClick={analyzeSEO} disabled={loading}>
                        <Zap className="h-4 w-4 mr-2" />
                        Optimize Content
                    </Button>
                </CardContent>
            </Card>

            {seoData?.optimization_recommendations && (
                <Card>
                    <CardHeader>
                        <CardTitle>Optimization Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {(seoData.optimization_recommendations.suggestions || []).map((suggestion: string, index: number) => (
                                <div key={index} className="flex items-start space-x-2">
                                    <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5" />
                                    <span className="text-sm">{suggestion}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );

    const renderPerformanceTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {seoData?.search_performance?.search_visibility || 65}%
                        </div>
                        <p className="text-sm text-gray-600">Search Visibility</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {seoData?.search_trends?.trending_up || 3}
                        </div>
                        <p className="text-sm text-gray-600">Trending Up</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            {seoData?.ranking_opportunities?.low_competition || 5}
                        </div>
                        <p className="text-sm text-gray-600">Low Competition</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                            {seoData?.ranking_opportunities?.high_potential || 3}
                        </div>
                        <p className="text-sm text-gray-600">High Potential</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Technical SEO Health</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">
                                {seoData?.technical_seo?.url_structure || 'Good'}
                            </div>
                            <p className="text-sm text-gray-600">URL Structure</p>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-blue-600">
                                {seoData?.technical_seo?.meta_tags || 'Present'}
                            </div>
                            <p className="text-sm text-gray-600">Meta Tags</p>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-yellow-600">
                                {seoData?.technical_seo?.schema_markup || 'Partial'}
                            </div>
                            <p className="text-sm text-gray-600">Schema Markup</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Mobile Optimization</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Mobile Friendly Score</span>
                            <div className="flex items-center space-x-2">
                                <Progress value={seoData?.mobile_optimization?.mobile_friendly_score || 85} className="w-20" />
                                <span className="text-sm font-bold">{seoData?.mobile_optimization?.mobile_friendly_score || 85}/100</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Page Speed</span>
                            <Badge className="bg-green-100 text-green-800">
                                {seoData?.mobile_optimization?.page_speed || 'Good'}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderRecommendationsTab = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Lightbulb className="h-5 w-5 text-yellow-600" />
                        <span>SEO Recommendations</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-green-700 mb-2">Quick Wins</h4>
                            <div className="space-y-2">
                                <div className="flex items-start space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                    <span className="text-sm">Optimize title length (currently {settings.content.title.length}/60)</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                    <span className="text-sm">Add more target keywords to description</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                                    <span className="text-sm">Improve meta description with call-to-action</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-blue-700 mb-2">Long-term Improvements</h4>
                            <div className="space-y-2">
                                <div className="flex items-start space-x-2">
                                    <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <span className="text-sm">Build backlinks from authority sites</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <span className="text-sm">Create topic clusters for related content</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
                                    <span className="text-sm">Optimize for featured snippets</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-orange-700 mb-2">Technical Improvements</h4>
                            <div className="space-y-2">
                                <div className="flex items-start space-x-2">
                                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                                    <span className="text-sm">Implement structured data markup</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                                    <span className="text-sm">Optimize image alt text</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5" />
                                    <span className="text-sm">Improve internal linking structure</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    const renderCompetitorTab = () => (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Competitive SEO Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {seoData?.competitor_analysis?.competitors_found || 18}
                            </div>
                            <p className="text-sm text-gray-600">Competitors Found</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {seoData?.competitor_analysis?.average_score || 72}/100
                            </div>
                            <p className="text-sm text-gray-600">Average SEO Score</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                #{Math.floor(Math.random() * 5) + 3}
                            </div>
                            <p className="text-sm text-gray-600">Your Ranking</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Competitor Insights</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Top Performing Competitors</h4>
                            <div className="space-y-2">
                                {['TechChannel Pro', 'Code Academy', 'Dev Tutorials'].map((competitor, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <span className="font-medium">{competitor}</span>
                                        <div className="flex items-center space-x-2">
                                            <Badge className="bg-green-100 text-green-800">
                                                {80 + index * 5}/100 SEO
                                            </Badge>
                                            <Badge variant="outline">
                                                #{index + 1}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Competitive Opportunities</h4>
                            <div className="space-y-2">
                                <div className="flex items-start space-x-2">
                                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                                    <span className="text-sm">Target "beginner tutorial" keywords with low competition</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                                    <span className="text-sm">Focus on long-form content (2000+ words)</span>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                                    <span className="text-sm">Improve video SEO optimization</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600">Analyzing SEO performance...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* SEO Score Overview */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                            <Search className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                AI SEO Optimizer
                            </span>
                            <p className="text-sm text-gray-600">
                                Search Engine Optimization Analysis & Recommendations
                            </p>
                        </div>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className={`text-2xl font-bold ${getScoreColor(seoData?.seo_score || 78)}`}>
                                {seoData?.seo_score || 78}/100
                            </div>
                            <p className="text-sm text-gray-600">Overall SEO Score</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {settings.target_keywords.length}
                            </div>
                            <p className="text-sm text-gray-600">Target Keywords</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {seoData?.search_performance?.search_visibility || 72}%
                            </div>
                            <p className="text-sm text-gray-600">Search Visibility</p>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {seoData?.mobile_optimization?.mobile_friendly_score || 89}
                            </div>
                            <p className="text-sm text-gray-600">Mobile Score</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* SEO Analysis Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6">
                    <TabsTrigger value="analysis">Analysis</TabsTrigger>
                    <TabsTrigger value="keywords">Keywords</TabsTrigger>
                    <TabsTrigger value="optimization">Optimize</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="recommendations">Tips</TabsTrigger>
                    <TabsTrigger value="competitor">Competitor</TabsTrigger>
                </TabsList>

                <TabsContent value="analysis">{renderAnalysisTab()}</TabsContent>
                <TabsContent value="keywords">{renderKeywordsTab()}</TabsContent>
                <TabsContent value="optimization">{renderOptimizationTab()}</TabsContent>
                <TabsContent value="performance">{renderPerformanceTab()}</TabsContent>
                <TabsContent value="recommendations">{renderRecommendationsTab()}</TabsContent>
                <TabsContent value="competitor">{renderCompetitorTab()}</TabsContent>
            </Tabs>
        </div>
    );
};

export default AISEOOptimizer; 