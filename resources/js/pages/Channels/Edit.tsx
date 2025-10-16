import { Head, useForm, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Trash2 } from 'lucide-react';

interface Channel {
    id: number;
    name: string;
    description: string;
    slug: string;
    is_default: boolean;
    default_platforms: string[];
}

interface Props {
    channel: Channel;
}

export default function ChannelEdit({ channel }: Props) {
    const breadcrumbs = [
        {
            title: 'My channels',
            href: '/dashboard',
        },
        {
            title: channel.name,
            href: `/channels/${channel.slug}`,
        },
        {
            title: 'Edit',
            href: `/channels/${channel.slug}/edit`,
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: channel.name,
        description: channel.description || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/channels/${channel.slug}`);
    };

    const handleDelete = () => {
        if (confirm('Are you sure you want to delete this channel? This action cannot be undone.')) {
            router.delete(`/channels/${channel.slug}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${channel.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Edit Channel</h1>
                        <p className="text-muted-foreground">
                            Update your channel settings and default platforms
                        </p>
                    </div>
                    <Link href={`/channels/${channel.slug}`}>
                        <Button variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Channel
                        </Button>
                    </Link>
                </div>

                <div className="max-w-2xl space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Channel Details</CardTitle>
                            <CardDescription>
                                Update the basic information for your channel
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

                                {/* Submit Button */}
                                <div className="flex items-center justify-between pt-4">
                                    <div className="flex items-center space-x-4">
                                        <Link href={`/channels/${channel.slug}`}>
                                            <Button type="button" variant="outline">
                                                Cancel
                                            </Button>
                                        </Link>
                                        <Button type="submit" disabled={processing}>
                                            {processing ? 'Saving...' : 'Save Changes'}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Danger Zone */}
                    {!channel.is_default && (
                        <Card className="border-red-200">
                            <CardHeader>
                                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                                <CardDescription>
                                    Permanently delete this channel and all its data
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="font-medium">Delete Channel</h4>
                                        <p className="text-sm text-muted-foreground">
                                            This action cannot be undone. All videos and connections will be lost.
                                        </p>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        onClick={handleDelete}
                                        className="ml-4"
                                    >
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Channel
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}