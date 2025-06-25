import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
    AlertTriangle, 
    RefreshCw, 
    ArrowLeft, 
    ExternalLink,
    Youtube, 
    Instagram, 
    Video as VideoIcon, 
    Facebook,
    Twitter,
    Camera,
    Palette,
    HelpCircle
} from 'lucide-react';
import React from 'react';

interface Props {
    platform: string;
    channelSlug?: string;
    channelName?: string;
    errorMessage: string;
    errorCode?: string;
    errorDescription?: string;
    suggestedActions?: string[];
    supportInfo?: {
        contactEmail?: string;
        documentationUrl?: string;
    };
}

const platformIcons = {
    youtube: Youtube,
    instagram: Instagram,
    tiktok: VideoIcon,
    facebook: Facebook,
    snapchat: Camera,
    pinterest: Palette,
    twitter: Twitter,
};

const platformColors = {
    youtube: 'text-red-600',
    instagram: 'text-pink-600',
    tiktok: 'text-black',
    facebook: 'text-blue-600',
    snapchat: 'text-yellow-500',
    pinterest: 'text-red-500',
    twitter: 'text-blue-400',
};

const breadcrumbs = [
    {
        title: 'My channels',
        href: '/dashboard',
    },
    {
        title: 'Connections',
        href: '/connections',
    },
    {
        title: 'Connection Error',
        href: '#',
    },
];

export default function OAuthError({ 
    platform, 
    channelSlug, 
    channelName, 
    errorMessage, 
    errorCode, 
    errorDescription,
    suggestedActions = [],
    supportInfo = {}
}: Props) {
    const IconComponent = platformIcons[platform as keyof typeof platformIcons] || HelpCircle;
    const iconColor = platformColors[platform as keyof typeof platformColors] || 'text-gray-600';
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);

    const handleRetryConnection = () => {
        if (channelSlug) {
            window.location.href = `/channels/${channelSlug}/auth/${platform}`;
        } else {
            window.location.href = `/connections`;
        }
    };

    const getErrorDetails = () => {
        const details = [];
        
        if (errorCode) {
            details.push(`Error Code: ${errorCode}`);
        }
        
        if (errorDescription && errorDescription !== errorMessage) {
            details.push(`Details: ${errorDescription}`);
        }
        
        return details;
    };

    const getCommonSolutions = () => {
        const solutions = [
            'Make sure you have a stable internet connection',
            'Clear your browser cache and cookies',
            'Try using a different browser or incognito/private mode',
            'Disable browser extensions that might interfere with authentication',
        ];

        // Add platform-specific solutions
        switch (platform) {
            case 'youtube':
                solutions.push('Ensure your Google account has YouTube access enabled');
                solutions.push('Check if your Google account has 2-factor authentication properly configured');
                break;
            case 'facebook':
                solutions.push('Make sure you have admin access to the Facebook page you\'re trying to connect');
                solutions.push('Check if your Facebook account is in good standing');
                break;
            case 'instagram':
                solutions.push('Ensure your Instagram account is a Professional account (Business or Creator)');
                solutions.push('Personal Instagram accounts are not supported - convert to Professional in the Instagram app');
                solutions.push('Verify the app is properly configured in Facebook Developer Console for Instagram API with Instagram Login');
                solutions.push('Check that the redirect URL matches exactly what\'s configured in the Facebook app');
                solutions.push('Ensure the app has been approved for Instagram API with Instagram Login (not Basic Display)');
                break;
            case 'x':
                solutions.push('Verify that your X account is in good standing');
                solutions.push('Make sure you have the necessary permissions on the X account');
                break;
        }

        return solutions;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${platformName} Connection Error`} />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6 max-w-4xl mx-auto">
                {/* Error Header */}
                <div className="text-center">
                    <div className="flex justify-center mb-4">
                        <div className="relative">
                            <IconComponent className={`h-16 w-16 ${iconColor}`} />
                            <div className="absolute -bottom-2 -right-2 bg-red-100 rounded-full p-1">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                        Connection Failed
                    </h1>
                    <p className="text-lg text-muted-foreground mt-2">
                        Unable to connect {channelName ? `"${channelName}"` : 'your channel'} to {platformName}
                    </p>
                </div>

                {/* Error Details */}
                <Card className="border-red-200 bg-red-50/50">
                    <CardHeader>
                        <CardTitle className="text-red-800 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            Error Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Alert>
                            <AlertDescription className="text-red-700">
                                {errorMessage}
                            </AlertDescription>
                        </Alert>
                        
                        {getErrorDetails().length > 0 && (
                            <div className="text-sm text-red-600 space-y-1">
                                {getErrorDetails().map((detail, index) => (
                                    <p key={index}>{detail}</p>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Suggested Actions */}
                {suggestedActions.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RefreshCw className="h-5 w-5" />
                                Suggested Actions
                            </CardTitle>
                            <CardDescription>
                                Try these steps to resolve the connection issue
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-2">
                                {suggestedActions.map((action, index) => (
                                    <li key={index} className="flex items-start gap-2">
                                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium">
                                            {index + 1}
                                        </span>
                                        <span className="text-gray-700">{action}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Common Solutions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HelpCircle className="h-5 w-5" />
                            Common Solutions
                        </CardTitle>
                        <CardDescription>
                            These solutions resolve most connection issues
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2">
                            {getCommonSolutions().map((solution, index) => (
                                <li key={index} className="flex items-start gap-2">
                                    <span className="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full mt-2"></span>
                                    <span className="text-gray-700">{solution}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Button onClick={handleRetryConnection} className="w-full sm:w-auto">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                    </Button>
                    
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href="/connections">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Connections
                        </Link>
                    </Button>

                    {channelSlug && (
                        <Button variant="outline" asChild className="w-full sm:w-auto">
                            <Link href={`/channels/${channelSlug}`}>
                                View Channel
                            </Link>
                        </Button>
                    )}
                </div>

                {/* Support Information */}
                {(supportInfo.contactEmail || supportInfo.documentationUrl) && (
                    <Card className="bg-gray-50">
                        <CardHeader>
                            <CardTitle className="text-sm">Need Additional Help?</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {supportInfo.documentationUrl && (
                                <div>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={supportInfo.documentationUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            View Documentation
                                        </a>
                                    </Button>
                                </div>
                            )}
                            
                            {supportInfo.contactEmail && (
                                <div>
                                    <p className="text-sm text-gray-600">
                                        If the problem persists, contact support at{' '}
                                        <a 
                                            href={`mailto:${supportInfo.contactEmail}`}
                                            className="text-blue-600 hover:underline"
                                        >
                                            {supportInfo.contactEmail}
                                        </a>
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Debug Information (only shown in development) */}
                {process.env.NODE_ENV === 'development' && (
                    <Card className="border-gray-200 bg-gray-50">
                        <CardHeader>
                            <CardTitle className="text-sm text-gray-600">
                                Debug Information (Development Only)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                                {JSON.stringify({
                                    platform,
                                    channelSlug,
                                    channelName,
                                    errorCode,
                                    errorMessage,
                                    errorDescription,
                                    timestamp: new Date().toISOString()
                                }, null, 2)}
                            </pre>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
} 