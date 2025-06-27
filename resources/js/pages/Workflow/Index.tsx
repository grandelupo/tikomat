import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { 
    Plus, 
    Youtube, 
    Instagram, 
    Video as VideoIcon, 
    Settings, 
    Play,
    Pause,
    Trash2,
    ArrowRight,
    Download,
    Upload,
    Zap,
    Info,
    Facebook,
    Camera,
    Palette
} from 'lucide-react';
import XIcon from '@/components/ui/icons/x';
import { useState } from 'react';

interface Workflow {
    id: number;
    name: string;
    description: string;
    source_platform: string;
    target_platforms: string[];
    is_active: boolean;
    created_at: string;
    last_run_at: string | null;
    videos_processed: number;
}

interface Channel {
    id: number;
    name: string;
    slug: string;
}

interface Platform {
    name: string;
    label: string;
    connected: boolean;
}

interface WorkflowIndexProps {
    workflows: Workflow[];
    channels: Channel[];
    platforms: Platform[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'My channels',
        href: '/dashboard',
    },
    {
        title: 'Workflow',
        href: '/workflow',
    },
];

const platformIcons = {
    youtube: Youtube,
    instagram: Instagram,
    tiktok: VideoIcon,
    facebook: Facebook,
    x: XIcon,
    snapchat: Camera,
    pinterest: Palette,
};

