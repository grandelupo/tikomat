import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Youtube, CheckCircle, Users, ArrowLeft } from 'lucide-react';
import { useInitials } from '@/hooks/use-initials';

interface Channel {
    id: number;
    name: string;
    slug: string;
}

interface YouTubeChannel {
    id: string;
    snippet: {
        title: string;
        description: string;
        customUrl?: string;
        thumbnails?: {
            default?: {
                url: string;
            };
        };
        publishedAt: string;
    };
    statistics?: {
        subscriberCount: string;
        videoCount: string;
        viewCount: string;
    };
}

interface UserProfile {
    name: string;
    email: string;
    avatar: string;
}

interface Props {
    channel: Channel;
    youtubeChannels: YouTubeChannel[];
    userProfile: UserProfile;
}

export default function YouTubeChannelSelection({ channel, youtubeChannels, userProfile }: Props) {
    const getInitials = useInitials();
    const [selectedChannelId, setSelectedChannelId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            title: 'Connect YouTube',
            href: '#',
        },
    ];

    const handleSubmit = () => {
        if (!selectedChannelId) {
            return;
        }

        setIsSubmitting(true);

        router.post(`/channels/${channel.slug}/youtube/select-channel`, {
            youtube_channel_id: selectedChannelId,
        }, {
            onFinish: () => {
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            }
        });
    };

    const handleCancel = () => {
        router.visit(`/channels/${channel.slug}`);
    };

    const formatSubscriberCount = (count: string): string => {
        const num = parseInt(count);
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return count;
    };

    const selectedChannel = youtubeChannels.find(ch => ch.id === selectedChannelId);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Select YouTube Channel" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Select YouTube Channel</h1>
                        <p className="text-muted-foreground">
                            Choose which YouTube channel to connect to "{channel.name}"
                        </p>
                    </div>
                    <Button variant="outline" onClick={handleCancel}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Cancel
                    </Button>
                </div>

                {/* Connected Google Account Info */}
                <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                        Successfully authenticated with Google account: <strong>{userProfile.name}</strong> ({userProfile.email})
                    </AlertDescription>
                </Alert>

                {/* Channel Selection */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Youtube className="w-5 h-5 mr-2 text-red-600" />
                            Select Your YouTube Channel
                        </CardTitle>
                        <CardDescription>
                            {youtubeChannels.length === 1
                                ? "We found 1 YouTube channel associated with your Google account."
                                : `We found ${youtubeChannels.length} YouTube channels associated with your Google account. Please select the one you want to connect.`
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <RadioGroup value={selectedChannelId} onValueChange={setSelectedChannelId} className="space-y-4">
                            {youtubeChannels.map((ytChannel) => (
                                <div key={ytChannel.id} className="flex items-center space-x-3">
                                    <RadioGroupItem value={ytChannel.id} id={ytChannel.id} />
                                    <Label
                                        htmlFor={ytChannel.id}
                                        className="flex-1 flex items-center space-x-4 cursor-pointer p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                    >
                                        <Avatar className="h-12 w-12">
                                            <AvatarImage
                                                src={ytChannel.snippet.thumbnails?.default?.url}
                                                alt={ytChannel.snippet.title}
                                            />
                                            <AvatarFallback className="bg-red-100 text-red-600">
                                                {getInitials(ytChannel.snippet.title)}
                                            </AvatarFallback>
                                        </Avatar>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <h3 className="font-semibold text-gray-900 truncate">
                                                    {ytChannel.snippet.title}
                                                </h3>
                                                {ytChannel.snippet.customUrl && (
                                                    <span className="text-sm text-gray-500">
                                                        {ytChannel.snippet.customUrl}
                                                    </span>
                                                )}
                                            </div>

                                            {ytChannel.snippet.description && (
                                                <p className="text-sm text-gray-600 truncate mt-1">
                                                    {ytChannel.snippet.description}
                                                </p>
                                            )}

                                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                                                {ytChannel.statistics?.subscriberCount && (
                                                    <div className="flex items-center space-x-1">
                                                        <Users className="w-3 h-3" />
                                                        <span>{formatSubscriberCount(ytChannel.statistics.subscriberCount)} subscribers</span>
                                                    </div>
                                                )}
                                                {ytChannel.statistics?.videoCount && (
                                                    <span>{ytChannel.statistics.videoCount} videos</span>
                                                )}
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>

                        {/* Selection Summary */}
                        {selectedChannel && (
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="font-medium text-blue-900 mb-2">Selected Channel</h4>
                                <div className="flex items-center space-x-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage
                                            src={selectedChannel.snippet.thumbnails?.default?.url}
                                            alt={selectedChannel.snippet.title}
                                        />
                                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                            {getInitials(selectedChannel.snippet.title)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium text-blue-900">{selectedChannel.snippet.title}</p>
                                        <p className="text-sm text-blue-700">
                                            Will be connected to "{channel.name}" channel
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3 mt-6">
                            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={!selectedChannelId || isSubmitting}
                                className="bg-red-600 hover:bg-red-700"
                            >
                                <Youtube className="w-4 h-4 mr-2" />
                                {isSubmitting ? 'Connecting...' : 'Connect YouTube Channel'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">What happens next?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-start space-x-2">
                                <span className="font-bold text-green-600 mt-0.5">•</span>
                                <span>Your selected YouTube channel will be linked to your "{channel.name}" channel</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <span className="font-bold text-green-600 mt-0.5">•</span>
                                <span>You can upload videos directly to this YouTube channel from filmate</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <span className="font-bold text-green-600 mt-0.5">•</span>
                                <span>Your connection is secure and can be disconnected at any time</span>
                            </li>
                            <li className="flex items-start space-x-2">
                                <span className="font-bold text-green-600 mt-0.5">•</span>
                                <span>You can connect different YouTube channels to different filmate channels</span>
                            </li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}