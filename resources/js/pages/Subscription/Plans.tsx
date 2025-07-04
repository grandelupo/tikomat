import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Youtube, Instagram, Video as VideoIcon } from 'lucide-react';
import axios from 'axios';

interface User {
    current_plan: string;
    has_subscription: boolean;
    monthly_cost: number;
    daily_cost: number;
    channels_count: number;
    max_channels: number;
}

interface Plan {
    name: string;
    price: number;
    features: string[];
}

interface Props {
    user: User;
    plans: {
        free: Plan;
        pro: Plan;
    };
}

export default function SubscriptionPlans({ user, plans }: Props) {
    const breadcrumbs = [
        {
            title: 'My channels',
            href: '/dashboard',
        },
        {
            title: 'Subscription Plans',
            href: '/subscription/plans',
        },
    ];

    const handleUpgrade = async () => {
        try {
            const response = await axios.post('/subscription/checkout', {}, {
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });
            
            if (response.data.checkout_url) {
                window.location.href = response.data.checkout_url;
            }
        } catch (error: any) {
            console.error('Checkout failed:', error);
            // You could show an error message here
            if (error.response?.data?.message) {
                alert('Checkout failed: ' + error.response.data.message);
            } else {
                alert('Checkout failed. Please try again.');
            }
        }
    };

    const handleSimulateSubscription = () => {
        router.post('/subscription/simulate');
    };

    const handleManageBilling = () => {
        router.get('/subscription/billing');
    };

    const handleAddChannel = () => {
        router.post('/subscription/add-channel');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Subscription Plans" />
            
            <div className="flex h-full flex-1 flex-col gap-8 p-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight">Choose Your Plan</h1>
                    <p className="text-lg text-muted-foreground mt-2">
                        Unlock the full potential of social media publishing
                    </p>
                </div>

                {/* Current Plan Status */}
                {user.has_subscription && (
                    <Card className="max-w-md mx-auto bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                        <CardHeader className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <Crown className="w-5 h-5 text-blue-600" />
                                <CardTitle className="text-blue-800">Current Plan: Pro</CardTitle>
                            </div>
                            <CardDescription className="text-blue-600">
                                ${user.daily_cost.toFixed(2)}/day
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center space-y-2">
                            <p className="text-sm text-blue-700">
                                {user.channels_count} of {user.max_channels} channels used
                            </p>
                            <div className="flex space-x-2">
                                <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={handleManageBilling}
                                    className="flex-1"
                                >
                                    Manage Billing
                                </Button>
                                {user.channels_count >= user.max_channels && (
                                    <Button 
                                        size="sm" 
                                        onClick={handleAddChannel}
                                        className="flex-1"
                                    >
                                        Add Channel
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Plans Grid */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
                    {/* Free Plan */}
                    <Card className={`relative ${user.current_plan === 'free' ? 'border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800' : ''}`}>
                        {user.current_plan === 'free' && (
                            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                                Current Plan
                            </Badge>
                        )}
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl">{plans.free.name}</CardTitle>
                            <div className="text-3xl font-bold">
                                ${(plans.free.price/30).toFixed(2)}
                                <span className="text-base font-normal text-muted-foreground">/day</span>
                            </div>
                            <CardDescription>Perfect for getting started</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                {plans.free.features.map((feature, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-4">
                                <div className="flex items-center justify-center space-x-2 mb-4">
                                    <Youtube className="w-6 h-6 text-red-600" />
                                    <span className="text-sm font-medium">YouTube Only</span>
                                </div>
                                
                                {user.current_plan === 'free' ? (
                                    <Button className="w-full" disabled>
                                        Current Plan
                                    </Button>
                                ) : (
                                    <Button variant="outline" className="w-full" disabled>
                                        Downgrade (Contact Support)
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pro Plan */}
                    <Card className={`relative ${user.current_plan === 'pro' ? 'border-purple-200 bg-purple-50' : 'border-purple-200'} ${!user.has_subscription ? 'ring-2 ring-purple-300' : ''}`}>
                        {!user.has_subscription && (
                            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600">
                                Recommended
                            </Badge>
                        )}
                        {user.current_plan === 'pro' && (
                            <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600">
                                Current Plan
                            </Badge>
                        )}
                        <CardHeader className="text-center">
                            <div className="flex items-center justify-center space-x-2">
                                <Crown className="w-6 h-6 text-purple-600" />
                                <CardTitle className="text-2xl text-purple-800">{plans.pro.name}</CardTitle>
                            </div>
                            <div className="text-3xl font-bold text-purple-800">
                                ${(plans.pro.price/30).toFixed(2)}
                                <span className="text-base font-normal text-muted-foreground">/day</span>
                            </div>
                            <CardDescription>For serious content creators</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                {plans.pro.features.map((feature, index) => (
                                    <div key={index} className="flex items-center space-x-3">
                                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                                        <span className="text-sm">{feature}</span>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="pt-4">
                                <div className="flex items-center justify-center space-x-4 mb-4">
                                    <div className="flex items-center space-x-1">
                                        <Youtube className="w-5 h-5 text-red-600" />
                                        <span className="text-xs">YouTube</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Instagram className="w-5 h-5 text-pink-600" />
                                        <span className="text-xs">Instagram</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <VideoIcon className="w-5 h-5 text-black" />
                                        <span className="text-xs">TikTok</span>
                                    </div>
                                </div>
                                
                                {user.current_plan === 'pro' ? (
                                    <Button className="w-full" disabled>
                                        Current Plan
                                    </Button>
                                ) : (
                                    <div className="space-y-2">
                                        <Button 
                                            className="w-full bg-purple-600 hover:bg-purple-700"
                                            onClick={handleUpgrade}
                                        >
                                            <Zap className="w-4 h-4 mr-2" />
                                            Upgrade to Pro
                                        </Button>
                                        {import.meta.env.DEV && (
                                            <Button 
                                                variant="outline"
                                                className="w-full text-xs"
                                                onClick={handleSimulateSubscription}
                                            >
                                                Simulate Pro (Dev Only)
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Information */}
                <div className="max-w-2xl mx-auto text-center space-y-4">
                    <div className="bg-gray-50 p-6 rounded-lg dark:bg-gray-900">
                        <h3 className="font-semibold mb-2">Need More Channels?</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Pro plan includes 3 channels. Additional channels are just $0.20/day each.
                        </p>
                        {user.has_subscription && user.channels_count >= user.max_channels && (
                            <Button size="sm" onClick={handleAddChannel}>
                                Add Another Channel
                            </Button>
                        )}
                    </div>
                    
                    <div className="flex justify-center space-x-4 text-sm text-muted-foreground">
                        <span>✓ No setup fees</span>
                        <span>✓ Cancel anytime</span>
                        <span>✓ 24/7 support</span>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 