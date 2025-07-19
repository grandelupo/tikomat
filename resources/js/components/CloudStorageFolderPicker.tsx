import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Cloud, Folder, Plus, ChevronRight, Link, Check } from 'lucide-react';

interface CloudProvider {
    provider: string;
    provider_name: string;
    provider_email: string;
}

interface CloudFolder {
    id: string;
    name: string;
    path?: string; // For Dropbox
    parents?: string[]; // For Google Drive
}

interface CloudStorageFolderPickerProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectionChange: (providers: string[], folders: Record<string, string>) => void;
    selectedProviders: string[];
    selectedFolders: Record<string, string>;
}

// Available cloud storage providers
const AVAILABLE_PROVIDERS = [
    { id: 'google_drive', name: 'Google Drive', description: 'Upload videos to Google Drive' },
    { id: 'dropbox', name: 'Dropbox', description: 'Upload videos to Dropbox' },
];

export default function CloudStorageFolderPicker({
    isOpen,
    onClose,
    onSelectionChange,
    selectedProviders,
    selectedFolders,
}: CloudStorageFolderPickerProps) {
    const [connectedAccounts, setConnectedAccounts] = useState<CloudProvider[]>([]);
    const [loading, setLoading] = useState(false);
    const [connecting, setConnecting] = useState<string>('');
    const [folders, setFolders] = useState<Record<string, CloudFolder[]>>({});
    const [currentPath, setCurrentPath] = useState<Record<string, string>>({});
    const [breadcrumbs, setBreadcrumbs] = useState<Record<string, Array<{ id: string; name: string }>>>({});
    const [newFolderName, setNewFolderName] = useState('');
    const [creatingFolder, setCreatingFolder] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadConnectedAccounts();
        }
    }, [isOpen]);

    // Check for OAuth callback completion
    useEffect(() => {
        const checkForOAuthCompletion = () => {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('oauth_completed') === 'cloud_storage') {
                // OAuth flow completed, refresh connected accounts
                setTimeout(() => {
                    loadConnectedAccounts();
                }, 500); // Small delay to ensure the backend has processed the connection
                
                // Clean up URL parameters
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, '', cleanUrl);
            }
        };

        if (isOpen) {
            checkForOAuthCompletion();
            
            // Also check when the window regains focus (user returned from OAuth)
            const handleFocus = () => {
                loadConnectedAccounts();
            };
            
            window.addEventListener('focus', handleFocus);
            
            return () => {
                window.removeEventListener('focus', handleFocus);
            };
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

    const handleConnect = (provider: string) => {
        setConnecting(provider);
        // Redirect to OAuth flow
        window.location.href = `/cloud-storage/${provider}/auth?redirect=folder_picker`;
    };

    const isProviderConnected = (providerId: string): boolean => {
        return connectedAccounts.some(account => account.provider === providerId);
    };

    const getConnectedAccount = (providerId: string): CloudProvider | undefined => {
        return connectedAccounts.find(account => account.provider === providerId);
    };

    const loadFolders = async (provider: string, parentId?: string, path?: string) => {
        setLoading(true);
        try {
            const params: any = {};
            if (provider === 'google_drive' && parentId) {
                params.parent_id = parentId;
            }
            if (provider === 'dropbox' && path) {
                params.path = path;
            }

            const response = await axios.get(`/cloud-storage/${provider}/folders`, { params });
            setFolders(prev => ({
                ...prev,
                [provider]: response.data.folders,
            }));
        } catch (error) {
            console.error('Failed to load folders:', error);
        } finally {
            setLoading(false);
        }
    };

    const navigateToFolder = (provider: string, folder: CloudFolder) => {
        const newPath = provider === 'google_drive' ? folder.id : folder.path || '';
        setCurrentPath(prev => ({ ...prev, [provider]: newPath }));
        
        // Update breadcrumbs
        setBreadcrumbs(prev => ({
            ...prev,
            [provider]: [
                ...(prev[provider] || []),
                { id: folder.id, name: folder.name }
            ]
        }));

        loadFolders(provider, folder.id, folder.path);
    };

    const navigateToBreadcrumb = (provider: string, index: number) => {
        const providerBreadcrumbs = breadcrumbs[provider] || [];
        const newBreadcrumbs = providerBreadcrumbs.slice(0, index + 1);
        
        setBreadcrumbs(prev => ({ ...prev, [provider]: newBreadcrumbs }));
        
        const targetFolder = newBreadcrumbs[newBreadcrumbs.length - 1];
        if (targetFolder) {
            setCurrentPath(prev => ({ ...prev, [provider]: targetFolder.id }));
            loadFolders(provider, targetFolder.id, targetFolder.id);
        } else {
            // Navigate to root
            setCurrentPath(prev => ({ ...prev, [provider]: '' }));
            loadFolders(provider);
        }
    };

    const createFolder = async (provider: string) => {
        if (!newFolderName.trim()) return;

        setCreatingFolder(provider);
        try {
            const data: any = { name: newFolderName };
            const current = currentPath[provider];
            
            if (provider === 'google_drive') {
                data.parent_id = current || null;
            } else if (provider === 'dropbox') {
                data.parent_path = current || '';
            }

            const response = await axios.post(`/cloud-storage/${provider}/folders`, data);
            
            if (response.data.success) {
                // Reload folders to show the new one
                loadFolders(provider, current, current);
                setNewFolderName('');
            }
        } catch (error) {
            console.error('Failed to create folder:', error);
        } finally {
            setCreatingFolder('');
        }
    };

    const handleProviderToggle = (provider: string, checked: boolean) => {
        let newProviders = [...selectedProviders];
        let newFolders = { ...selectedFolders };

        if (checked) {
            if (!newProviders.includes(provider)) {
                newProviders.push(provider);
            }
            // Load folders for this provider when selected
            loadFolders(provider);
        } else {
            newProviders = newProviders.filter(p => p !== provider);
            delete newFolders[provider];
        }

        onSelectionChange(newProviders, newFolders);
    };

    const handleFolderSelect = (provider: string, folderId: string) => {
        const newFolders = { ...selectedFolders };
        newFolders[provider] = folderId;
        onSelectionChange(selectedProviders, newFolders);
    };

    const getProviderDisplayName = (provider: string) => {
        switch (provider) {
            case 'google_drive': return 'Google Drive';
            case 'dropbox': return 'Dropbox';
            default: return provider;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center">
                        <Cloud className="w-5 h-5 mr-2" />
                        Select Cloud Storage Folders
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-auto space-y-6">
                    {AVAILABLE_PROVIDERS.map((provider) => {
                        const isConnected = isProviderConnected(provider.id);
                        const account = getConnectedAccount(provider.id);

                        return (
                            <div key={provider.id} className="border rounded-lg p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        {isConnected ? (
                                            <>
                                                <Checkbox
                                                    id={provider.id}
                                                    checked={selectedProviders.includes(provider.id)}
                                                    onCheckedChange={(checked) => 
                                                        handleProviderToggle(provider.id, checked as boolean)
                                                    }
                                                />
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <h3 className="font-medium">
                                                            {provider.name}
                                                        </h3>
                                                        <Check className="w-4 h-4 text-green-500" />
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {account?.provider_email}
                                                    </p>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="flex items-center space-x-3">
                                                <div className="w-5 h-5 border-2 border-muted rounded opacity-50" />
                                                <div>
                                                    <h3 className="font-medium text-muted-foreground">
                                                        {provider.name}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">
                                                        {provider.description}
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        {selectedFolders[provider.id] && (
                                            <Badge variant="secondary">
                                                Folder selected
                                            </Badge>
                                        )}
                                        {!isConnected && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleConnect(provider.id)}
                                                disabled={connecting === provider.id}
                                                className="flex items-center space-x-1"
                                            >
                                                <Link className="w-4 h-4" />
                                                <span>
                                                    {connecting === provider.id ? 'Connecting...' : 'Connect'}
                                                </span>
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {isConnected && selectedProviders.includes(provider.id) && (
                                    <div className="space-y-3">
                                        {/* Breadcrumb Navigation */}
                                        {breadcrumbs[provider.id] && breadcrumbs[provider.id].length > 0 && (
                                            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                                                <button
                                                    onClick={() => navigateToBreadcrumb(provider.id, -1)}
                                                    className="hover:text-foreground"
                                                >
                                                    Root
                                                </button>
                                                {breadcrumbs[provider.id].map((crumb, index) => (
                                                    <React.Fragment key={crumb.id}>
                                                        <ChevronRight className="w-3 h-3" />
                                                        <button
                                                            onClick={() => navigateToBreadcrumb(provider.id, index)}
                                                            className="hover:text-foreground"
                                                        >
                                                            {crumb.name}
                                                        </button>
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        )}

                                        {/* Create New Folder */}
                                        <div className="flex space-x-2">
                                            <Input
                                                placeholder="New folder name"
                                                value={newFolderName}
                                                onChange={(e) => setNewFolderName(e.target.value)}
                                                className="flex-1"
                                            />
                                            <Button
                                                size="sm"
                                                onClick={() => createFolder(provider.id)}
                                                disabled={!newFolderName.trim() || creatingFolder === provider.id}
                                            >
                                                <Plus className="w-4 h-4" />
                                                Create
                                            </Button>
                                        </div>

                                        {/* Current Folder Selection */}
                                        <div>
                                            <Label className="text-sm font-medium">
                                                Upload to folder:
                                            </Label>
                                            <div className="mt-1">
                                                <Button
                                                    variant={!selectedFolders[provider.id] ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => handleFolderSelect(provider.id, '')}
                                                >
                                                    Root folder
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Folder List */}
                                        {loading ? (
                                            <div className="text-center py-4 text-muted-foreground">
                                                Loading folders...
                                            </div>
                                        ) : (
                                            <div className="border rounded-lg">
                                                <div className="max-h-60 overflow-y-auto">
                                                    <div className="p-2 space-y-1">
                                                        {folders[provider.id]?.map((folder) => (
                                                            <div
                                                                key={folder.id}
                                                                className="flex items-center justify-between p-2 rounded border hover:bg-muted/50"
                                                            >
                                                                <div className="flex items-center space-x-2">
                                                                    <Folder className="w-4 h-4 text-blue-500" />
                                                                    <span className="text-sm">{folder.name}</span>
                                                                </div>
                                                                <div className="flex space-x-1">
                                                                    <Button
                                                                        variant={selectedFolders[provider.id] === folder.id ? "default" : "outline"}
                                                                        size="sm"
                                                                        onClick={() => handleFolderSelect(provider.id, folder.id)}
                                                                    >
                                                                        Select
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => navigateToFolder(provider.id, folder)}
                                                                    >
                                                                        <ChevronRight className="w-4 h-4" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {folders[provider.id]?.length === 0 && (
                                                            <div className="text-center py-4 text-muted-foreground text-sm">
                                                                No folders found
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {!isConnected && (
                                    <div className="text-center py-6 text-muted-foreground">
                                        <p className="mb-3">Connect {provider.name} to select upload folders</p>
                                        <Button
                                            onClick={() => handleConnect(provider.id)}
                                            disabled={connecting === provider.id}
                                            className="inline-flex items-center space-x-2"
                                        >
                                            <Link className="w-4 h-4" />
                                            <span>
                                                {connecting === provider.id ? 'Connecting...' : `Connect ${provider.name}`}
                                            </span>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={onClose}>
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
} 