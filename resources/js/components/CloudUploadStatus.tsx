import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Cloud, CheckCircle, XCircle, Clock, AlertCircle, ExternalLink } from 'lucide-react';

interface CloudUploadStatusProps {
    providers?: string[];
    status?: Record<string, string>;
    results?: Record<string, any>;
    compact?: boolean;
    showDetails?: boolean;
}

export default function CloudUploadStatus({
    providers = [],
    status = {},
    results = {},
    compact = false,
    showDetails = true,
}: CloudUploadStatusProps) {
    const getStatusIcon = (providerStatus: string) => {
        switch (providerStatus) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-600" />;
            case 'processing':
                return <Clock className="w-4 h-4 text-blue-600" />;
            case 'pending':
                return <AlertCircle className="w-4 h-4 text-yellow-600" />;
            default:
                return <Cloud className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (providerStatus: string) => {
        switch (providerStatus) {
            case 'success':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'failed':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'processing':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusText = (providerStatus: string) => {
        switch (providerStatus) {
            case 'success':
                return 'Uploaded';
            case 'failed':
                return 'Failed';
            case 'processing':
                return 'Uploading';
            case 'pending':
                return 'Pending';
            default:
                return 'None';
        }
    };

    const getProviderDisplayName = (provider: string) => {
        switch (provider) {
            case 'google_drive':
                return 'Google Drive';
            case 'dropbox':
                return 'Dropbox';
            default:
                return provider;
        }
    };

    const hasInProgress = providers.some(provider => {
        const providerStatus = status[provider] || 'none';
        return ['pending', 'processing'].includes(providerStatus);
    });

    const completedUploads = providers.filter(provider => {
        const providerStatus = status[provider] || 'none';
        return providerStatus === 'success';
    }).length;

    const failedUploads = providers.filter(provider => {
        const providerStatus = status[provider] || 'none';
        return providerStatus === 'failed';
    }).length;

    if (providers.length === 0) {
        return null;
    }

    if (compact) {
        return (
            <div className="flex items-center space-x-2">
                <Cloud className="w-4 h-4 text-gray-500" />
                <div className="flex space-x-1">
                    {providers.map((provider) => {
                        const providerStatus = status[provider] || 'none';
                        return (
                            <div
                                key={provider}
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs border ${getStatusColor(
                                    providerStatus
                                )}`}
                                title={`${getProviderDisplayName(provider)}: ${getStatusText(providerStatus)}`}
                            >
                                {getStatusIcon(providerStatus)}
                                <span className="ml-1">{getProviderDisplayName(provider)}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Cloud className="w-5 h-5 text-gray-500" />
                    <h4 className="font-medium">Cloud Storage Backup</h4>
                </div>
                {hasInProgress && (
                    <Badge variant="secondary">
                        Uploading...
                    </Badge>
                )}
            </div>

            {showDetails && providers.length > 0 && (
                <div className="space-y-3">
                    {/* Overall Progress */}
                    {hasInProgress && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Upload Progress</span>
                                <span>{completedUploads} of {providers.length} completed</span>
                            </div>
                            <Progress 
                                value={(completedUploads / providers.length) * 100} 
                                className="h-2"
                            />
                        </div>
                    )}

                    {/* Individual Provider Status */}
                    <div className="grid gap-3">
                        {providers.map((provider) => {
                            const providerStatus = status[provider] || 'none';
                            const result = results[provider];

                            return (
                                <div
                                    key={provider}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div className="flex items-center space-x-3">
                                        {getStatusIcon(providerStatus)}
                                        <div>
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium">
                                                    {getProviderDisplayName(provider)}
                                                </span>
                                                <Badge 
                                                    variant="outline" 
                                                    className={getStatusColor(providerStatus)}
                                                >
                                                    {getStatusText(providerStatus)}
                                                </Badge>
                                            </div>
                                            {result && (
                                                <div className="text-sm text-gray-600 mt-1">
                                                    {providerStatus === 'success' && result.file_name && (
                                                        <span>Uploaded as: {result.file_name}</span>
                                                    )}
                                                    {providerStatus === 'failed' && result.error && (
                                                        <span className="text-red-600">
                                                            Error: {result.error}
                                                        </span>
                                                    )}
                                                    {result.uploaded_at && (
                                                        <span className="text-gray-500 block">
                                                            {new Date(result.uploaded_at).toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex space-x-2">
                                        {providerStatus === 'success' && result && (
                                            <>
                                                {result.web_view_link && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => window.open(result.web_view_link, '_blank')}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                )}
                                                {result.shareable_link && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => window.open(result.shareable_link, '_blank')}
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </>
                                        )}
                                        
                                        {providerStatus === 'failed' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    // TODO: Implement retry functionality
                                                    console.log('Retry upload for', provider);
                                                }}
                                            >
                                                Retry
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Summary */}
                    {!hasInProgress && (
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">
                            {completedUploads > 0 && (
                                <span className="text-green-600">
                                    ✓ {completedUploads} successful upload{completedUploads !== 1 ? 's' : ''}
                                </span>
                            )}
                            {failedUploads > 0 && (
                                <span className="text-red-600 ml-4">
                                    ✗ {failedUploads} failed upload{failedUploads !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
} 