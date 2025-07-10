import React from 'react';
import { Head, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Cloud, Check, ExternalLink, Unlink } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { useToast } from '@/hooks/use-toast';
import HeadingSmall from '@/components/heading-small';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Cloud Storage settings',
        href: '/settings/cloud-storage',
    },
];

interface CloudProvider {
    id: string;
    name: string;
    description: string;
    icon: string;
}

interface ConnectedAccount {
    provider: string;
    provider_name: string;
    provider_email: string;
    created_at: string;
}

interface CloudStorageProps {
    connectedAccounts: ConnectedAccount[];
    availableProviders: CloudProvider[];
}

export default function CloudStorage({ connectedAccounts, availableProviders }: CloudStorageProps) {
    const { toast } = useToast();

    const isProviderConnected = (providerId: string): boolean => {
        return connectedAccounts.some(account => account.provider === providerId);
    };

    const getConnectedAccount = (providerId: string): ConnectedAccount | undefined => {
        return connectedAccounts.find(account => account.provider === providerId);
    };

    const handleConnect = (providerId: string) => {
        // Redirect to OAuth flow with settings redirect parameter
        window.location.href = `/cloud-storage/${providerId}/auth?redirect=settings`;
    };

    const handleDisconnect = (providerId: string, providerName: string) => {
        if (confirm(`Are you sure you want to disconnect ${providerName}? This will remove access to your ${providerName} files.`)) {
            router.delete(`/cloud-storage/${providerId}/disconnect`, {
                data: { from: 'settings' },
                onSuccess: () => {
                    toast({
                        title: 'Success',
                        description: `${providerName} disconnected successfully`,
                        variant: 'success'
                    });
                },
                onError: (errors) => {
                    toast({
                        title: 'Error',
                        description: 'Failed to disconnect. Please try again.',
                        variant: 'destructive'
                    });
                }
            });
        }
    };

    const getProviderIcon = (iconName: string) => {
        switch (iconName) {
            case 'google-drive':
                return (
                    <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center">
                        <Cloud className="w-4 h-4 text-white" />
                    </div>
                );
            case 'dropbox':
                return (
                    <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
                        <Cloud className="w-4 h-4 text-white" />
                    </div>
                );
            default:
                return (
                    <div className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center">
                        <Cloud className="w-4 h-4 text-white" />
                    </div>
                );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cloud Storage Settings" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall 
                        title="Cloud Storage" 
                        description="Connect your cloud storage accounts to automatically upload your videos."
                    />

                    <Separator />

                    <div className="space-y-4">
                        {availableProviders.map((provider) => {
                            const isConnected = isProviderConnected(provider.id);
                            const account = getConnectedAccount(provider.id);

                            return (
                                <Card key={provider.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                {getProviderIcon(provider.icon)}
                                                <div>
                                                    <CardTitle className="flex items-center space-x-2">
                                                        <span>{provider.name}</span>
                                                        {isConnected && (
                                                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                                <Check className="w-3 h-3 mr-1" />
                                                                Connected
                                                            </Badge>
                                                        )}
                                                    </CardTitle>
                                                    <CardDescription>
                                                        {provider.description}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center space-x-2">
                                                {isConnected ? (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDisconnect(provider.id, provider.name)}
                                                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Unlink className="w-4 h-4 mr-1" />
                                                        Disconnect
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={() => handleConnect(provider.id)}
                                                        size="sm"
                                                    >
                                                        <ExternalLink className="w-4 h-4 mr-1" />
                                                        Connect
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardHeader>
                                    
                                    {isConnected && account && (
                                        <CardContent className="pt-0">
                                            <div className="bg-muted/50 rounded-lg p-3">
                                                <div className="space-y-1 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Account:</span>
                                                        <span className="font-medium">{account.provider_email}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-muted-foreground">Connected:</span>
                                                        <span>{new Date(account.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    )}

                                    {!isConnected && (
                                        <CardContent className="pt-0">
                                            <div className="text-center py-6 text-muted-foreground">
                                                <p className="mb-3">Connect {provider.name} to select upload folders</p>
                                                <Button
                                                    onClick={() => handleConnect(provider.id)}
                                                    className="inline-flex items-center space-x-2"
                                                >
                                                    <ExternalLink className="w-4 h-4" />
                                                    <span>Connect {provider.name}</span>
                                                </Button>
                                            </div>
                                        </CardContent>
                                    )}
                                </Card>
                            );
                        })}
                    </div>

                    {connectedAccounts.length === 0 && (
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center py-8">
                                    <Cloud className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                    <h3 className="text-lg font-medium mb-2">No cloud storage connected</h3>
                                    <p className="text-muted-foreground mb-4">
                                        Connect your cloud storage accounts to automatically upload and sync your videos.
                                    </p>
                                    <div className="space-y-2">
                                        {availableProviders.map((provider) => (
                                            <Button
                                                key={provider.id}
                                                onClick={() => handleConnect(provider.id)}
                                                variant="outline"
                                                className="mr-2"
                                            >
                                                <ExternalLink className="w-4 h-4 mr-1" />
                                                Connect {provider.name}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>About Cloud Storage</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm text-muted-foreground">
                            <p>
                                When you connect a cloud storage provider, you can choose to automatically upload your videos to those services during the video creation process.
                            </p>
                            <p>
                                Your cloud storage credentials are securely stored and only used to upload files with your explicit permission.
                            </p>
                            <p>
                                You can disconnect any provider at any time. This will not delete files that have already been uploaded.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
} 