import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Cloud, Download, Search, FileVideo, Calendar, HardDrive, X, CheckCircle } from 'lucide-react';
import axios from 'axios';

interface CloudFile {
    id: string;
    name: string;
    size?: number;
    mimeType?: string;
    modifiedTime?: string;
    downloadUrl?: string;
    path?: string;
    modified?: string;
}

interface CloudStorageImportProps {
    onFileImported: (file: File, fileName: string) => void;
    isOpen: boolean;
    onClose: () => void;
}

export default function CloudStorageImport({ onFileImported, isOpen, onClose }: CloudStorageImportProps) {
    const [connectedAccounts, setConnectedAccounts] = useState<any[]>([]);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [files, setFiles] = useState<CloudFile[]>([]);
    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadConnectedAccounts();
        }
    }, [isOpen]);

    const loadConnectedAccounts = async () => {
        try {
            const response = await axios.get('/cloud-storage/connected');
            setConnectedAccounts(response.data);
        } catch (error) {
            console.error('Failed to load connected accounts:', error);
        }
    };

    const connectProvider = (provider: string) => {
        window.location.href = `/cloud-storage/${provider}/auth`;
    };

    const loadFiles = async (provider: string) => {
        setLoading(true);
        setSelectedProvider(provider);
        try {
            const response = await axios.get(`/cloud-storage/${provider}/files`, {
                params: { limit: 50 }
            });
            setFiles(response.data.files);
        } catch (error) {
            console.error('Failed to load files:', error);
            alert('Failed to load files from ' + provider);
        } finally {
            setLoading(false);
        }
    };

    const importFile = async (file: CloudFile) => {
        setImporting(file.id);
        try {
            const response = await axios.post(`/cloud-storage/${selectedProvider}/import`, {
                file_id: file.id,
                file_name: file.name,
            });

            if (response.data.success) {
                // Create a File object from the imported data
                const blob = new Blob([], { type: file.mimeType || 'video/mp4' });
                const importedFile = new File([blob], file.name, { type: file.mimeType || 'video/mp4' });
                
                // Add custom properties to track it's from cloud storage
                (importedFile as any).tempPath = response.data.temp_path;
                (importedFile as any).isCloudImport = true;
                
                onFileImported(importedFile, file.name);
                onClose();
            }
        } catch (error) {
            console.error('Failed to import file:', error);
            alert('Failed to import file: ' + file.name);
        } finally {
            setImporting('');
        }
    };

    const formatFileSize = (bytes?: number) => {
        if (bytes === undefined || bytes === null) return 'Calculating...';
        if (bytes === 0) return '0 Bytes';
        
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        const size = Math.round(bytes / Math.pow(1024, i) * 100) / 100;
        return size + ' ' + sizes[i];
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Unknown date';
        return new Date(dateString).toLocaleDateString();
    };

    const filteredFiles = files.filter(file => 
        file.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isProviderConnected = (provider: string) => {
        return connectedAccounts.some(account => account.provider === provider);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Cloud className="w-5 h-5 mr-2" />
                        Import from Cloud Storage
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 flex flex-col overflow-hidden">
                    {!selectedProvider ? (
                        <div className="space-y-4">
                            <p className="text-muted-foreground">
                                Connect and import videos from your cloud storage accounts.
                            </p>

                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Google Drive */}
                                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <HardDrive className="w-5 h-5 mr-2 text-blue-500" />
                                                Google Drive
                                            </div>
                                            {isProviderConnected('google_drive') && (
                                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Connected
                                                </Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Import videos from your Google Drive account.
                                        </p>
                                        {isProviderConnected('google_drive') ? (
                                            <Button 
                                                onClick={() => loadFiles('google_drive')}
                                                className="w-full"
                                            >
                                                Browse Files
                                            </Button>
                                        ) : (
                                            <Button 
                                                onClick={() => connectProvider('google_drive')}
                                                variant="outline"
                                                className="w-full"
                                            >
                                                Connect Google Drive
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Dropbox */}
                                <Card className="cursor-pointer hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <HardDrive className="w-5 h-5 mr-2 text-blue-600" />
                                                Dropbox
                                            </div>
                                            {isProviderConnected('dropbox') && (
                                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Connected
                                                </Badge>
                                            )}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            Import videos from your Dropbox account.
                                        </p>
                                        {isProviderConnected('dropbox') ? (
                                            <Button 
                                                onClick={() => loadFiles('dropbox')}
                                                className="w-full"
                                            >
                                                Browse Files
                                            </Button>
                                        ) : (
                                            <Button 
                                                onClick={() => connectProvider('dropbox')}
                                                variant="outline"
                                                className="w-full"
                                            >
                                                Connect Dropbox
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center">
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => setSelectedProvider('')}
                                    >
                                        ← Back
                                    </Button>
                                    <h3 className="text-lg font-semibold ml-2">
                                        {selectedProvider === 'google_drive' ? 'Google Drive' : 'Dropbox'} Files
                                    </h3>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Search className="w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search videos..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-64"
                                    />
                                </div>
                            </div>

                            <Separator className="mb-4" />

                            {loading ? (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                        <p className="text-muted-foreground">Loading files...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 overflow-y-auto border rounded-lg">
                                    <div className="p-4 space-y-2">
                                        {filteredFiles.length > 0 ? (
                                            filteredFiles.map((file) => (
                                                <Card key={file.id} className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <FileVideo className="w-5 h-5 text-blue-500" />
                                                            <div>
                                                                <p className="font-medium">{file.name}</p>
                                                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                                    <span>{formatFileSize(file.size)}</span>
                                                                    <span className="flex items-center">
                                                                        <Calendar className="w-3 h-3 mr-1" />
                                                                        {formatDate(file.modifiedTime || file.modified)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            onClick={() => importFile(file)}
                                                            disabled={importing === file.id}
                                                            size="sm"
                                                        >
                                                            {importing === file.id ? (
                                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                            ) : (
                                                                <>
                                                                    <Download className="w-4 h-4 mr-1" />
                                                                    Import
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </Card>
                                            ))
                                        ) : (
                                            <div className="text-center py-8">
                                                <FileVideo className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                                                <p className="text-muted-foreground">No video files found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
} 