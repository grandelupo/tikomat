import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Crown, ArrowRight, Star } from 'lucide-react';

interface User {
    current_plan: string;
    monthly_cost: number;
}

interface Props {
    user: User;
}

export default function SubscriptionSuccess({ user }: Props) {
    return (
        <AppLayout>
            <Head title="Subscription Successful" />
            
            <div className="flex h-full flex-1 flex-col items-center justify-center gap-8 p-6">
                {/* Success Icon */}
                <div className="flex items-center justify-center w-20 h-20 bg-green-100 rounded-full">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>

                {/* Success Message */}
                <div className="text-center space-y-4">
                    <h1 className="text-4xl font-bold tracking-tight">Welcome to Pro!</h1>
                    <p className="text-lg text-muted-foreground max-w-md">
                        Your subscription has been activated successfully. You now have access to all Pro features!
                    </p>
                </div>

                {/* Plan Details */}
                <Card className="max-w-md w-full bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                    <CardHeader className="text-center">
                        <div className="flex items-center justify-center space-x-2 mb-2">
                            <Crown className="w-6 h-6 text-purple-600" />
                            <CardTitle className="text-purple-800">Pro Plan Active</CardTitle>
                        </div>
                        <CardDescription className="text-purple-600">
                            ${user.monthly_cost.toFixed(2)}/month
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 text-sm">
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>3 Channels Included</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>YouTube, Instagram & TikTok</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Video Thumbnails</span>
                            </div>
                            <div className="flex items-center space-x-3">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span>Priority Support</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Next Steps */}
                <div className="text-center space-y-6">
                    <h3 className="text-xl font-semibold">What's Next?</h3>
                    
                    <div className="grid md:grid-cols-3 gap-4 max-w-2xl">
                        <Card className="text-center p-4">
                            <CardContent className="space-y-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                                    <span className="text-blue-600 font-bold">1</span>
                                </div>
                                <h4 className="font-medium">Create Channels</h4>
                                <p className="text-sm text-muted-foreground">
                                    Set up your channels and organize your content
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="text-center p-4">
                            <CardContent className="space-y-3">
                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                    <span className="text-green-600 font-bold">2</span>
                                </div>
                                <h4 className="font-medium">Connect Platforms</h4>
                                <p className="text-sm text-muted-foreground">
                                    Link your social media accounts
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="text-center p-4">
                            <CardContent className="space-y-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
                                    <span className="text-purple-600 font-bold">3</span>
                                </div>
                                <h4 className="font-medium">Start Publishing</h4>
                                <p className="text-sm text-muted-foreground">
                                    Upload and schedule your videos
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/dashboard">
                        <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
                            Go to Dashboard
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                    
                    <Link href="/channels/create">
                        <Button size="lg" variant="outline">
                            Create First Channel
                        </Button>
                    </Link>
                </div>

                {/* Support */}
                <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                        Need help getting started?
                    </p>
                    <div className="flex items-center justify-center space-x-4 text-sm">
                        <span className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>Priority Support</span>
                        </span>
                        <span>•</span>
                        <a href="#" className="text-blue-600 hover:underline">
                            Contact Support
                        </a>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 