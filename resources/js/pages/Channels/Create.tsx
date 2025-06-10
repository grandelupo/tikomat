import { Head, useForm, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Youtube, Instagram, Video as VideoIcon, ArrowLeft } from 'lucide-react';

interface Props {
    allowedPlatforms: string[];
}

const platformData = {
    youtube: {
        name: 'YouTube',
        icon: Youtube,
        description: 'Upload videos to your YouTube channel',
        color: 'text-red-600'
    },
    instagram: {
        name: 'Instagram',
        icon: Instagram,
        description: 'Share Reels and video content',
        color: 'text-pink-600'
    },
    tiktok: {
        name: 'TikTok',
        icon: VideoIcon,
        description: 'Publish videos for maximum reach',
        color: 'text-black'
    }
};

export default function ChannelCreate({ allowedPlatforms }: Props) {
    const breadcrumbs = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Create Channel',
            href: '/channels/create',
        },
    ];

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        default_platforms: ['youtube'] // Default to YouTube
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/channels');
    };

    const handlePlatformChange = (platform: string, checked: boolean) => {
        if (checked) {
            setData('default_platforms', [...data.default_platforms, platform]);
        } else {
            setData('default_platforms', data.default_platforms.filter(p => p !== platform));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Channel" />
            
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create New Channel</h1>
                        <p className="text-muted-foreground">
                            Set up a new channel to organize your content and social media connections
                        </p>
                    </div>
                    <Link href="/dashboard">
                        <Button variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>
                </div>

                <div className="max-w-2xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Channel Details</CardTitle>
                            <CardDescription>
                                Enter the basic information for your new channel
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Channel Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Channel Name *</Label>
                                    <Input
                                        id="name"
                                        type="text"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., My Gaming Channel"
                                        className={errors.name ? 'border-red-500' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>

                                {/* Channel Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Describe what this channel is about..."
                                        rows={3}
                                        className={errors.description ? 'border-red-500' : ''}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-600">{errors.description}</p>
                                    )}
                                </div>

                                {/* Default Platforms */}
                                <div className="space-y-4">
                                    <div>
                                        <Label>Default Platforms</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Select the platforms you typically want to publish to from this channel
                                        </p>
                                    </div>

                                    <div className="grid gap-4">
                                        {Object.entries(platformData).map(([platform, info]) => {
                                            const isAllowed = allowedPlatforms.includes(platform);
                                            const isChecked = data.default_platforms.includes(platform);
                                            const Icon = info.icon;

                                            return (
                                                <div 
                                                    key={platform}
                                                    className={`flex items-center space-x-3 p-4 border rounded-lg ${
                                                        !isAllowed ? 'bg-gray-50 border-gray-200' : 'border-gray-300'
                                                    }`}
                                                >
                                                    <Checkbox
                                                        id={platform}
                                                        checked={isChecked}
                                                        disabled={!isAllowed}
                                                        onCheckedChange={(checked) => 
                                                            handlePlatformChange(platform, checked as boolean)
                                                        }
                                                    />
                                                    <div className="flex items-center space-x-3 flex-1">
                                                        <Icon className={`w-5 h-5 ${info.color}`} />
                                                        <div className="flex-1">
                                                            <div className="flex items-center space-x-2">
                                                                <Label 
                                                                    htmlFor={platform}
                                                                    className={`font-medium ${!isAllowed ? 'text-gray-400' : ''}`}
                                                                >
                                                                    {info.name}
                                                                </Label>
                                                                {!isAllowed && (
                                                                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                                                                        Coming Soon
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className={`text-sm ${!isAllowed ? 'text-gray-400' : 'text-muted-foreground'}`}>
                                                                {info.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {allowedPlatforms.length === 1 && (
                                        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
                                            <AlertDescription className="text-blue-800 dark:text-blue-200">
                                                <strong>Free Plan:</strong> You currently have access to YouTube only. 
                                                Upgrade to Pro to unlock Instagram and TikTok publishing for just $0.60/day.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {errors.default_platforms && (
                                        <p className="text-sm text-red-600">{errors.default_platforms}</p>
                                    )}
                                </div>

                                {/* Submit Button */}
                                <div className="flex items-center justify-end space-x-4 pt-4">
                                    <Link href="/dashboard">
                                        <Button type="button" variant="outline">
                                            Cancel
                                        </Button>
                                    </Link>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creating...' : 'Create Channel'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
} 