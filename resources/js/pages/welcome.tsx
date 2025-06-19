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
    User,
    Clock,
    Globe,
    TrendingUp,
    Smartphone,
    Monitor,
    ChevronDown,
    Plus,
    Minus,
    Target,
    Award,
    MessageSquare,
    Eye,
    Heart,
    Share2,
    Download,
    Sparkles,
    Timer,
    Workflow,
    Settings,
    Lock,
    Headphones
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
            role: "Content Creator & Influencer",
            content: "Tikomat saved me 15+ hours every week. I can now focus on creating content instead of manually uploading to each platform. My reach increased by 250%!",
            rating: 5,
            followers: "150K"
        },
        {
            name: "Mike Chen",
            role: "Digital Marketing Agency",
            content: "Managing 25+ client channels has never been easier. The scheduling feature is a game-changer for our campaigns. ROI increased 300%.",
            rating: 5,
            followers: "Agency"
        },
        {
            name: "Emma Davis",
            role: "YouTuber & TikToker",
            content: "The real-time status tracking gives me peace of mind. I always know exactly where my videos are. Upload failures decreased by 99%.",
            rating: 5,
            followers: "2.3M"
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
                        <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
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
            <section className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-20 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] opacity-25"></div>
                <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute top-1/3 right-10 w-16 h-16 bg-purple-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
                <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-pink-200 rounded-full opacity-20 animate-pulse delay-2000"></div>
                
                <div className="container mx-auto px-4 text-center relative z-10">
                    <Badge className="mb-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 text-sm px-4 py-2">
                        🚀 Join 10,000+ Content Creators
                    </Badge>
                    <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                        Upload Once, <br />
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                            Publish Everywhere
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
                        The world's most powerful multi-platform video publisher. Save 5+ hours per week and 
                        reach 10x more audience with one simple upload to YouTube, TikTok, Instagram, and 7+ platforms.
                    </p>
                    
                    {/* Stats Row */}
                    <div className="flex flex-wrap justify-center gap-8 mb-10 text-sm">
                        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="font-semibold text-gray-700">5+ hours saved weekly</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2">
                            <Globe className="w-4 h-4 text-blue-600" />
                            <span className="font-semibold text-gray-700">10+ platforms supported</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2">
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                            <span className="font-semibold text-gray-700">300% more reach</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                        <Link href="/register">
                            <Button size="lg" className="text-lg px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
                                Start Free Trial
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="text-lg px-10 py-4 bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white">
                            <Play className="mr-2 w-5 h-5" />
                            Watch 2-Min Demo
                        </Button>
                    </div>

                    {/* Demo Video Section */}
                    <div className="max-w-5xl mx-auto">
                        <Card className="overflow-hidden shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
                            <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 relative group cursor-pointer">
                                {/* Video placeholder - replace with actual video */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4 mx-auto group-hover:bg-white/30 transition-colors">
                                            <Play className="w-8 h-8 text-white ml-1" />
                                        </div>
                                        <p className="text-white text-lg font-semibold">See Tikomat in Action</p>
                                        <p className="text-gray-300 text-sm">2-minute product demo</p>
                                    </div>
                                </div>
                                {/* Mock interface preview */}
                                <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
                                    <div className="flex items-center justify-between text-white text-sm">
                                        <span>🎥 uploading-my-video.mp4</span>
                                        <div className="flex gap-2">
                                            <Badge className="bg-red-600 text-white">YouTube ✓</Badge>
                                            <Badge className="bg-pink-600 text-white">Instagram ✓</Badge>
                                            <Badge className="bg-black text-white">TikTok ✓</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <p className="text-sm text-gray-500 mt-6">
                        ✅ Free forever for YouTube • ✅ No credit card required • ✅ Setup in under 60 seconds
                    </p>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="py-16 bg-white border-b">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        <div>
                            <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">10,000+</div>
                            <p className="text-gray-600">Active Creators</p>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">2.5M+</div>
                            <p className="text-gray-600">Videos Published</p>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">50,000+</div>
                            <p className="text-gray-600">Hours Saved</p>
                        </div>
                        <div>
                            <div className="text-4xl md:text-5xl font-bold text-pink-600 mb-2">99.9%</div>
                            <p className="text-gray-600">Success Rate</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                            How It Works
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                            From upload to publish in 3 simple steps. No technical knowledge required.
                        </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        <div className="text-center relative">
                            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <Upload className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">1. Upload Your Video</h3>
                            <p className="text-gray-600 mb-6">
                                Simply drag and drop your video file. We support all major formats including MP4, MOV, AVI, and more.
                            </p>
                            <div className="bg-white rounded-lg p-4 shadow-sm border">
                                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">Drag & drop your video</p>
                                    </div>
                                </div>
                            </div>
                            {/* Arrow for desktop */}
                            <div className="hidden md:block absolute top-8 -right-4 text-gray-300">
                                <ArrowRight className="w-8 h-8" />
                            </div>
                        </div>
                        
                        <div className="text-center relative">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <Settings className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">2. Customize & Schedule</h3>
                            <p className="text-gray-600 mb-6">
                                Add titles, descriptions, tags, and thumbnails for each platform. Schedule for later or publish immediately.
                            </p>
                            <div className="bg-white rounded-lg p-4 shadow-sm border">
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                    <div className="flex gap-2 mt-3">
                                        <Badge className="bg-red-100 text-red-800">YouTube</Badge>
                                        <Badge className="bg-pink-100 text-pink-800">Instagram</Badge>
                                        <Badge className="bg-gray-100 text-gray-800">TikTok</Badge>
                                    </div>
                                </div>
                            </div>
                            {/* Arrow for desktop */}
                            <div className="hidden md:block absolute top-8 -right-4 text-gray-300">
                                <ArrowRight className="w-8 h-8" />
                            </div>
                        </div>
                        
                        <div className="text-center">
                            <div className="w-16 h-16 bg-gradient-to-r from-pink-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <Zap className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">3. Publish Everywhere</h3>
                            <p className="text-gray-600 mb-6">
                                Watch as your video gets published to all selected platforms simultaneously. Track progress in real-time.
                            </p>
                            <div className="bg-white rounded-lg p-4 shadow-sm border">
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">YouTube</span>
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Instagram</span>
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">TikTok</span>
                                        <Timer className="w-5 h-5 text-blue-500 animate-spin" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-blue-50 text-blue-700 border-blue-200">
                            ⚡ Powerful Features
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Everything You Need to Scale Your Content
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Powerful features designed to save you time, increase your reach, and help you dominate social media
                        </p>
                    </div>
                    
                    {/* Featured Highlight */}
                    <div className="mb-16">
                        <Card className="border-0 shadow-2xl bg-gradient-to-r from-blue-50 to-purple-50 overflow-hidden">
                            <div className="grid md:grid-cols-2 gap-8 items-center p-8">
                                <div>
                                    <Badge className="mb-4 bg-blue-600 text-white">
                                        🚀 Most Popular Feature
                                    </Badge>
                                    <h3 className="text-3xl font-bold text-gray-900 mb-4">
                                        AI-Powered Content Optimization
                                    </h3>
                                    <p className="text-gray-600 mb-6 text-lg">
                                        Our AI automatically optimizes your titles, descriptions, and tags for each platform to maximize reach and engagement. 
                                        Get 3x more views with zero extra effort.
                                    </p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <span>Platform-specific optimization</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <span>Trending hashtag suggestions</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                            <span>SEO-optimized descriptions</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white rounded-lg p-6 shadow-lg">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">AI Generated Title</label>
                                            <div className="mt-1 p-3 bg-green-50 rounded border-l-4 border-green-400">
                                                <p className="text-sm">"10 Secret Tips That Will Transform Your Morning Routine"</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-700">Trending Tags</label>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <Badge className="bg-blue-100 text-blue-800">#morningroutine</Badge>
                                                <Badge className="bg-purple-100 text-purple-800">#productivity</Badge>
                                                <Badge className="bg-green-100 text-green-800">#wellness</Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <Card key={index} className="border-gray-200 hover:shadow-xl hover:border-blue-200 transition-all duration-300 group">
                                <CardHeader>
                                    <div className="w-14 h-14 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:from-blue-200 group-hover:to-purple-200 transition-colors">
                                        <feature.icon className="w-7 h-7 text-blue-600" />
                                    </div>
                                    <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <CardDescription className="text-gray-600 leading-relaxed">
                                        {feature.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Additional Benefits */}
                    <div className="mt-16 text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-8">Plus So Much More...</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Workflow className="w-4 h-4 text-blue-600" />
                                <span>Bulk Upload</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Target className="w-4 h-4 text-purple-600" />
                                <span>A/B Testing</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Award className="w-4 h-4 text-green-600" />
                                <span>White Label</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Headphones className="w-4 h-4 text-pink-600" />
                                <span>24/7 Support</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Platforms Section */}
            <section id="platforms" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-purple-50 text-purple-700 border-purple-200">
                            🌐 Multi-Platform Publishing
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Publish to 10+ Platforms
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Connect your accounts once and reach billions of users across all major social media platforms. 
                            More platforms added every month.
                        </p>
                    </div>

                    {/* Main Platforms Grid */}
                    <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto mb-12">
                        {platforms.map((platform, index) => (
                            <Card key={index} className="text-center border-0 bg-white/80 backdrop-blur-sm hover:bg-white hover:shadow-xl transition-all duration-300 group">
                                <CardHeader className="pt-8">
                                    <div className="mx-auto mb-4 p-4 bg-gray-50 rounded-2xl group-hover:bg-gray-100 transition-colors">
                                        <platform.icon className={`w-12 h-12 ${platform.color}`} />
                                    </div>
                                    <CardTitle className="text-lg font-bold">{platform.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="pb-8">
                                    <CardDescription className="text-gray-600 text-sm leading-relaxed">
                                        {platform.description}
                                    </CardDescription>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Coming Soon Platforms */}
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Coming Soon</h3>
                        <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
                            <Badge className="bg-gray-100 text-gray-700 px-4 py-2 text-sm">LinkedIn</Badge>
                            <Badge className="bg-gray-100 text-gray-700 px-4 py-2 text-sm">Discord</Badge>
                            <Badge className="bg-gray-100 text-gray-700 px-4 py-2 text-sm">Twitch</Badge>
                            <Badge className="bg-gray-100 text-gray-700 px-4 py-2 text-sm">Vimeo</Badge>
                            <Badge className="bg-gray-100 text-gray-700 px-4 py-2 text-sm">Dailymotion</Badge>
                            <Badge className="bg-gray-100 text-gray-700 px-4 py-2 text-sm">Reddit</Badge>
                        </div>
                        <p className="text-gray-500 text-sm mt-4">
                            🚀 Request a platform and we'll prioritize it for you
                        </p>
                    </div>

                    {/* Platform Statistics */}
                    <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto">
                        <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
                            Reach More Audiences Than Ever Before
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            <div>
                                <div className="text-3xl font-bold text-red-600 mb-2">2.7B+</div>
                                <p className="text-sm text-gray-600">YouTube Users</p>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-pink-600 mb-2">2B+</div>
                                <p className="text-sm text-gray-600">Instagram Users</p>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-black mb-2">1B+</div>
                                <p className="text-sm text-gray-600">TikTok Users</p>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-blue-600 mb-2">3B+</div>
                                <p className="text-sm text-gray-600">Facebook Users</p>
                            </div>
                        </div>
                        <div className="text-center mt-6">
                            <p className="text-lg font-semibold text-gray-900">
                                Total Potential Reach: <span className="text-purple-600">8.7 Billion People</span>
                            </p>
                            <p className="text-sm text-gray-500 mt-2">
                                Why limit yourself to one platform when you can reach them all?
                            </p>
                        </div>
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
            <section id="testimonials" className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-yellow-50 text-yellow-700 border-yellow-200">
                            ⭐ Customer Love
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Loved by 10,000+ Content Creators
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Join thousands of creators who have transformed their content strategy with Tikomat
                        </p>
                    </div>

                    {/* Featured Testimonial */}
                    <div className="mb-16">
                        <Card className="border-0 shadow-2xl bg-gradient-to-r from-yellow-50 to-orange-50 max-w-4xl mx-auto">
                            <CardContent className="p-8 md:p-12">
                                <div className="text-center">
                                    <div className="flex justify-center mb-6">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                                        ))}
                                    </div>
                                    <blockquote className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 leading-relaxed">
                                        "Tikomat increased my video views by 400% and saved me 8 hours every week. 
                                        It's literally transformed my content business."
                                    </blockquote>
                                    <div className="flex items-center justify-center gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold text-xl">AJ</span>
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-900 text-lg">Alex Johnson</p>
                                            <p className="text-gray-600">YouTuber, 2.3M subscribers</p>
                                            <p className="text-sm text-gray-500">Fitness & Lifestyle Content</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index} className="border-gray-200 hover:shadow-lg transition-shadow">
                                <CardHeader>
                                    <div className="flex mb-4">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                            <span className="text-white font-bold">{testimonial.name.charAt(0)}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{testimonial.name}</p>
                                            <p className="text-sm text-gray-500">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 leading-relaxed">"{testimonial.content}"</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Social Proof */}
                    <div className="mt-16 text-center">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
                            <div>
                                <div className="text-3xl mb-2">⭐⭐⭐⭐⭐</div>
                                <p className="font-bold text-gray-900">4.9/5</p>
                                <p className="text-sm text-gray-500">Average Rating</p>
                            </div>
                            <div>
                                <div className="text-3xl mb-2">💬</div>
                                <p className="font-bold text-gray-900">2,847</p>
                                <p className="text-sm text-gray-500">Happy Reviews</p>
                            </div>
                            <div>
                                <div className="text-3xl mb-2">🏆</div>
                                <p className="font-bold text-gray-900">#1</p>
                                <p className="text-sm text-gray-500">Product of the Day</p>
                            </div>
                            <div>
                                <div className="text-3xl mb-2">👥</div>
                                <p className="font-bold text-gray-900">10,000+</p>
                                <p className="text-sm text-gray-500">Active Users</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <Badge className="mb-4 bg-green-50 text-green-700 border-green-200">
                            ❓ Got Questions?
                        </Badge>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                            Everything you need to know about Tikomat. Can't find what you're looking for? 
                            Chat with our friendly team.
                        </p>
                    </div>
                    
                    <div className="max-w-4xl mx-auto">
                        <div className="space-y-4">
                            {[
                                {
                                    question: "How does Tikomat work?",
                                    answer: "Simply upload your video once, customize the title and description for each platform, and Tikomat will automatically publish to all your connected social media accounts. You can schedule posts or publish immediately."
                                },
                                {
                                    question: "Which platforms are supported?",
                                    answer: "We currently support YouTube, Instagram, TikTok, Facebook, Twitter, Snapchat, Pinterest, and more. We're constantly adding new platforms based on user requests."
                                },
                                {
                                    question: "Is there a free plan?",
                                    answer: "Yes! Our free plan includes YouTube publishing, basic scheduling, and status tracking. You can upgrade to Pro to unlock all platforms and advanced features."
                                },
                                {
                                    question: "How secure is my content?",
                                    answer: "Your content is protected with enterprise-grade security. We use encrypted connections, never store your videos permanently, and only access your social accounts when you explicitly authorize uploads."
                                },
                                {
                                    question: "Can I schedule posts for different times?",
                                    answer: "Absolutely! You can schedule each platform for different optimal times, or use our AI-powered optimal timing suggestions based on your audience analytics."
                                },
                                {
                                    question: "What video formats are supported?",
                                    answer: "We support all major video formats including MP4, MOV, AVI, WMV, and more. Our system automatically optimizes your video for each platform's requirements."
                                }
                            ].map((faq, index) => (
                                <Card key={index} className="border-gray-200">
                                    <CardHeader className="cursor-pointer">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-lg font-semibold text-gray-900">
                                                {faq.question}
                                            </CardTitle>
                                            <ChevronDown className="w-5 h-5 text-gray-500" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                        
                        <div className="text-center mt-12">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Still have questions?</h3>
                            <p className="text-gray-600 mb-6">
                                Can't find the answer you're looking for? Please chat with our friendly team.
                            </p>
                            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                                <MessageSquare className="mr-2 w-5 h-5" />
                                Get in Touch
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
                {/* Background decorations */}
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/5 rounded-full blur-lg"></div>
                
                <div className="container mx-auto px-4 text-center relative z-10">
                    <Badge className="mb-6 bg-white/20 text-white border-white/30 backdrop-blur-sm">
                        🚀 Ready to Transform Your Content Strategy?
                    </Badge>
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        Start Growing Your Audience
                        <br />
                        <span className="bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                            Today
                        </span>
                    </h2>
                    <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
                        Join over 10,000 content creators who are already saving 5+ hours per week and increasing their reach by 300% with Tikomat.
                    </p>
                    
                    {/* CTA Benefits */}
                    <div className="flex flex-wrap justify-center gap-6 mb-10 text-white/90">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                            <CheckCircle className="w-5 h-5 text-green-300" />
                            <span>Free forever for YouTube</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                            <CheckCircle className="w-5 h-5 text-green-300" />
                            <span>Setup in under 60 seconds</span>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                            <CheckCircle className="w-5 h-5 text-green-300" />
                            <span>Cancel anytime</span>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                        <Link href="/register">
                            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-10 py-4 shadow-2xl">
                                Start Your Free Trial
                                <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </Link>
                        <Button size="lg" variant="outline" className="text-white border-white/30 bg-white/10 text-lg px-10 py-4 backdrop-blur-sm">
                            <Play className="mr-2 w-5 h-5" />
                            Watch Success Stories
                        </Button>
                    </div>

                    {/* Urgency/Scarcity */}
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-2xl mx-auto">
                        <p className="text-white font-semibold mb-2">
                            🔥 Limited Time: Get Pro features for just $0.60/day
                        </p>
                        <p className="text-blue-100 text-sm">
                            Usually $1.20/day • Save 50% for the first 1,000 users • 
                            <span className="font-semibold text-yellow-300"> 847 spots remaining</span>
                        </p>
                    </div>

                    <p className="text-blue-100 text-sm mt-6">
                        ⚡ Takes less than 60 seconds to get started • 💳 No credit card required for free plan
                    </p>
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
                                <Link href="/contact" className="block hover:text-white">Contact Us</Link>
                                <a href="#" className="block hover:text-white">Status</a>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Legal</h3>
                            <div className="space-y-2 text-gray-400">
                                <Link href="/privacy" className="block hover:text-white">Privacy Policy</Link>
                                <Link href="/terms" className="block hover:text-white">Terms of Service</Link>
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