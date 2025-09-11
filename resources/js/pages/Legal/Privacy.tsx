import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';

export default function Privacy() {
    return (
        <>
            <Head title="Privacy Policy - Filmate" />

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
                        <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
                        <p className="text-xl text-gray-600">
                            Your privacy is important to us. This policy explains how we collect, use, and protect your data.
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>
                    </div>

                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Eye className="w-5 h-5 mr-2" />
                                    Information We Collect
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Account Information</h3>
                                    <p className="text-gray-600">
                                        When you create an account, we collect your name, email address, and encrypted password.
                                        This information is necessary to provide our video publishing services.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Content and Usage Data</h3>
                                    <p className="text-gray-600">
                                        We store videos you upload temporarily for processing and publishing to your connected social media platforms.
                                        We also collect usage statistics to improve our service.
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Social Media Connections</h3>
                                    <p className="text-gray-600">
                                        When you connect social media accounts, we store OAuth tokens securely to enable video publishing.
                                        We never access your social media accounts beyond video publishing functionality.
                                    </p>
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                        <h4 className="font-medium text-gray-800 mb-2">Snapchat Integration</h4>
                                        <p className="text-gray-600 text-sm">
                                            When you connect your Snapchat account, we use Snapchat's Login Kit for authentication and Creative Kit for content sharing.
                                            This allows us to publish your videos directly to your Snapchat account. We only access the minimum permissions
                                            necessary for video publishing and do not store or access your Snapchat friends list, personal snaps, or other private content.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Lock className="w-5 h-5 mr-2" />
                                    How We Use Your Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <ul className="space-y-2 text-gray-600">
                                    <li>• Provide video publishing services across social media platforms</li>
                                    <li>• Process and temporarily store your video content for publishing</li>
                                    <li>• Maintain and improve our service quality</li>
                                    <li>• Send important service notifications and updates</li>
                                    <li>• Provide customer support when requested</li>
                                    <li>• Ensure security and prevent abuse of our services</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Data Security and Storage</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-600">
                                    We implement industry-standard security measures to protect your data:
                                </p>
                                <ul className="space-y-2 text-gray-600">
                                    <li>• All data is encrypted in transit and at rest</li>
                                    <li>• OAuth tokens are securely encrypted before storage</li>
                                    <li>• Videos are automatically deleted after successful publishing</li>
                                    <li>• We use secure, certified hosting providers</li>
                                    <li>• Regular security audits and monitoring</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Data Sharing and Third Parties</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-600">
                                    We do not sell or rent your personal information. We only share data in these limited circumstances:
                                </p>
                                <ul className="space-y-2 text-gray-600">
                                    <li>• With social media platforms when you explicitly authorize video publishing</li>
                                    <li>• With service providers who help us operate our platform (under strict confidentiality)</li>
                                    <li>• When required by law or to protect our rights and users' safety</li>
                                </ul>
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <h4 className="font-medium text-yellow-800 mb-2">Snapchat Data Sharing</h4>
                                    <p className="text-yellow-700 text-sm">
                                        When you use our Snapchat integration, your video content is shared directly with Snapchat through their
                                        Creative Kit API. This data transfer is governed by Snapchat's privacy policy and terms of service.
                                        We do not store copies of content sent to Snapchat beyond the temporary processing period required for publishing.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Your Rights and Choices</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-600">You have the following rights regarding your data:</p>
                                <ul className="space-y-2 text-gray-600">
                                    <li>• Access and download your personal data</li>
                                    <li>• Correct inaccurate information</li>
                                    <li>• Delete your account and associated data</li>
                                    <li>• Disconnect social media accounts at any time</li>
                                    <li>• Opt out of non-essential communications</li>
                                </ul>
                                <p className="text-gray-600 mt-4">
                                    To exercise these rights, please contact us at {import.meta.env.VITE_PUBLIC_EMAIL || 'privacy@filmate.com'}.
                                </p>
                                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-blue-800">
                                        <strong>Data Deletion:</strong> To request the deletion of your personal data,
                                        please visit our{' '}
                                        <Link href="/data-deletion" className="text-blue-600 hover:underline font-semibold">
                                            Data Deletion Request page
                                        </Link>
                                        {' '}or contact us directly.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Cookies and Tracking</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-600">
                                    We use essential cookies to ensure our service functions properly. These cookies:
                                </p>
                                <ul className="space-y-2 text-gray-600">
                                    <li>• Maintain your login session</li>
                                    <li>• Remember your preferences</li>
                                    <li>• Provide security features</li>
                                </ul>
                                <p className="text-gray-600 mt-4">
                                    We do not use third-party tracking cookies or advertising networks.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 mb-4">
                                    If you have questions about this Privacy Policy or our data practices, please contact us:
                                </p>
                                <div className="space-y-2 text-gray-600">
                                    <p>Email: {import.meta.env.VITE_PUBLIC_EMAIL || 'privacy@filmate.com'}</p>
                                    <p>Support: <Link href="/contact" className="text-blue-600 hover:underline">Contact Form</Link></p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="text-center mt-12 pt-8 border-t">
                        <p className="text-gray-500">
                            This Privacy Policy is effective as of {new Date().toLocaleDateString()} and will remain in effect except with respect to any changes in its provisions in the future.
                        </p>
                    </div>
                </main>
            </div>
        </>
    );
}