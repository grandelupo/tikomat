import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Head, Link, useForm } from '@inertiajs/react';
import { 
    Mail, 
    Phone, 
    MapPin, 
    Clock, 
    Send, 
    MessageSquare, 
    Headphones, 
    Video as VideoIcon,
    Twitter,
    Facebook,
    Instagram,
    Youtube,
    ArrowLeft,
    CheckCircle
} from 'lucide-react';

interface ContactProps {
    auth?: {
        user?: {
            id: number;
            name: string;
            email: string;
        };
    };
}

export default function Contact({ auth }: ContactProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        email: auth?.user?.email || '',
        subject: 'General Inquiry',
        message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/contact', {
            onSuccess: () => {
                reset('message');
            },
        });
    };

    return (
        <>
            <Head title="Contact Us - Tikomat" />
            
            {/* Header */}
            <header className="border-b bg-white">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                            <VideoIcon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900">Tikomat</span>
                    </Link>
                    <nav className="hidden md:flex items-center space-x-8">
                        <Link href="/#features" className="text-gray-600 hover:text-gray-900">Features</Link>
                        <Link href="/#platforms" className="text-gray-600 hover:text-gray-900">Platforms</Link>
                        <Link href="/#pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
                        <Link href="/contact" className="text-blue-600 font-semibold">Contact</Link>
                    </nav>
                    <div className="flex items-center space-x-4">
                        {auth?.user ? (
                            <Link href="/dashboard">
                                <Button>Dashboard</Button>
                            </Link>
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

            {/* Breadcrumb */}
            <section className="bg-gray-50 py-4">
                <div className="container mx-auto px-4">
                    <div className="flex items-center space-x-2 text-sm">
                        <Link href="/" className="text-gray-500 hover:text-gray-700 flex items-center">
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </section>

            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-16">
                <div className="container mx-auto px-4 text-center">
                    <Badge className="mb-4 bg-blue-100 text-blue-800 border-blue-200">
                        💬 Get in Touch
                    </Badge>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Contact Our Team
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Have questions about Tikomat? Need help getting started? Our friendly team is here to help you succeed.
                    </p>
                </div>
            </section>

            {/* Contact Form & Info */}
            <section className="py-20 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
                        {/* Contact Form */}
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Send us a message</h2>
                            <p className="text-gray-600 mb-8">
                                Fill out the form below and we'll get back to you within 24 hours.
                            </p>
                            
                            <Card className="border-gray-200 shadow-lg">
                                <CardContent className="p-8">
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    First Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.first_name}
                                                    onChange={(e) => setData('first_name', e.target.value)}
                                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.first_name ? 'border-red-500' : 'border-gray-300'}`}
                                                    placeholder="John"
                                                    required
                                                />
                                                {errors.first_name && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Last Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={data.last_name}
                                                    onChange={(e) => setData('last_name', e.target.value)}
                                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.last_name ? 'border-red-500' : 'border-gray-300'}`}
                                                    placeholder="Doe"
                                                    required
                                                />
                                                {errors.last_name && (
                                                    <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email Address *
                                            </label>
                                            <input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="john@example.com"
                                                required
                                            />
                                            {errors.email && (
                                                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Subject *
                                            </label>
                                            <select 
                                                value={data.subject}
                                                onChange={(e) => setData('subject', e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.subject ? 'border-red-500' : 'border-gray-300'}`}
                                            >
                                                <option value="General Inquiry">General Inquiry</option>
                                                <option value="Technical Support">Technical Support</option>
                                                <option value="Billing Question">Billing Question</option>
                                                <option value="Feature Request">Feature Request</option>
                                                <option value="Partnership Inquiry">Partnership Inquiry</option>
                                                <option value="Bug Report">Bug Report</option>
                                            </select>
                                            {errors.subject && (
                                                <p className="text-red-500 text-sm mt-1">{errors.subject}</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Message *
                                            </label>
                                            <textarea
                                                rows={5}
                                                value={data.message}
                                                onChange={(e) => setData('message', e.target.value)}
                                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.message ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="Tell us how we can help you..."
                                                required
                                            />
                                            {errors.message && (
                                                <p className="text-red-500 text-sm mt-1">{errors.message}</p>
                                            )}
                                        </div>
                                        
                                        <Button 
                                            type="submit" 
                                            size="lg" 
                                            disabled={processing}
                                            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                                        >
                                            <Send className="mr-2 w-5 h-5" />
                                            {processing ? 'Sending...' : 'Send Message'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Contact Information */}
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-6">Get in touch</h2>
                            <p className="text-gray-600 mb-8">
                                Prefer to reach out directly? Here are all the ways you can contact us.
                            </p>

                            <div className="space-y-6">
                                {/* Email */}
                                <Card className="border-gray-200 hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                <Mail className="w-6 h-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Email Support</h3>
                                                <p className="text-gray-600">{import.meta.env.VITE_CONTACT_EMAIL || 'support@tikomat.com'}</p>
                                                <p className="text-sm text-gray-500">We respond within 24 hours</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Live Chat */}
                                <Card className="border-gray-200 hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                                <MessageSquare className="w-6 h-6 text-green-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Live Chat</h3>
                                                <p className="text-gray-600">Chat with us in real-time</p>
                                                <p className="text-sm text-gray-500">Available 10 AM - 6 PM EET</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Phone */}
                                <Card className="border-gray-200 hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                                <Phone className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Phone Support</h3>
                                                <p className="text-gray-600">{import.meta.env.VITE_CONTACT_PHONE || '+1 (555) 123-4567'}</p>
                                                <p className="text-sm text-gray-500">Pro & Enterprise customers only</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Office Hours */}
                                <Card className="border-gray-200 hover:shadow-lg transition-shadow">
                                    <CardContent className="p-6">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                                                <Clock className="w-6 h-6 text-orange-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">Business Hours</h3>
                                                <p className="text-gray-600">Monday - Friday: 9 AM - 6 PM EST</p>
                                                <p className="text-sm text-gray-500">Weekend support via email</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Social Media */}
                            <div className="mt-8">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Follow us on social media</h3>
                                <div className="flex space-x-4">
                                    <a href="#" className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors">
                                        <Twitter className="w-5 h-5 text-blue-600" />
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-colors">
                                        <Facebook className="w-5 h-5 text-blue-600" />
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center hover:bg-pink-200 transition-colors">
                                        <Instagram className="w-5 h-5 text-pink-600" />
                                    </a>
                                    <a href="#" className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center hover:bg-red-200 transition-colors">
                                        <Youtube className="w-5 h-5 text-red-600" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 bg-gray-50">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900 mb-4">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-gray-600 max-w-2xl mx-auto">
                            Quick answers to common questions. Don't see what you're looking for? Contact us directly.
                        </p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        {[
                            {
                                question: "How quickly do you respond to support requests?",
                                answer: "We respond to all support requests within 24 hours, typically much faster during business hours."
                            },
                            {
                                question: "Do you offer phone support?",
                                answer: "Phone support is available for Pro and Enterprise customers during business hours (9 AM - 6 PM EST)."
                            },
                            {
                                question: "Can I schedule a demo?",
                                answer: "Yes! Contact us to schedule a personalized demo of Tikomat's features and see how it can benefit your workflow."
                            },
                            {
                                question: "Do you offer custom integrations?",
                                answer: "For Enterprise customers, we can discuss custom integrations and API access. Contact our sales team for more information."
                            }
                        ].map((faq, index) => (
                            <Card key={index} className="border-gray-200">
                                <CardHeader>
                                    <CardTitle className="text-lg">{faq.question}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600">{faq.answer}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
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
                                <Link href="/#features" className="block hover:text-white">Features</Link>
                                <Link href="/#platforms" className="block hover:text-white">Platforms</Link>
                                <Link href="/#pricing" className="block hover:text-white">Pricing</Link>
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-4">Support</h3>
                            <div className="space-y-2 text-gray-400">
                                <Link href="/contact" className="block hover:text-white">Contact Us</Link>
                                <a href="#" className="block hover:text-white">Help Center</a>
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