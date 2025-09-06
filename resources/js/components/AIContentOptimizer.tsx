import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Sparkles,
    TrendingUp,
    Target,
    Clock,
    Hash,
    BarChart3,
    Lightbulb,
    Zap,
    Wand2,
    RefreshCw,
    Copy,
    CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AIOptimization {
    title: string;
    description: string;
    tags: string[];
    optimization_score: number;
    suggestions: string[];
    platform_specific_tips: string[];
}

interface AIContentOptimizerProps {
    title: string;
    description: string;
    platforms: string[];
    onTitleChange: (title: string) => void;
    onDescriptionChange: (description: string) => void;
    onTagsUpdate: (platform: string, tags: string[]) => void;
    className?: string;
}

export default function AIContentOptimizer({
    title,
    description,
    platforms,
    onTitleChange,
    onDescriptionChange,
    onTagsUpdate,
    className
}: AIContentOptimizerProps) {
    const [optimizations, setOptimizations] = useState<Record<string, AIOptimization>>({});
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<string>(platforms[0] || 'youtube');
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
    const { toast } = useToast();

    const platformColors = {
        youtube: 'bg-red-50 border-red-200 text-red-800',
        instagram: 'bg-pink-50 border-pink-200 text-pink-800',
            tiktok: 'bg-muted border-border text-foreground',
    facebook: 'bg-muted border-border text-foreground',
        twitter: 'bg-sky-50 border-sky-200 text-sky-800',
        snapchat: 'bg-yellow-50 border-yellow-200 text-yellow-800',
        pinterest: 'bg-red-50 border-red-200 text-red-800',
    };

    const platformIcons = {
        youtube: '🔴',
        instagram: '📸',
        tiktok: '🎵',
        facebook: '👥',
        twitter: '🐦',
        snapchat: '👻',
        pinterest: '📌',
    };

    const optimizeContent = async () => {
        if (!title.trim()) {
            toast({
                title: "Title Required",
                description: "Please enter a title before optimizing your content.",
                variant: "destructive",
            });
            return;
        }

        setIsOptimizing(true);

        try {
            const response = await fetch('/ai/optimize-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    title,
                    description,
                    platforms,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setOptimizations(data.data);
                setShowSuggestions(true);
                toast({
                    title: "Content Optimized! ✨",
                    description: "AI has generated optimized content for your selected platforms.",
                });
            } else {
                throw new Error(data.message || 'Failed to optimize content');
            }
        } catch (error) {
            console.error('Optimization error:', error);
            toast({
                title: "Optimization Failed",
                description: "Failed to optimize content. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsOptimizing(false);
        }
    };

    const generateHashtags = async (platform: string) => {
        try {
            const response = await fetch('/ai/generate-hashtags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    platform,
                    content: `${title} ${description}`,
                    count: platform === 'instagram' ? 20 : platform === 'tiktok' ? 8 : 10,
                }),
            });

            const data = await response.json();

            if (data.success) {
                onTagsUpdate(platform, data.data);
                toast({
                    title: "Hashtags Generated! #️⃣",
                    description: `Generated trending hashtags for ${platform}`,
                });
            }
        } catch (error) {
            console.error('Hashtag generation error:', error);
            toast({
                title: "Generation Failed",
                description: "Failed to generate hashtags. Please try again.",
                variant: "destructive",
            });
        }
    };

    const applyOptimization = (platform: string, field: 'title' | 'description') => {
        const optimization = optimizations[platform];
        if (!optimization) return;

        if (field === 'title') {
            onTitleChange(optimization.title);
        } else {
            onDescriptionChange(optimization.description);
        }

        toast({
            title: "Applied Successfully! ✅",
            description: `Applied AI-optimized ${field} for ${platform}`,
        });
    };

    const copyToClipboard = async (text: string, key: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedStates(prev => ({ ...prev, [key]: true }));
            setTimeout(() => {
                setCopiedStates(prev => ({ ...prev, [key]: false }));
            }, 2000);
            toast({
                title: "Copied! 📋",
                description: "Content copied to clipboard",
            });
        } catch (error) {
            toast({
                title: "Copy Failed",
                description: "Failed to copy to clipboard",
                variant: "destructive",
            });
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 bg-green-100';
        if (score >= 60) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    const currentOptimization = optimizations[selectedPlatform];

    return (
        <Card className={cn("border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50", className)}>
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                AI Content Optimization
                            </CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                                Get 3x more views with AI-powered optimization
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={optimizeContent}
                        disabled={isOptimizing || !title.trim()}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                        {isOptimizing ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Optimizing...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-4 h-4 mr-2" />
                                Optimize Content
                            </>
                        )}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Quick Action Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => generateHashtags(selectedPlatform)}
                        className="text-xs"
                    >
                        <Hash className="w-3 h-3 mr-1" />
                        Generate Tags
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={optimizeContent}
                        disabled={isOptimizing}
                        className="text-xs"
                    >
                        <TrendingUp className="w-3 h-3 mr-1" />
                        SEO Boost
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* Add timing suggestion */}}
                        className="text-xs"
                    >
                        <Clock className="w-3 h-3 mr-1" />
                        Best Times
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSuggestions(!showSuggestions)}
                        className="text-xs"
                    >
                        <Lightbulb className="w-3 h-3 mr-1" />
                        Tips
                    </Button>
                </div>

                {/* Platform Selection */}
                {platforms.length > 1 && (
                    <div className="space-y-2">
                        <Label className="text-sm font-medium">Select Platform for Optimization</Label>
                        <div className="flex flex-wrap gap-2">
                            {platforms.map((platform) => (
                                <Button
                                    key={platform}
                                    variant={selectedPlatform === platform ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedPlatform(platform)}
                                    className={cn(
 "text-xs capitalize",
                                        selectedPlatform === platform && "bg-gradient-to-r from-blue-600 to-purple-600"
                                    )}
                                >
                                    <span className="mr-1">{platformIcons[platform as keyof typeof platformIcons]}</span>
                                    {platform}
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Optimization Results */}
                {currentOptimization && (
                    <div className="space-y-4">
                        {/* Optimization Score */}
                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                <span className="font-medium">Optimization Score</span>
                            </div>
                            <Badge className={cn("font-bold", getScoreColor(currentOptimization.optimization_score))}>
                                {currentOptimization.optimization_score}/100
                            </Badge>
                        </div>

                        {/* Optimized Content */}
                        <div className="grid gap-4">
                            {/* Title */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="font-medium">AI-Optimized Title</Label>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(currentOptimization.title, 'title')}
                                        >
                                            {copiedStates.title ? (
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => applyOptimization(selectedPlatform, 'title')}
                                        >
                                            <Zap className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800">{currentOptimization.title}</p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="font-medium">AI-Optimized Description</Label>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyToClipboard(currentOptimization.description, 'description')}
                                        >
                                            {copiedStates.description ? (
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => applyOptimization(selectedPlatform, 'description')}
                                        >
                                            <Zap className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg max-h-32 overflow-y-auto">
                                    <p className="text-sm text-green-800 whitespace-pre-wrap">{currentOptimization.description}</p>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="font-medium">Trending Tags</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onTagsUpdate(selectedPlatform, currentOptimization.tags)}
                                    >
                                        <Target className="w-4 h-4 mr-1" />
                                        Apply Tags
                                    </Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {currentOptimization.tags.map((tag, index) => (
                                        <Badge
                                            key={index}
                                            variant="secondary"
                                            className="cursor-pointer hover:bg-blue-100"
                                            onClick={() => copyToClipboard(tag, `tag-${index}`)}
                                        >
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* AI Suggestions */}
                {showSuggestions && currentOptimization && (
                    <div className="space-y-3 p-4 bg-blue-950/20 rounded-lg border border-blue-800">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-blue-600" />
                            <h4 className="font-medium text-blue-900">AI Suggestions</h4>
                        </div>
                        <div className="space-y-2">
                            {currentOptimization.suggestions.map((suggestion, index) => (
                                <div key={index} className="flex items-start gap-2 text-sm text-blue-800">
                                    <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></span>
                                    <span>{suggestion}</span>
                                </div>
                            ))}
                        </div>

                        {currentOptimization.platform_specific_tips.length > 0 && (
                            <div className="mt-4 pt-3 border-t border-blue-200">
                                <h5 className="font-medium text-blue-900 mb-2 capitalize">
                                    {selectedPlatform} Pro Tips
                                </h5>
                                <div className="space-y-1">
                                    {currentOptimization.platform_specific_tips.map((tip, index) => (
                                        <div key={index} className="flex items-start gap-2 text-sm text-blue-700">
                                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                                            <span>{tip}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Call to Action */}
                {!currentOptimization && (
                    <div className="text-center p-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border-2 border-dashed border-blue-300">
                        <Sparkles className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                        <h3 className="font-semibold text-blue-900 mb-2">Ready to Optimize Your Content?</h3>
                        <p className="text-sm text-blue-700 mb-4">
                            Our AI will analyze your content and generate platform-specific optimizations to maximize your reach and engagement.
                        </p>
                        <Button
                            onClick={optimizeContent}
                            disabled={isOptimizing || !title.trim()}
                            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                            <Wand2 className="w-4 h-4 mr-2" />
                            Start AI Optimization
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}