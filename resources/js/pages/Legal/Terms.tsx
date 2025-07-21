import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Scale, FileText, AlertTriangle, CheckCircle } from 'lucide-react';

export default function Terms() {
    return (
        <>
            <Head title="Terms of Service - Filmate" />
            
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="border-b bg-white">
                    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gray-900">Filmate</span>
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
                        <Scale className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
                        <p className="text-xl text-gray-600">
                            Please read these terms carefully before using Filmate's video publishing platform.
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>
                    </div>

                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Acceptance of Terms
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-600">
                                    By accessing and using Filmate ("the Service"), you accept and agree to be bound by these Terms of Service ("Terms"). 
                                    If you do not agree to these Terms, you may not use the Service.
                                </p>
                                <p className="text-gray-600">
                                    These Terms apply to all visitors, users, and others who access or use the Service.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Description of Service</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-600">
                                    Filmate is a video publishing platform that allows users to upload videos and distribute them 
                                    across multiple social media platforms simultaneously. Our services include:
                                </p>
                                <ul className="space-y-2 text-gray-600">
                                    <li>• Video upload and processing</li>
                                    <li>• Multi-platform publishing (YouTube, Instagram, TikTok, etc.)</li>
                                    <li>• Channel management</li>
                                    <li>• Publishing analytics and status tracking</li>
                                    <li>• Scheduling capabilities</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>User Accounts and Responsibilities</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Account Registration</h3>
                                    <p className="text-gray-600">
                                        You must provide accurate, current, and complete information during registration and 
                                        keep your account information updated.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Account Security</h3>
                                    <p className="text-gray-600">
                                        You are responsible for safeguarding your password and all activities under your account. 
                                        Notify us immediately of any unauthorized use.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">User Conduct</h3>
                                    <p className="text-gray-600">
                                        You agree to use the Service lawfully and in accordance with these Terms. 
                                        You will not engage in any activity that interferes with or disrupts the Service.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Content and Intellectual Property</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Your Content</h3>
                                    <p className="text-gray-600">
                                        You retain ownership of videos and content you upload. By using our Service, you grant us 
                                        a limited license to process, store, and publish your content as necessary to provide the Service.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Content Restrictions</h3>
                                    <p className="text-gray-600">You agree not to upload content that:</p>
                                    <ul className="space-y-1 text-gray-600 ml-4">
                                        <li>• Violates any laws or regulations</li>
                                        <li>• Infringes on intellectual property rights</li>
                                        <li>• Contains malicious code or viruses</li>
                                        <li>• Is offensive, discriminatory, or harmful</li>
                                        <li>• Violates platform-specific guidelines</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Social Media Platform Integration</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-600">
                                    When you connect social media accounts to Filmate:
                                </p>
                                <ul className="space-y-2 text-gray-600">
                                    <li>• You authorize us to publish content on your behalf</li>
                                    <li>• You remain responsible for compliance with each platform's terms</li>
                                    <li>• You can revoke access at any time through your account settings</li>
                                    <li>• We are not responsible for changes to third-party platform policies</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Subscription and Billing</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Free and Paid Plans</h3>
                                    <p className="text-gray-600">
                                        We offer both free and paid subscription plans. Free plans have limited features, 
                                        while paid plans provide access to additional platforms and features.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Billing</h3>
                                    <p className="text-gray-600">
                                        Subscription fees are billed in advance on a recurring basis. You can cancel your 
                                        subscription at any time through your account settings.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Refunds</h3>
                                    <p className="text-gray-600">
                                        Refunds are generally not provided for subscription fees, except as required by applicable law 
                                        or at our sole discretion.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <AlertTriangle className="w-5 h-5 mr-2" />
                                    Disclaimers and Limitations
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Service Availability</h3>
                                    <p className="text-gray-600">
                                        We strive to maintain high availability but do not guarantee uninterrupted service. 
                                        Maintenance, updates, or technical issues may cause temporary disruptions.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Third-Party Services</h3>
                                    <p className="text-gray-600">
                                        Our Service integrates with third-party platforms. We are not responsible for the 
                                        availability, performance, or policies of these external services.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Limitation of Liability</h3>
                                    <p className="text-gray-600">
                                        To the fullest extent permitted by law, Filmate shall not be liable for any indirect, 
                                        incidental, special, consequential, or punitive damages.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Termination</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-600">
                                    Either party may terminate this agreement at any time. Upon termination:
                                </p>
                                <ul className="space-y-2 text-gray-600">
                                    <li>• Your access to the Service will be suspended</li>
                                    <li>• We will delete your stored content according to our data retention policy</li>
                                    <li>• These Terms will remain in effect for previously published content</li>
                                    <li>• You remain responsible for any outstanding fees</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Changes to Terms</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-600">
                                    We reserve the right to modify these Terms at any time. We will notify users of material 
                                    changes via email or through the Service. Continued use of the Service after changes 
                                    constitutes acceptance of the new Terms.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 mb-4">
                                    If you have questions about these Terms of Service, please contact us:
                                </p>
                                <div className="space-y-2 text-gray-600">
                                    <p>Email: {import.meta.env.VITE_PUBLIC_EMAIL || 'legal@filmate.com'}</p>
                                    <p>Support: <Link href="/contact" className="text-blue-600 hover:underline">Contact Form</Link></p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="text-center mt-12 pt-8 border-t">
                        <p className="text-gray-500">
                            These Terms of Service are effective as of {new Date().toLocaleDateString()} and will remain in effect except with respect to any changes in its provisions in the future.
                        </p>
                    </div>
                </main>
            </div>
        </>
    );
} 