export default function WorkflowIndex({ workflows, channels, platforms }: WorkflowIndexProps) {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        channel_id: '',
        source_platform: '',
        target_platforms: [] as string[],
        is_active: true,
    });

    const handleCreateWorkflow = () => {
        router.post('/workflow', formData, {
            onSuccess: () => {
                setShowCreateForm(false);
                setFormData({
                    name: '',
                    description: '',
                    channel_id: '',
                    source_platform: '',
                    target_platforms: [],
                    is_active: true,
                });
            },
        });
    };

    const handleToggleWorkflow = (workflowId: number, isActive: boolean) => {
        router.patch(`/workflow/${workflowId}`, { is_active: isActive });
    };

    const handleDeleteWorkflow = (workflowId: number) => {
        if (confirm('Are you sure you want to delete this workflow?')) {
            router.delete(`/workflow/${workflowId}`);
        }
    };

    const connectedPlatforms = platforms.filter(p => p.connected);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Workflow Automation" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Workflow Automation</h1>
                        <p className="text-muted-foreground">
                            Automatically sync videos between your social media platforms
                        </p>
                    </div>
                    <Button onClick={() => setShowCreateForm(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Workflow
                    </Button>
                </div>

                {/* Info Alert */}
                <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Workflows automatically detect when you upload a video to one platform and sync it to your other connected accounts. 
                        This helps you maintain consistent content across all your social media channels.
                    </AlertDescription>
                </Alert>

                {/* Connection Notice */}
                {connectedPlatforms.length < 2 && (
                    <Alert className="border-yellow-200 bg-yellow-50">
                        <Info className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800">
                            You need to first connect other social media accounts to use them in workflows.{' '}
                            <Link href="/connections" className="font-medium underline hover:no-underline">
                                Go to Connections
                            </Link>
                        </AlertDescription>
                    </Alert>
                )}

                {/* Create Workflow Form */}
                {showCreateForm && connectedPlatforms.length >= 2 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Create New Workflow</CardTitle>
                            <CardDescription>
                                Set up automatic video syncing between platforms for a specific channel
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Workflow Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="e.g., YouTube to Instagram"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="channel">Channel</Label>
                                    <Select value={formData.channel_id} onValueChange={(value) => setFormData({ ...formData, channel_id: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select channel" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {channels.map((channel) => (
                                                <SelectItem key={channel.id} value={channel.id.toString()}>
                                                    {channel.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    placeholder="Brief description of this workflow"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="source">Source Platform</Label>
                                    <Select value={formData.source_platform} onValueChange={(value) => setFormData({ ...formData, source_platform: value })}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select source platform" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {connectedPlatforms.map((platform) => {
                                                const Icon = platformIcons[platform.name as keyof typeof platformIcons];
                                                return (
                                                    <SelectItem key={platform.name} value={platform.name}>
                                                        <div className="flex items-center">
                                                            <Icon className="w-4 h-4 mr-2" />
                                                            {platform.label}
                                                        </div>
                                                    </SelectItem>
                                                );
                                            })}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label>Target Platforms</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        {connectedPlatforms
                                            .filter(p => p.name !== formData.source_platform)
                                            .map((platform) => {
                                                const Icon = platformIcons[platform.name as keyof typeof platformIcons];
                                                const isSelected = formData.target_platforms.includes(platform.name);
                                                return (
                                                    <div key={platform.name} className="flex items-center space-x-2">
                                                        <input
                                                            type="checkbox"
                                                            id={platform.name}
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setFormData({
                                                                        ...formData,
                                                                        target_platforms: [...formData.target_platforms, platform.name]
                                                                    });
                                                                } else {
                                                                    setFormData({
                                                                        ...formData,
                                                                        target_platforms: formData.target_platforms.filter(p => p !== platform.name)
                                                                    });
                                                                }
                                                            }}
                                                            className="rounded"
                                                        />
                                                        <label htmlFor={platform.name} className="flex items-center text-sm">
                                                            <Icon className="w-4 h-4 mr-1" />
                                                            {platform.label}
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <Label htmlFor="active">Activate workflow immediately</Label>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateWorkflow}>
                                    Create Workflow
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Existing Workflows */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Your Workflows</h2>
                    
                    {workflows.length === 0 ? (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Zap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
                                <p className="text-gray-600 mb-4">
                                    Create your first workflow to start automating video distribution across platforms.
                                </p>
                                <Button onClick={() => setShowCreateForm(true)}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Your First Workflow
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {workflows.map((workflow) => {
                                const SourceIcon = platformIcons[workflow.source_platform as keyof typeof platformIcons];
                                
                                return (
                                    <Card key={workflow.id}>
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <h3 className="text-lg font-semibold">{workflow.name}</h3>
                                                        <Badge variant={workflow.is_active ? "default" : "secondary"}>
                                                            {workflow.is_active ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </div>
                                                    
                                                    <p className="text-sm text-muted-foreground mb-3">
                                                        {workflow.description}
                                                    </p>

                                                    {/* Workflow Flow */}
                                                    <div className="flex items-center space-x-2 mb-3">
                                                        <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1 rounded-lg">
                                                            <Download className="w-4 h-4 text-blue-600" />
                                                            <SourceIcon className="w-4 h-4" />
                                                            <span className="text-sm font-medium capitalize">
                                                                {workflow.source_platform}
                                                            </span>
                                                        </div>
                                                        
                                                        <ArrowRight className="w-4 h-4 text-gray-400" />
                                                        
                                                        <div className="flex items-center space-x-1">
                                                            {workflow.target_platforms.map((platform) => {
                                                                const TargetIcon = platformIcons[platform as keyof typeof platformIcons];
                                                                return (
                                                                    <div key={platform} className="flex items-center space-x-1 bg-green-50 px-2 py-1 rounded">
                                                                        <Upload className="w-3 h-3 text-green-600" />
                                                                        <TargetIcon className="w-3 h-3" />
                                                                        <span className="text-xs capitalize">{platform}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                                        <span>Created: {new Date(workflow.created_at).toLocaleDateString()}</span>
                                                        {workflow.last_run_at && (
                                                            <span>Last run: {new Date(workflow.last_run_at).toLocaleDateString()}</span>
                                                        )}
                                                        <span>Videos processed: {workflow.videos_processed}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleToggleWorkflow(workflow.id, !workflow.is_active)}
                                                    >
                                                        {workflow.is_active ? (
                                                            <>
                                                                <Pause className="w-3 h-3 mr-1" />
                                                                Pause
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play className="w-3 h-3 mr-1" />
                                                                Activate
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Link href={`/workflow/${workflow.id}/edit`}>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                        >
                                                            <Settings className="w-3 h-3 mr-1" />
                                                            Edit
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleDeleteWorkflow(workflow.id)}
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-3 h-3 mr-1" />
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
} 