import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { Facebook, ArrowLeft, Check } from 'lucide-react';

interface FacebookPage {
    id: string;
    name: string;
    access_token: string;
}

interface Props {
    channel: {
        id: number;
        name: string;
        slug: string;
    };
    pages: FacebookPage[];
}

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
        title: 'Facebook Page Selection',
        href: '#',
    },
];

export default function FacebookPageSelection({ channel, pages }: Props) {
    const [selectedPageId, setSelectedPageId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedPageId) {
            alert('Please select a Facebook page to connect.');
            return;
        }

        setIsSubmitting(true);
        
        router.post(`/channels/${channel.slug}/facebook/select-page`, {
            page_id: selectedPageId,
        }, {
            onFinish: () => setIsSubmitting(false),
            onError: () => setIsSubmitting(false),
        });
    };

    const handleGoBack = () => {
        router.get(`/channels/${channel.slug}`);
    };

    return (
        <AppLayout
            title="Select Facebook Page"
            renderHeader={() => (
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <Facebook className="h-6 w-6 text-blue-600" />
                        <span className="text-lg font-semibold">Facebook Page Selection</span>
                    </div>
                </div>
            )}
            breadcrumbs={breadcrumbs}
        >
            <Head title="Select Facebook Page" />

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Facebook className="h-5 w-5 text-blue-600" />
                            <span>Select Your Facebook Page</span>
                        </CardTitle>
                        <CardDescription>
                            Choose which Facebook page you want to connect to your "{channel.name}" channel. 
                            You can only connect one page at a time.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <RadioGroup 
                                    value={selectedPageId} 
                                    onValueChange={setSelectedPageId}
                                    className="space-y-3"
                                >
                                    {pages.map((page) => (
                                        <div 
                                            key={page.id} 
                                            className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                                        >
                                            <RadioGroupItem 
                                                value={page.id} 
                                                id={page.id}
                                                className="mt-0.5"
                                            />
                                            <Label 
                                                htmlFor={page.id} 
                                                className="flex-1 cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h3 className="font-medium text-gray-900">
                                                            {page.name}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            Page ID: {page.id}
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary" className="text-xs">
                                                        Facebook Page
                                                    </Badge>
                                                </div>
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>

                                {pages.length === 0 && (
                                    <div className="text-center py-12">
                                        <Facebook className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                                            No Facebook Pages Found
                                        </h3>
                                        <p className="text-gray-500 mb-4">
                                            You need to have admin access to at least one Facebook page to connect your account.
                                        </p>
                                        <p className="text-sm text-gray-400">
                                            Make sure you have created a Facebook page or have been granted admin access to an existing page.
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleGoBack}
                                        disabled={isSubmitting}
                                        className="flex items-center space-x-2"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        <span>Go Back</span>
                                    </Button>

                                    {pages.length > 0 && (
                                        <Button
                                            type="submit"
                                            disabled={!selectedPageId || isSubmitting}
                                            className="flex items-center space-x-2"
                                        >
                                            <Check className="h-4 w-4" />
                                            <span>
                                                {isSubmitting ? 'Connecting...' : 'Connect Page'}
                                            </span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                            <Facebook className="h-5 w-5 text-blue-600 mt-0.5" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-medium text-blue-900 mb-1">
                                About Facebook Page Connection
                            </h4>
                            <div className="text-sm text-blue-700 space-y-1">
                                <p>• You can only connect one Facebook page per channel</p>
                                <p>• You must have admin access to the page you want to connect</p>
                                <p>• Videos will be posted to the selected page when you publish content</p>
                                <p>• You can disconnect and reconnect to a different page at any time</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
} 