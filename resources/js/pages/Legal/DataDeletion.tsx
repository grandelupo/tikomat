import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Trash2, Shield, AlertTriangle, FileText, Clock, CheckCircle } from 'lucide-react';

export default function DataDeletion() {
    return (
        <>
            <Head title="Data Deletion - Tikomat" />
            
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <header className="border-b bg-white">
                    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                                <FileText className="w-5 h-5 text-white" />
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
                        <Trash2 className="w-16 h-16 text-red-600 mx-auto mb-4" />
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Data Deletion Request</h1>
                        <p className="text-xl text-gray-600">
                            Request the deletion of your personal data from our platform
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            Last updated: {new Date().toLocaleDateString()}
                        </p>
                    </div>

                    <div className="space-y-8">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                                    Important Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <p className="text-orange-800">
                                        <strong>Warning:</strong> Data deletion is permanent and cannot be undone. 
                                        Once your data is deleted, you will lose access to all your videos, 
                                        social media connections, and account information.
                                    </p>
                                </div>
                                <p className="text-gray-600">
                                    This page allows you to request the deletion of your personal data in compliance 
                                    with data protection regulations including GDPR and Facebook's data deletion requirements.
                                </p>
                                <p className="text-gray-600 mt-2">
                                    For more information about how we handle your data, please see our{' '}
                                    <Link href="/privacy" className="text-blue-600 hover:underline">
                                        Privacy Policy
                                    </Link>.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Shield className="w-5 h-5 mr-2" />
                                    What Data Will Be Deleted
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Account Information</h3>
                                    <ul className="space-y-1 text-gray-600">
                                        <li>• Your name, email address, and profile information</li>
                                        <li>• Account settings and preferences</li>
                                        <li>• Login credentials and authentication data</li>
                                        <li>• Subscription and billing information</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Content and Media</h3>
                                    <ul className="space-y-1 text-gray-600">
                                        <li>• All uploaded videos and associated metadata</li>
                                        <li>• Video processing history and analytics</li>
                                        <li>• Generated thumbnails and subtitles</li>
                                        <li>• Workflow configurations and templates</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Social Media Connections</h3>
                                    <ul className="space-y-1 text-gray-600">
                                        <li>• OAuth tokens and access credentials</li>
                                        <li>• Connected social media account information</li>
                                        <li>• Platform-specific channel data</li>
                                        <li>• Publishing history and statistics</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-2">Usage Data</h3>
                                    <ul className="space-y-1 text-gray-600">
                                        <li>• Service usage logs and analytics</li>
                                        <li>• Error reports and debugging information</li>
                                        <li>• Customer support interactions</li>
                                        <li>• Session data and cookies</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <Clock className="w-5 h-5 mr-2" />
                                    Deletion Process Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                        <div>
                                            <h4 className="font-semibold">Immediate Deletion (Within 24 hours)</h4>
                                            <p className="text-gray-600">Your account will be deactivated and you will lose immediate access to the platform.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                        <div>
                                            <h4 className="font-semibold">Data Processing (Within 30 days)</h4>
                                            <p className="text-gray-600">All personal data will be permanently deleted from our systems and backups.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start space-x-3">
                                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                                        <div>
                                            <h4 className="font-semibold">Confirmation (Within 45 days)</h4>
                                            <p className="text-gray-600">You will receive confirmation that your data has been completely deleted.</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center">
                                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                                    What Happens After Deletion
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-green-800">
                                        <strong>Complete Removal:</strong> Your data will be permanently deleted from all our systems, 
                                        including databases, file storage, and backup systems.
                                    </p>
                                </div>
                                <ul className="space-y-2 text-gray-600">
                                    <li>• Your account will be completely removed from our platform</li>
                                    <li>• All videos and content will be permanently deleted</li>
                                    <li>• Social media connections will be severed</li>
                                    <li>• You will no longer receive any communications from us</li>
                                    <li>• You can create a new account at any time if needed</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>How to Request Data Deletion</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-4">
                                    <div>
                                        <h3 className="font-semibold mb-2">Option 1: Through Your Account (Recommended)</h3>
                                        <p className="text-gray-600 mb-2">
                                            If you have an active account, you can request deletion directly from your account settings:
                                        </p>
                                        <ol className="list-decimal list-inside space-y-1 text-gray-600">
                                            <li>Log in to your Tikomat account</li>
                                            <li>Go to Settings → Account</li>
                                            <li>Click "Delete Account" at the bottom of the page</li>
                                            <li>Confirm your decision by entering your password</li>
                                        </ol>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-2">Option 2: Contact Support</h3>
                                        <p className="text-gray-600 mb-2">
                                            If you cannot access your account or prefer to contact us directly:
                                        </p>
                                        <ul className="space-y-1 text-gray-600">
                                            <li>Email: {import.meta.env.VITE_PUBLIC_EMAIL || 'privacy@tikomat.com'}</li>
                                            <li>Subject: "Data Deletion Request"</li>
                                            <li>Include your email address and reason for deletion</li>
                                            <li>We will respond within 48 hours to confirm your request</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Data Retention Exceptions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-gray-600">
                                    In certain circumstances, we may be required to retain some data for legal or regulatory purposes:
                                </p>
                                <ul className="space-y-2 text-gray-600">
                                    <li>• Financial records for tax and accounting purposes (7 years)</li>
                                    <li>• Legal compliance data when required by law</li>
                                    <li>• Security logs for fraud prevention (limited retention)</li>
                                    <li>• Data necessary for ongoing legal proceedings</li>
                                </ul>
                                <p className="text-gray-600 mt-4">
                                    Any retained data will be kept for the minimum time required and will not be used for any other purpose.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Contact Information</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-600 mb-4">
                                    For questions about data deletion or to exercise your data rights:
                                </p>
                                <div className="space-y-2 text-gray-600">
                                    <p>Email: {import.meta.env.VITE_PUBLIC_EMAIL || 'privacy@tikomat.com'}</p>
                                    <p>Support: <Link href="/contact" className="text-blue-600 hover:underline">Contact Form</Link></p>
                                    <p>Response Time: Within 48 hours</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="text-center mt-12 pt-8 border-t">
                        <p className="text-gray-500">
                            This Data Deletion Policy is effective as of {new Date().toLocaleDateString()} and complies with 
                            GDPR, CCPA, and Facebook's data deletion requirements.
                        </p>
                    </div>
                </main>
            </div>
        </>
    );
} 