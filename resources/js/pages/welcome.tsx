import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Head, Link } from '@inertiajs/react';
import { 
    Upload, 
    Youtube, 
    Instagram, 
    Video as VideoIcon, 
    CheckCircle, 
    BarChart3, 
    Users, 
    Calendar,
    Zap,
    Shield,
    ArrowRight,
    Star,
    Play,
    Facebook,
    Twitter,
    Camera,
    Palette,
    User
} from 'lucide-react';

interface WelcomeProps {
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
        };
    };
}

export default function Welcome({ auth }: WelcomeProps) {
    const features = [
        {
            icon: Upload,
            title: "One-Click Upload",
            description: "Upload your video once and distribute it across all your connected social media platforms instantly."
        },
        {
            icon: Users,
            title: "Multi-Channel Management",
            description: "Manage multiple channels for different brands or personas, each with their own social media connections."
        },
        {
            icon: Calendar,
            title: "Smart Scheduling",
            description: "Schedule your videos for optimal posting times or publish immediately across all platforms."
        },
        {
            icon: BarChart3,
            title: "Real-Time Status",
            description: "Monitor upload progress and status for each platform with detailed error reporting and retry options."
        },
        {
            icon: Zap,
            title: "Lightning Fast",
            description: "Built with cutting-edge technology for blazing fast uploads and seamless user experience."
        },
        {
            icon: Shield,
            title: "Secure & Private",
            description: "Your content and data are protected with enterprise-grade security and privacy measures."
        }
    ];

    const platforms = [
        {
            name: "YouTube",
            icon: Youtube,
            description: "Upload videos directly to your YouTube channel",
            color: "text-red-600"
        },
        {
            name: "Instagram",
            icon: Instagram,
            description: "Share Reels and video content on Instagram",
            color: "text-pink-600"
        },
        {
            name: "TikTok",
            icon: VideoIcon,
            description: "Publish your videos to TikTok for maximum reach",
            color: "text-black"
        },
        {
            name: "Facebook",
            icon: Facebook,
            description: "Share videos on your Facebook pages and profiles",
            color: "text-blue-600"
        },
        {
            name: "Twitter",
            icon: Twitter,
            description: "Post video content to engage your Twitter audience",
            color: "text-blue-400"
        },
        {
            name: "Snapchat",
            icon: Camera,
            description: "Create engaging video content for Snapchat",
            color: "text-yellow-500"
        },
        {
            name: "Pinterest",
            icon: Palette,
            description: "Pin video content to reach Pinterest users",
            color: "text-red-500"
        }
    ];

    const testimonials = [
        {
            name: "Sarah Johnson",
            role: "Content Creator",
            content: "Tikomat saved me hours every week. I can now focus on creating content instead of manually uploading to each platform.",
            rating: 5
        },
        {
            name: "Mike Chen",
            role: "Digital Marketer",
            content: "Managing multiple brand channels has never been easier. The scheduling feature is a game-changer for our campaigns.",
            rating: 5
        },
        {
            name: "Emma Davis",
            role: "YouTuber",
            content: "The real-time status tracking gives me peace of mind. I always know exactly where my videos are in the upload process.",
            rating: 5
        }
    ];

    return (
        <>
            <Head title="Tikomat - Social Media Video Publisher" />
            
            {/* Header */}
            <header className="border-b bg-white">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <VideoIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">Tikomat</span>
                    </div>
                    <nav className="hidden md:flex items-center space-x-8">
                        <a href="#features" className="text-gray-600 hover:text-gray-900">Features</a>
                        <a href="#platforms" className="text-gray-600 hover:text-gray-900">Platforms</a>
                        <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
                        <a href="#testimonials" className="text-gray-600 hover:text-gray-900">Reviews</a>
                    </nav>
                    <div className="flex items-center space-x-4">
                        {auth?.user ? (
                            <div className="flex items-center space-x-3">
                                <div className="flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-2">
                                    <User className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium text-gray-700">{auth.user.name}</span>
                                </div>
                                <Link href="/dashboard">
                                    <Button>Dashboard</Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <Link href="/login">
                                    <Button variant="outline">Sign In</Button>
                                </Link>
                                <Link href="/register">
                                    <Button>Get Started</Button>
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
                <div className="container mx-auto px-4 text-center">
                    <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
                        🚀 Launch Your Content Everywhere
                    </Badge>
                    <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                        Publish Videos to <br />
                        <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            All Platforms
                        </span> at Once
                    </h1>
                    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                        Stop wasting time uploading the same video to multiple social media platforms. 
                        With Tikomat, upload once and reach everywhere—YouTube, Instagram, TikTok, and more.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/register">
                            <Button size="lg" className="text-lg px-8 py-3">
                                Start Free Trial
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            </Link>
                        <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                            <Play className="mr-2 w-5 h-5" />
                            Watch Demo
                        </Button>
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                        ✅ Free forever for YouTube • ✅ No credit card required
                    </p>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Everything You Need to Scale Your Content
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            Powerful features designed to save you time and help you reach more audiences
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="border-gray-200 hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                        <feature.icon className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-gray-600">
                                        {feature.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Platforms Section */}
            <section id="platforms" className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Supported Platforms
                        </h2>
                        <p className="text-xl text-gray-600">
                            Connect and publish to all major social media platforms
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
                        {platforms.map((platform, index) => (
                            <Card key={index} className="text-center border-gray-200 hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="mx-auto mb-4">
                                        <platform.icon className={`w-16 h-16 ${platform.color}`} />
                                    </div>
                                    <CardTitle className="text-2xl">{platform.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-gray-600">
                                        {platform.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Simple, Transparent Pricing
                        </h2>
                        <p className="text-xl text-gray-600">
                            Start free with YouTube, upgrade to unlock all platforms
                        </p>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {/* Free Plan */}
                        <Card className="border-gray-200">
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl">Free Plan</CardTitle>
                                <div className="text-4xl font-bold text-gray-900 mt-4">$0</div>
                                <CardDescription>Perfect for getting started</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                        <span>1 Channel</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                        <span>YouTube Publishing</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                        <span>Upload Scheduling</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                        <span>Status Tracking</span>
                                    </div>
                                </div>
                                <Link href="/register" className="block w-full">
                                    <Button variant="outline" className="w-full">
                                        Get Started Free
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>

                        {/* Pro Plan */}
                        <Card className="border-blue-200 relative">
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                                <Badge className="bg-blue-600 text-white">Most Popular</Badge>
                            </div>
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl">Pro Plan</CardTitle>
                                <div className="text-4xl font-bold text-gray-900 mt-4">
                                    $0.60<span className="text-lg text-gray-600">/day</span>
                                </div>
                                <CardDescription>For serious content creators</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                        <span>Up to 3 Channels</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                        <span>All Platforms (YouTube, Instagram, TikTok)</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                        <span>Advanced Scheduling</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                        <span>Priority Support</span>
                                    </div>
                                    <div className="flex items-center">
                                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                                        <span>+$0.20/day per additional channel</span>
                                    </div>
                                </div>
                                <Link href="/register" className="block w-full">
                                    <Button className="w-full">
                                        Start Pro Trial
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section id="testimonials" className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Loved by Content Creators
                        </h2>
                        <p className="text-xl text-gray-600">
                            See what our users are saying about Tikomat
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index} className="border-gray-200">
                                <CardHeader>
                                    <div className="flex">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                        ))}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 mb-4">"{testimonial.content}"</p>
                                    <div>
                                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                                        <p className="text-sm text-gray-500">{testimonial.role}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-white mb-4">
                        Ready to Scale Your Content?
                    </h2>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Join thousands of content creators who are already saving time and reaching more audiences with Tikomat.
                    </p>
                    <Link href="/register">
                        <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3">
                            Get Started Free Today
                            <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-12">
                <div className="container mx-auto px-4">
                    <div className="grid md:grid-cols-4 gap-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                                    <VideoIcon className="w-4 h-4 text-white" />
                                </div>
                                <span className="text-lg font-bold">Tikomat</span>
                            </div>
                            <p className="text-gray-400">
                                The easiest way to publish videos across all social media platforms.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Product</h3>
                            <div className="space-y-2 text-gray-400">
                                <a href="#features" className="block hover:text-white">Features</a>
                                <a href="#platforms" className="block hover:text-white">Platforms</a>
                                <a href="#pricing" className="block hover:text-white">Pricing</a>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Support</h3>
                            <div className="space-y-2 text-gray-400">
                                <a href="#" className="block hover:text-white">Help Center</a>
                                <a href="#" className="block hover:text-white">Contact Us</a>
                                <a href="#" className="block hover:text-white">Status</a>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Legal</h3>
                            <div className="space-y-2 text-gray-400">
                                <a href="#" className="block hover:text-white">Privacy Policy</a>
                                <a href="#" className="block hover:text-white">Terms of Service</a>
                                <a href="#" className="block hover:text-white">Cookie Policy</a>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
                        <p>&copy; 2025 Tikomat. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </>
    );
}