import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { 
    ArrowLeft,
    Youtube, 
    Instagram, 
    Video as VideoIcon, 
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
    channel_id: number;
    source_platform: string;
    target_platforms: string[];
    is_active: boolean;
    channel: {
        id: number;
        name: string;
        slug: string;
    };
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

interface WorkflowEditProps {
    workflow: Workflow;
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
    {
        title: 'Edit Workflow',
        href: '#',
    },
];

const platformIcons = {
    youtube: Youtube,
    instagram: Instagram,
    tiktok: VideoIcon,
    facebook: Facebook,
    twitter: Twitter,
    snapchat: Camera,
    pinterest: Palette,
};

export default function WorkflowEdit({ workflow, channels, platforms }: WorkflowEditProps) {
    const [formData, setFormData] = useState({
        name: workflow.name,
        description: workflow.description || '',
        channel_id: workflow.channel_id.toString(),
        source_platform: workflow.source_platform,
        target_platforms: workflow.target_platforms,
        is_active: workflow.is_active,
    });

    const handleUpdateWorkflow = () => {
        router.put(`/workflow/${workflow.id}`, formData, {
            onSuccess: () => {
                router.visit('/workflow');
            },
        });
    };

    const connectedPlatforms = platforms.filter(p => p.connected);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Workflow: ${workflow.name}`} />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/workflow">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Workflows
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Edit Workflow</h1>
                            <p className="text-muted-foreground">
                                Update your automatic video syncing workflow
                            </p>
                        </div>
                    </div>
                </div>

                {/* Edit Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Workflow Settings</CardTitle>
                        <CardDescription>
                            Update the settings for your automatic video syncing workflow
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
                            <Label htmlFor="active">Workflow is active</Label>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <Link href="/workflow">
                                <Button variant="outline">
                                    Cancel
                                </Button>
                            </Link>
                            <Button onClick={handleUpdateWorkflow}>
                                Update Workflow
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 