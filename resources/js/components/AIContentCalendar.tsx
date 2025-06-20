import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
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
    Brain
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ContentIdea {
    id: string;
    title: string;
    description: string;
    type: 'video' | 'post' | 'story';
    category: string;
    optimal_time: string;
    predicted_engagement: number;
    trending_score: number;
    difficulty: 'easy' | 'medium' | 'hard';
    platforms: string[];
    tags: string[];
    status: 'suggested' | 'planned' | 'created' | 'published';
}

interface CalendarData {
    content_ideas: ContentIdea[];
    optimal_schedule: {
        monday: string[];
        tuesday: string[];
        wednesday: string[];
        thursday: string[];
        friday: string[];
        saturday: string[];
        sunday: string[];
    };
    performance_insights: {
        best_posting_times: string[];
        trending_topics: string[];
        content_gaps: string[];
        seasonal_opportunities: string[];
    };
    monthly_goals: {
        target_posts: number;
        target_engagement: number;
        content_variety: Record<string, number>;
    };
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
                    preferences: {
                        platforms: ['youtube', 'instagram', 'tiktok'],
                        content_types: ['video', 'post', 'story'],
                        posting_frequency: 'daily',
                        focus_areas: ['entertainment', 'education', 'lifestyle']
                    }
                }),
            });

            const data = await response.json();

            if (data.success) {
                setCalendarData(data.data);
                toast({
                    title: "Calendar Generated! 📅",
                    description: "Your AI-powered content calendar is ready with personalized suggestions.",
                });
            } else {
                throw new Error(data.message || 'Failed to generate calendar');
            }
        } catch (error) {
            console.error('Calendar generation error:', error);
            // Set mock data for demonstration
            setCalendarData({
                content_ideas: [
                    {
                        id: '1',
                        title: 'Morning Routine Tips',
                        description: 'Share your daily morning routine with productivity tips',
                        type: 'video',
                        category: 'lifestyle',
                        optimal_time: '08:00',
                        predicted_engagement: 85,
                        trending_score: 92,
                        difficulty: 'easy',
                        platforms: ['youtube', 'instagram'],
                        tags: ['morning', 'productivity', 'routine'],
                        status: 'suggested'
                    },
                    {
                        id: '2',
                        title: 'Behind the Scenes',
                        description: 'Show your content creation process',
                        type: 'story',
                        category: 'entertainment',
                        optimal_time: '19:00',
                        predicted_engagement: 78,
                        trending_score: 85,
                        difficulty: 'medium',
                        platforms: ['instagram', 'tiktok'],
                        tags: ['bts', 'creation', 'process'],
                        status: 'suggested'
                    },
                    {
                        id: '3',
                        title: 'Tutorial: Video Editing',
                        description: 'Step-by-step guide to video editing techniques',
                        type: 'video',
                        category: 'education',
                        optimal_time: '15:00',
                        predicted_engagement: 91,
                        trending_score: 88,
                        difficulty: 'hard',
                        platforms: ['youtube'],
                        tags: ['tutorial', 'editing', 'education'],
                        status: 'suggested'
                    }
                ],
                optimal_schedule: {
                    monday: ['08:00', '19:00'],
                    tuesday: ['09:00', '20:00'],
                    wednesday: ['08:30', '18:30'],
                    thursday: ['09:30', '19:30'],
                    friday: ['08:00', '21:00'],
                    saturday: ['10:00', '20:00'],
                    sunday: ['11:00', '18:00']
                },
                performance_insights: {
                    best_posting_times: ['8:00 AM', '7:00 PM', '9:00 PM'],
                    trending_topics: ['AI tutorials', 'Morning routines', 'Productivity hacks'],
                    content_gaps: ['Weekend content', 'Interactive posts', 'User-generated content'],
                    seasonal_opportunities: ['New Year resolutions', 'Summer vacation content', 'Back to school']
                },
                monthly_goals: {
                    target_posts: 30,
                    target_engagement: 15000,
                    content_variety: {
                        'video': 15,
                        'post': 10,
                        'story': 5
                    }
                }
            });
            
            toast({
                title: "Demo Calendar Loaded",
                description: "Showing demo data. Connect to generate real insights.",
            });
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'easy': return 'bg-green-100 text-green-800';
            case 'medium': return 'bg-yellow-100 text-yellow-800';
            case 'hard': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'suggested': return 'bg-blue-100 text-blue-800';
            case 'planned': return 'bg-purple-100 text-purple-800';
            case 'created': return 'bg-orange-100 text-orange-800';
            case 'published': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredIdeas = calendarData?.content_ideas.filter(idea => {
        if (selectedFilter === 'all') return true;
        return idea.category === selectedFilter || idea.type === selectedFilter;
    }) || [];

    if (!calendarData && !loading) {
        return (
            <div className={className}>
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader className="text-center pb-4">
                        <div className="mx-auto p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full w-fit">
                            <Calendar className="w-8 h-8 text-white" />
                        </div>
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            AI Content Calendar
                        </CardTitle>
                        <p className="text-gray-600">
                            Generate a personalized content calendar with AI-powered scheduling and optimization
                        </p>
                    </CardHeader>
                    <CardContent className="text-center space-y-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="p-3 bg-white rounded-lg border">
                                <Brain className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                <p className="font-medium">Smart Scheduling</p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border">
                                <Target className="w-6 h-6 text-green-600 mx-auto mb-2" />
                                <p className="font-medium">Content Ideas</p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border">
                                <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                                <p className="font-medium">Trend Analysis</p>
                            </div>
                            <div className="p-3 bg-white rounded-lg border">
                                <BarChart3 className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                                <p className="font-medium">Performance Tracking</p>
                            </div>
                        </div>
                        
                        <Button 
                            onClick={generateCalendar}
                            disabled={loading}
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Generating Calendar...
                                </>
                            ) : (
                                <>
                                    <Zap className="mr-2 h-4 w-4" />
                                    Generate AI Content Calendar
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className={cn("space-y-6", className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">AI Content Calendar</h2>
                    <p className="text-muted-foreground">Your personalized content strategy</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={generateCalendar} disabled={loading}>
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                        Regenerate
                    </Button>
                    <Button variant="outline">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="calendar">Calendar</TabsTrigger>
                    <TabsTrigger value="ideas">Content Ideas</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                    <TabsTrigger value="goals">Goals</TabsTrigger>
                </TabsList>

                {/* Calendar Tab */}
                <TabsContent value="calendar" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarIcon className="w-5 h-5" />
                                Optimal Posting Schedule
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-7 gap-4">
                                {Object.entries(calendarData?.optimal_schedule || {}).map(([day, times]) => (
                                    <div key={day} className="text-center">
                                        <h4 className="font-medium capitalize mb-2">{day.slice(0, 3)}</h4>
                                        <div className="space-y-1">
                                            {times.map((time, index) => (
                                                <div key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {time}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Content Ideas Tab */}
                <TabsContent value="ideas" className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-4 h-4" />
                        <select 
                            value={selectedFilter} 
                            onChange={(e) => setSelectedFilter(e.target.value)}
                            className="border rounded px-3 py-1"
                        >
                            <option value="all">All Ideas</option>
                            <option value="video">Videos</option>
                            <option value="post">Posts</option>
                            <option value="story">Stories</option>
                            <option value="lifestyle">Lifestyle</option>
                            <option value="education">Education</option>
                            <option value="entertainment">Entertainment</option>
                        </select>
                    </div>

                    <div className="grid gap-4">
                        {filteredIdeas.map((idea) => (
                            <Card key={idea.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-semibold mb-2">{idea.title}</h3>
                                            <p className="text-sm text-muted-foreground mb-3">{idea.description}</p>
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <Badge variant="secondary">{idea.type}</Badge>
                                                <Badge className={getDifficultyColor(idea.difficulty)}>
                                                    {idea.difficulty}
                                                </Badge>
                                                <Badge className={getStatusColor(idea.status)}>
                                                    {idea.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {idea.optimal_time}
                                                </span>
                                                <span>Engagement: {idea.predicted_engagement}%</span>
                                                <span>Trending: {idea.trending_score}%</span>
                                            </div>
                                        </div>
                                        <Button size="sm">
                                            <Plus className="w-4 h-4 mr-1" />
                                            Plan
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Insights Tab */}
                <TabsContent value="insights" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Best Posting Times</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {calendarData?.performance_insights.best_posting_times.map((time, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                                            <span>{time}</span>
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Trending Topics</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {calendarData?.performance_insights.trending_topics.map((topic, index) => (
                                        <Badge key={index} variant="secondary" className="mr-2 mb-2">
                                            {topic}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Content Gaps</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {calendarData?.performance_insights.content_gaps.map((gap, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4 text-orange-500" />
                                            <span className="text-sm">{gap}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Seasonal Opportunities</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {calendarData?.performance_insights.seasonal_opportunities.map((opportunity, index) => (
                                        <div key={index} className="p-2 bg-blue-50 rounded">
                                            <span className="text-sm">{opportunity}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Goals Tab */}
                <TabsContent value="goals" className="space-y-6">
                    <div className="grid md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Monthly Posts Target</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600">
                                        {calendarData?.monthly_goals.target_posts}
                                    </div>
                                    <p className="text-sm text-muted-foreground">Posts this month</p>
                                    <Progress value={67} className="mt-2" />
                                    <p className="text-xs text-muted-foreground mt-1">67% completed</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Engagement Target</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600">
                                        {calendarData?.monthly_goals.target_engagement.toLocaleString()}
                                    </div>
                                    <p className="text-sm text-muted-foreground">Total engagement</p>
                                    <Progress value={82} className="mt-2" />
                                    <p className="text-xs text-muted-foreground mt-1">82% completed</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Content Variety</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {Object.entries(calendarData?.monthly_goals.content_variety || {}).map(([type, count]) => (
                                        <div key={type} className="flex items-center justify-between">
                                            <span className="capitalize">{type}</span>
                                            <span className="font-medium">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AIContentCalendar; 