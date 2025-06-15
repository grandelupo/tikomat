import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, User, UserCheck } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ChatMessage {
    id: number;
    message: string;
    is_admin_message: boolean;
    created_at: string;
    admin_user?: {
        name: string;
    };
}

interface Props {
    messages: ChatMessage[];
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export default function Chat({ messages, user }: Props) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const { data, setData, post, processing, reset } = useForm({
        message: '',
    });

    const breadcrumbs = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Chat Support',
            href: '/chat',
        },
    ];

    useEffect(() => {
        // Scroll to bottom when messages change
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.message.trim()) return;

        post('/chat', {
            onSuccess: () => {
                reset('message');
                router.reload();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Chat Support" />
            
            <div className="flex h-full flex-1 flex-col p-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Chat Support</h1>
                    <p className="text-muted-foreground">
                        Get help from our support team or ask questions about Tikomat
                    </p>
                </div>

                <Card className="flex-1 flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <MessageCircle className="w-5 h-5 mr-2" />
                            Support Chat
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                        {/* Messages Area */}
                        <div className="flex-1 h-96 mb-4 border rounded-lg">
                            <ScrollArea className="h-full p-4" ref={scrollRef}>
                                <div className="space-y-4">
                                    {messages.length > 0 ? (
                                        messages.map((message) => (
                                            <div
                                                key={message.id}
                                                className={`flex ${message.is_admin_message ? 'justify-start' : 'justify-end'}`}
                                            >
                                                <div
                                                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                                        message.is_admin_message
                                                            ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                                                            : 'bg-blue-600 text-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center mb-1">
                                                        {message.is_admin_message ? (
                                                            <UserCheck className="w-4 h-4 mr-1" />
                                                        ) : (
                                                            <User className="w-4 h-4 mr-1" />
                                                        )}
                                                        <span className="text-xs font-medium">
                                                            {message.is_admin_message 
                                                                ? (message.admin_user?.name || 'Support') 
                                                                : user.name
                                                            }
                                                        </span>
                                                    </div>
                                                    <p className="text-sm">{message.message}</p>
                                                    <p className="text-xs opacity-75 mt-1">
                                                        {new Date(message.created_at).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                                            <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p>No messages yet. Start a conversation!</p>
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </div>

                        {/* Message Input */}
                        <form onSubmit={handleSubmit} className="flex space-x-2">
                            <Input
                                value={data.message}
                                onChange={(e) => setData('message', e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1"
                                disabled={processing}
                            />
                            <Button type="submit" disabled={processing || !data.message.trim()}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
} 