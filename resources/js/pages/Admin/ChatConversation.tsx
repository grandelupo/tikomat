import { useState, useEffect, useRef } from 'react';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
    ArrowLeft,
    Send, 
    MessageCircle, 
    User, 
    Headphones,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    X,
    RotateCcw,
    Calendar,
    UserCheck
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Message {
    id: number;
    conversation_id: number;
    user_id: number;
    message: string;
    is_from_admin: boolean;
    sender_name: string;
    formatted_time: string;
    created_at: string;
    user?: User;
}

interface Conversation {
    id: number;
    user_id: number;
    assigned_admin_id: number | null;
    status: 'waiting' | 'active' | 'closed';
    subject: string | null;
    unread_count_user: number;
    unread_count_admin: number;
    last_message_at: string | null;
    created_at: string;
    user: User;
    assigned_admin?: User;
}

interface ChatConversationProps {
    conversation: Conversation;
    messages: Message[];
    admin: User;
}

export default function ChatConversation({ conversation, messages: initialMessages, admin }: ChatConversationProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [showCloseDialog, setShowCloseDialog] = useState(false);
    const [lastMessageId, setLastMessageId] = useState<number>(0);
    const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        message: '',
    });

    const { data: closeData, setData: setCloseData, post: postClose, processing: closingProcessing } = useForm({
        reason: '',
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
        // Set initial last message ID
        if (messages.length > 0) {
            setLastMessageId(Math.max(...messages.map(m => m.id)));
        }

        setConnectionStatus('connected');

        // Start polling for new messages
        const pollForMessages = async () => {
            try {
                const response = await fetch(`${route('admin.chat.poll', conversation.id)}?last_message_id=${lastMessageId}`, {
                    headers: {
                        'Accept': 'application/json',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.messages && data.messages.length > 0) {
                        // Filter out messages from the current admin to avoid duplicates
                        const newMessages = data.messages.filter((m: Message) => !m.is_from_admin);
                        
                        if (newMessages.length > 0) {
                            setMessages(prev => [...prev, ...newMessages]);
                        }
                        
                        // Update last message ID with all messages (including admin's own)
                        setLastMessageId(Math.max(...data.messages.map((m: Message) => m.id)));
                    }
                    setConnectionStatus('connected');
                } else {
                    setConnectionStatus('disconnected');
                }
            } catch (error) {
                console.error('Admin polling error:', error);
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
    }, [conversation.id, lastMessageId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!data.message.trim()) return;

        const messageToSend = data.message;
        
        // Add message optimistically
        const optimisticMessage: Message = {
            id: Date.now(), // Temporary ID
            conversation_id: conversation.id,
            user_id: admin.id,
            message: messageToSend,
            is_from_admin: true,
            sender_name: admin.name,
            formatted_time: new Date().toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
            }),
            created_at: new Date().toISOString(),
            user: admin
        };
        
        setMessages(prev => [...prev, optimisticMessage]);
        reset('message');
        inputRef.current?.focus();
        
        try {
            // Use fetch for direct JSON request instead of Inertia
            const response = await fetch(route('admin.chat.send', conversation.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    message: messageToSend,
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

    const handleCloseConversation = () => {
        postClose(route('admin.chat.close', conversation.id), {
            onSuccess: () => {
                setShowCloseDialog(false);
                router.visit(route('admin.chat.index'));
            }
        });
    };

    const handleReopenConversation = () => {
        router.post(route('admin.chat.reopen', conversation.id), {}, {
            onSuccess: () => {
                router.reload();
            }
        });
    };

    const getStatusInfo = () => {
        switch (conversation.status) {
            case 'waiting':
                return {
                    status: 'Waiting for assignment',
                    color: 'bg-yellow-100 text-yellow-800',
                    icon: Clock
                };
            case 'active':
                return {
                    status: 'Active conversation',
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

    const statusInfo = getStatusInfo();
    const StatusIcon = statusInfo.icon;

    const breadcrumbs = [
        {
            title: 'Admin',
            href: '/admin',
        },
        {
            title: 'Chat Management',
            href: '/admin/chat',
        },
        {
            title: `Chat with ${conversation.user.name}`,
            href: `/admin/chat/${conversation.id}`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Chat with ${conversation.user.name} - Admin`} />

            <div className="py-6">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {/* Back Button */}
                    <div className="mb-6">
                        <Link href={route('admin.chat.index')}>
                            <Button variant="outline">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Chat Management
                            </Button>
                        </Link>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        {/* Chat Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                        <User className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-xl font-semibold text-white">{conversation.user.name}</h1>
                                        <p className="text-blue-100 text-sm">{conversation.user.email}</p>
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
                                    <div className="flex items-center space-x-2">
                                        {conversation.status === 'closed' ? (
                                            <Button
                                                onClick={handleReopenConversation}
                                                size="sm"
                                                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                                            >
                                                <RotateCcw className="w-4 h-4 mr-1" />
                                                Reopen
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => setShowCloseDialog(true)}
                                                size="sm"
                                                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                Close
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Conversation Info */}
                        <div className="border-b bg-gray-50 px-6 py-3">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <div className="flex items-center space-x-6">
                                    <div className="flex items-center">
                                        <Calendar className="w-4 h-4 mr-1" />
                                        Started: {new Date(conversation.created_at).toLocaleString()}
                                    </div>
                                    {conversation.assigned_admin && (
                                        <div className="flex items-center">
                                            <UserCheck className="w-4 h-4 mr-1" />
                                            Assigned to: {conversation.assigned_admin.name}
                                        </div>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500">
                                    Conversation #{conversation.id}
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
                            {messages.length === 0 ? (
                                <div className="text-center py-8">
                                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                                    <p className="text-gray-600">This conversation hasn't started yet.</p>
                                </div>
                            ) : (
                                messages.map((message) => (
                                    <div
                                        key={message.id}
                                        className={`flex ${message.is_from_admin ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                                            message.is_from_admin
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-white text-gray-900 shadow-sm border'
                                        }`}>
                                            <div className="flex items-center space-x-2 mb-1">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                    message.is_from_admin ? 'bg-blue-500' : 'bg-gray-100'
                                                }`}>
                                                    {message.is_from_admin ? (
                                                        <Headphones className={`w-3 h-3 ${
                                                            message.is_from_admin ? 'text-white' : 'text-gray-600'
                                                        }`} />
                                                    ) : (
                                                        <User className={`w-3 h-3 ${
                                                            message.is_from_admin ? 'text-white' : 'text-gray-600'
                                                        }`} />
                                                    )}
                                                </div>
                                                <span className={`text-xs font-medium ${
                                                    message.is_from_admin ? 'text-blue-100' : 'text-gray-600'
                                                }`}>
                                                    {message.sender_name}
                                                </span>
                                                <span className={`text-xs ${
                                                    message.is_from_admin ? 'text-blue-200' : 'text-gray-500'
                                                }`}>
                                                    {message.formatted_time}
                                                </span>
                                            </div>
                                            <p className="text-sm leading-relaxed">{message.message}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                            
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Message Input */}
                        <div className="border-t bg-white p-4">
                            {conversation.status === 'closed' ? (
                                <div className="text-center py-4 text-gray-500">
                                    This conversation has been closed. 
                                    <button 
                                        onClick={handleReopenConversation}
                                        className="text-blue-600 hover:text-blue-700 ml-1 underline"
                                    >
                                        Reopen conversation
                                    </button> to continue messaging.
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="flex space-x-3">
                                    <div className="flex-1">
                                        <Input
                                            ref={inputRef}
                                            type="text"
                                            value={data.message}
                                            onChange={(e) => setData('message', e.target.value)}
                                            placeholder="Type your response..."
                                            disabled={processing}
                                            className="w-full"
                                        />
                                        {errors.message && (
                                            <p className="text-red-600 text-sm mt-1">{errors.message}</p>
                                        )}
                                    </div>
                                    <Button
                                        type="submit"
                                        disabled={processing || !data.message.trim()}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {processing ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                    </Button>
                                </form>
                            )}
                            
                            <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                                <span>Press Enter to send</span>
                                <span>
                                    {conversation.status === 'waiting' && "Conversation will be activated when you send a message"}
                                    {conversation.status === 'active' && "Connected with user"}
                                    {conversation.status === 'closed' && "Conversation is closed"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Close Dialog */}
            {showCloseDialog && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Close Conversation</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-600">
                                Are you sure you want to close this conversation with {conversation.user.name}?
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for closing (optional)
                                </label>
                                <Textarea
                                    value={closeData.reason}
                                    onChange={(e) => setCloseData('reason', e.target.value)}
                                    placeholder="e.g., Issue resolved, User request, etc."
                                    className="w-full"
                                />
                            </div>
                            <div className="flex space-x-3">
                                <Button
                                    onClick={() => setShowCloseDialog(false)}
                                    variant="outline"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCloseConversation}
                                    disabled={closingProcessing}
                                    className="flex-1 bg-red-600 hover:bg-red-700"
                                >
                                    {closingProcessing ? (
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                    ) : null}
                                    Close Conversation
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </AppLayout>
    );
} 