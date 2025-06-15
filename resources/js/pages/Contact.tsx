import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Mail, MessageSquare, Send, User, Clock } from 'lucide-react';

interface ContactProps {
    user?: {
        id: number;
        name: string;
        email: string;
    };
}

export default function Contact({ user }: ContactProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/contact', {
            onSuccess: () => {
                reset('subject', 'message');
            },
        });
    };

    return (
        <>
            <Head title="Contact Us - Tikomat" />
            
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="border-b bg-white">
                    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <Mail className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Tikomat</span>
                        </Link>
                        <Link href="/">
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </header>

                <main className="container mx-auto px-4 py-12 max-w-4xl">
                    <div className="text-center mb-12">
                        <MessageSquare className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
                        <p className="text-xl text-gray-600">
                            Have questions, feedback, or need support? We'd love to hear from you.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Contact Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Send className="w-5 h-5 mr-2" />
                                    Send us a Message
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Name */}
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name *</Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Your name"
                                            className={errors.name ? 'border-red-500' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="your.email@example.com"
                                            className={errors.email ? 'border-red-500' : ''}
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-red-600">{errors.email}</p>
                                        )}
                                    </div>

                                    {/* Subject */}
                                    <div className="space-y-2">
                                        <Label htmlFor="subject">Subject *</Label>
                                        <Input
                                            id="subject"
                                            type="text"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            placeholder="What is this about?"
                                            className={errors.subject ? 'border-red-500' : ''}
                                        />
                                        {errors.subject && (
                                            <p className="text-sm text-red-600">{errors.subject}</p>
                                        )}
                                    </div>

                                    {/* Message */}
                                    <div className="space-y-2">
                                        <Label htmlFor="message">Message *</Label>
                                        <Textarea
                                            id="message"
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            placeholder="Tell us more about your question or feedback..."
                                            rows={6}
                                            className={errors.message ? 'border-red-500' : ''}
                                        />
                                        {errors.message && (
                                            <p className="text-sm text-red-600">{errors.message}</p>
                                        )}
                                    </div>

                                    {/* Submit Button */}
                                    <Button type="submit" disabled={processing} className="w-full">
                                        {processing ? 'Sending...' : 'Send Message'}
                                        <Send className="w-4 h-4 ml-2" />
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Contact Information */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <Clock className="w-5 h-5 mr-2" />
                                        Response Time
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 mb-4">
                                        We typically respond to messages within 24 hours during business days.
                                    </p>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p><strong>Business Hours:</strong> Monday - Friday, 9:00 AM - 6:00 PM (EST)</p>
                                        <p><strong>Weekend Support:</strong> Limited availability</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <User className="w-5 h-5 mr-2" />
                                        Other Ways to Reach Us
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold mb-2">Live Chat</h3>
                                        <p className="text-gray-600 text-sm mb-2">
                                            For registered users, we offer live chat support through your dashboard.
                                        </p>
                                        {user ? (
                                            <Link href="/chat">
                                                <Button variant="outline" size="sm">
                                                    <MessageSquare className="w-4 h-4 mr-2" />
                                                    Open Chat
                                                </Button>
                                            </Link>
                                        ) : (
                                            <p className="text-gray-500 text-sm">
                                                <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link> to access live chat
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Email Support</h3>
                                        <p className="text-gray-600 text-sm">
                                            You can also email us directly at:
                                        </p>
                                        <a href="mailto:support@tikomat.com" className="text-blue-600 hover:underline text-sm">
                                            support@tikomat.com
                                        </a>
                                    </div>

                                    <div>
                                        <h3 className="font-semibold mb-2">Common Questions</h3>
                                        <p className="text-gray-600 text-sm">
                                            Check out our FAQ section for answers to frequently asked questions.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>What to Include</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-600 text-sm mb-3">
                                        To help us assist you better, please include:
                                    </p>
                                    <ul className="space-y-1 text-sm text-gray-600">
                                        <li>• Detailed description of your issue</li>
                                        <li>• Steps you've already tried</li>
                                        <li>• Browser and device information (if applicable)</li>
                                        <li>• Screenshots or error messages</li>
                                        <li>• Your account email (if you have an account)</li>
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
} 