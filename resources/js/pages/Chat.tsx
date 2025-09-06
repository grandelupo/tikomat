import { useState, useEffect, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Send,
    MessageCircle,
    User,
    Headphones,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    Plus,
    List,
    X
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface Message {
    id: number;
    conversation_id: number;
    user_id: number;
    message: string;
    is_from_admin: boolean;
    sender_name: string;
    formatted_time: string;
    created_at: string;
    user?: {
        id: number;
        name: string;
    };
}

interface Conversation {
    id: number;
    status: 'waiting' | 'active' | 'closed';
    subject: string | null;
    unread_count_user: number;
    last_message_at: string | null;
    created_at: string;
}

interface ChatProps {
    conversations: Conversation[];
    activeConversation?: Conversation;
    messages: Message[];
    user: {
        id: number;
        name: string;
        email: string;
    };
}

export default function Chat({ conversations, activeConversation, messages: initialMessages, user }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [isTyping, setIsTyping] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
    const [lastMessageId, setLastMessageId] = useState<number>(0);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        message: '',
        conversation_id: activeConversation?.id || null,
        subject: '',
    });

    // Scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input on mount
    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    // Real-time message polling
    useEffect(() => {
        if (!activeConversation) {
            setConnectionStatus('disconnected');
            return;
        }

        // Set initial last message ID
        if (messages.length > 0) {
            setLastMessageId(Math.max(...messages.map(m => m.id)));
        }

        setConnectionStatus('connected');

        // Start polling for new messages
        const pollForMessages = async () => {
            if (!activeConversation) return;

            try {
                const response = await fetch(`${route('chat.poll')}?conversation_id=${activeConversation.id}&last_message_id=${lastMessageId}`, {
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.messages && data.messages.length > 0) {
                        // Filter out messages from the current user to avoid duplicates
                        const newMessages = data.messages.filter((m: Message) => m.is_from_admin);

                        if (newMessages.length > 0) {
                            setMessages(prev => [...prev, ...newMessages]);
                            setIsTyping(true);
                            setTimeout(() => setIsTyping(false), 500);
                        }

                        // Update last message ID with all messages (including user's own)
                        setLastMessageId(Math.max(...data.messages.map((m: Message) => m.id)));
                    }
                    setConnectionStatus('connected');
                } else {
                    setConnectionStatus('disconnected');
                }
            } catch (error) {
                console.error('Polling error:', error);
                setConnectionStatus('disconnected');
            }
        };

        // Poll every 2 seconds
        pollIntervalRef.current = setInterval(pollForMessages, 2000);

        // Cleanup
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [activeConversation, lastMessageId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.message.trim()) return;

        const messageToSend = data.message;

        // Add message optimistically
        const optimisticMessage: Message = {
            id: Date.now(), // Temporary ID
            conversation_id: activeConversation?.id || 0,
            user_id: user.id,
            message: messageToSend,
            is_from_admin: false,
            sender_name: user.name,
            formatted_time: new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            created_at: new Date().toISOString(),
            user: user
        };

        setMessages(prev => [...prev, optimisticMessage]);
        reset('message');
        inputRef.current?.focus();

        try {
            // Use fetch for direct JSON request instead of Inertia
            const response = await fetch(route('chat.store'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    message: messageToSend,
                    conversation_id: activeConversation?.id || null,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send message');
            }

            const result = await response.json();

            if (result.success) {
                // Update the optimistic message with real data
                setMessages(prev => prev.map(msg =>
                    msg.id === optimisticMessage.id
                        ? {
                            ...result.message,
                            sender_name: result.message.user.name,
                            formatted_time: new Date(result.message.created_at).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                            }),
                        }
                        : msg
                ));

                // Update conversation if needed
                if (result.conversation && !conversation) {
                    // This would need to be handled by parent component
                    // For now, just log it
                    console.log('New conversation created:', result.conversation);
                }
            } else {
                // Remove optimistic message on failure
                setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
                console.error('Failed to send message:', result.error);
            }
        } catch (error) {
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
            console.error('Error sending message:', error);
        }
    };

    const getStatusInfo = () => {
        if (!activeConversation) {
            return {
                status: 'No active conversation',
                color: 'bg-blue-100 text-blue-800',
                icon: MessageCircle
            };
        }

        switch (activeConversation.status) {
            case 'waiting':
                return {
                    status: 'Waiting for support agent',
                    color: 'bg-yellow-100 text-yellow-800',
                    icon: Clock
                };
            case 'active':
                return {
                    status: 'Connected with support',
                    color: 'bg-green-100 text-green-800',
                    icon: CheckCircle
                };
            case 'closed':
                return {
                    status: 'Conversation closed',
                    color: 'bg-gray-100 text-gray-800',
                    icon: AlertCircle
                };
            default:
                return {
                    status: 'Unknown status',
                    color: 'bg-gray-100 text-gray-800',
                    icon: AlertCircle
                };
        }
    };

    const handleNewConversation = async () => {
        try {
            const response = await fetch(route('chat.create'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    subject: data.subject || null,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Redirect to the new conversation
                    window.location.href = route('chat.index') + '?conversation_id=' + result.conversation.id;
                }
            }
        } catch (error) {
            console.error('Error creating conversation:', error);
        }
        setShowNewConversationDialog(false);
        reset('subject');
    };

    const statusInfo = getStatusInfo();
    const StatusIcon = statusInfo.icon;

    const breadcrumbs = [
        {
            title: 'My channels',
            href: '/dashboard',
        },
        {
            title: 'Live Chat Support',
            href: '/chat',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Live Chat Support" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        {/* Conversations Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-4 border-b">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
                                        <Button
                                            onClick={() => setShowNewConversationDialog(true)}
                                            size="sm"
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Plus className="w-4 h-4 mr-1" />
                                            New
                                        </Button>
                                    </div>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {conversations.length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">
                                            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                            <p className="text-sm">No conversations yet</p>
                                        </div>
                                    ) : (
                                        conversations.map((conv) => (
                                            <a
                                                key={conv.id}
                                                href={`${route('chat.index')}?conversation_id=${conv.id}`}
                                                className={`block p-4 border-b hover:bg-gray-50 ${
                                                    activeConversation?.id === conv.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {conv.subject || `Conversation #${conv.id}`}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(conv.created_at).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Badge
                                                            className={
                                                                conv.status === 'waiting' ? 'bg-yellow-100 text-yellow-800' :
                                                                conv.status === 'active' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }
                                                        >
                                                            {conv.status}
                                                        </Badge>
                                                        {conv.unread_count_user > 0 && (
                                                            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                                                {conv.unread_count_user}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </a>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Chat Area */}
                        <div className="lg:col-span-3">
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        {/* Chat Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                        <Headphones className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-semibold text-white">Live Chat Support</h1>
                                        <p className="text-blue-100 text-sm">Get help from our support team</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <Badge className={`${statusInfo.color} border-0`}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {statusInfo.status}
                                    </Badge>
                                    <div className={`w-2 h-2 rounded-full ${
                                        connectionStatus === 'connected' ? 'bg-green-400' :
                                        connectionStatus === 'connecting' ? 'bg-yellow-400' :
                                        'bg-red-400'
                                    }`} />
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.length === 0 ? (
                                <div className="text-center py-8">
                                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Start a conversation</h3>
                                    <p className="text-gray-600">Send a message to connect with our support team.</p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.is_from_admin ? 'justify-start' : 'justify-end'}`}
                                    >
                                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                            message.is_from_admin
                                                ? 'bg-white text-gray-900 shadow-sm border'
                                                : 'bg-blue-600 text-white'
                                        }`}>
                                            <div className="flex items-center space-x-2 mb-1">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                    message.is_from_admin ? 'bg-blue-100' : 'bg-blue-500'
                                                }`}>
                                                    {message.is_from_admin ? (
                                                        <Headphones className={`w-3 h-3 ${
                                                            message.is_from_admin ? 'text-blue-600' : 'text-white'
                                                        }`} />
                                                    ) : (
                                                        <User className={`w-3 h-3 ${
                                                            message.is_from_admin ? 'text-blue-600' : 'text-white'
                                                        }`} />
                                                    )}
                                                </div>
                                                <span className={`text-xs font-medium ${
                                                    message.is_from_admin ? 'text-gray-600' : 'text-blue-100'
                                                }`}>
                                                    {message.sender_name}
                                                </span>
                                                <span className={`text-xs ${
                                                    message.is_from_admin ? 'text-gray-500' : 'text-blue-200'
                                                }`}>
                                                    {message.formatted_time}
                                                </span>
                                            </div>
                                            <p className="text-sm leading-relaxed">{message.message}</p>
                                        </div>
                                    </div>
                                ))
                            )}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-white text-gray-900 shadow-sm border">
                                        <div className="flex items-center space-x-2">
                                            <Headphones className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm text-gray-600">Support is typing</span>
                                            <div className="flex space-x-1">
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="border-t bg-white p-4">
                            <form onSubmit={handleSubmit} className="flex space-x-3">
                                <div className="flex-1">
                                    <Input
                                        ref={inputRef}
                                        type="text"
                                        value={data.message}
                                        onChange={(e) => setData('message', e.target.value)}
                                        placeholder="Type your message..."
                                        disabled={processing || activeConversation?.status === 'closed'}
                                        className="w-full"
                                    />
                                    {errors.message && (
                                        <p className="text-red-600 text-sm mt-1">{errors.message}</p>
                                    )}
                                </div>
                                <Button
                                    type="submit"
                                    disabled={processing || !data.message.trim() || activeConversation?.status === 'closed'}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {processing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Send className="w-4 h-4" />
                                    )}
                                </Button>
                            </form>

                            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                                <span>Press Enter to send</span>
                                <span>
                                    {activeConversation?.status === 'waiting' && (
 "We'll connect you with an agent shortly"
                                    )}
                                    {activeConversation?.status === 'active' && (
 "Connected with support team"
                                    )}
                                    {activeConversation?.status === 'closed' && (
 "This conversation has been closed"
                                    )}
                                    {!activeConversation && (
 "Start typing to begin a new conversation"
                                    )}
                                </span>
                            </div>
                        </div>
                            </div>
                        </div>
                    </div>

                    {/* New Conversation Dialog */}
                    {showNewConversationDialog && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Start New Conversation</h3>
                                    <Button
                                        onClick={() => setShowNewConversationDialog(false)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Subject (Optional)
                                        </label>
                                        <Input
                                            type="text"
                                            value={data.subject}
                                            onChange={(e) => setData('subject', e.target.value)}
                                            placeholder="What do you need help with?"
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-3">
                                        <Button
                                            onClick={() => setShowNewConversationDialog(false)}
                                            variant="outline"
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={handleNewConversation}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            Start Conversation
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Help Text */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle className="text-lg">Need help?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Response Times</h4>
                                    <ul className="space-y-1">
                                        <li>• Chat: Usually within 5 minutes</li>
                                        <li>• Business hours: 10 AM - 6 PM EET</li>
                                        <li>• Average response: 2 minutes</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Quick Tips</h4>
                                    <ul className="space-y-1">
                                        <li>• Be specific about your issue</li>
                                        <li>• Include error messages if any</li>
                                        <li>• Mention your account email</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}