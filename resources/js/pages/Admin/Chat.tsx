import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
    MessageCircle, 
    Users, 
    Clock, 
    CheckCircle, 
    AlertCircle,
    Search,
    Filter,
    MoreVertical,
    Eye,
    MessageSquare,
    User,
    Calendar,
    TrendingUp,
    X,
    Mail
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

interface User {
    id: number;
    name: string;
    email: string;
}

interface LatestMessage {
    id: number;
    message: string;
    is_from_admin: boolean;
    created_at: string;
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
    latest_message?: LatestMessage;
}

interface ChatStats {
    total: number;
    waiting: number;
    active: number;
    closed: number;
    unread_messages: number;
}

interface ChatProps {
    conversations: {
        data: Conversation[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: ChatStats;
}

export default function AdminChat({ conversations, stats }: ChatProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'waiting' | 'active' | 'closed'>('all');
    const [filteredConversations, setFilteredConversations] = useState(conversations.data);

    useEffect(() => {
        let filtered = conversations.data;

        // Filter by status
        if (filterStatus !== 'all') {
            filtered = filtered.filter(conv => conv.status === filterStatus);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(conv => 
                conv.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                conv.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (conv.latest_message?.message.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        setFilteredConversations(filtered);
    }, [searchTerm, filterStatus, conversations.data]);

    const getStatusBadge = (status: string, unreadCount: number = 0) => {
        const hasUnread = unreadCount > 0;
        
        switch (status) {
            case 'waiting':
                return (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                        <Clock className="w-3 h-3 mr-1" />
                        Waiting {hasUnread && <span className="ml-1 bg-yellow-600 text-white rounded-full px-1 text-xs">{unreadCount}</span>}
                    </Badge>
                );
            case 'active':
                return (
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active {hasUnread && <span className="ml-1 bg-green-600 text-white rounded-full px-1 text-xs">{unreadCount}</span>}
                    </Badge>
                );
            case 'closed':
                return (
                    <Badge className="bg-gray-100 text-gray-800 border-gray-300">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Closed
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-gray-100 text-gray-800">
                        Unknown
                    </Badge>
                );
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
        return `${Math.floor(diffInMinutes / 1440)}d ago`;
    };

    const getUrgencyLevel = (conversation: Conversation) => {
        if (conversation.status === 'waiting') {
            const createdAt = new Date(conversation.created_at);
            const now = new Date();
            const minutesAgo = (now.getTime() - createdAt.getTime()) / (1000 * 60);
            
            if (minutesAgo > 30) return 'high';
            if (minutesAgo > 15) return 'medium';
        }
        return 'normal';
    };

    const breadcrumbs = [
        {
            title: 'Admin',
            href: '/admin',
        },
        {
            title: 'Chat Management',
            href: '/admin/chat',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Chat Management - Admin Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">Chat Management</h1>
                                <p className="text-gray-600 mt-1">Manage customer conversations and support requests</p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <Link href={route('admin.contact-messages.index')}>
                                    <Button variant="outline">
                                        <Mail className="w-4 h-4 mr-2" />
                                        Contact Forms
                                    </Button>
                                </Link>
                                <div className="flex items-center space-x-2">
                                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                    <span className="text-sm text-gray-600">Live</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <MessageCircle className="w-8 h-8 text-blue-600" />
                                    <div className="ml-4">
                                        <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                        <p className="text-gray-600 text-sm">Total Chats</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <Clock className="w-8 h-8 text-yellow-600" />
                                    <div className="ml-4">
                                        <p className="text-2xl font-bold text-yellow-600">{stats.waiting}</p>
                                        <p className="text-gray-600 text-sm">Waiting</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                    <div className="ml-4">
                                        <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                                        <p className="text-gray-600 text-sm">Active</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <AlertCircle className="w-8 h-8 text-gray-600" />
                                    <div className="ml-4">
                                        <p className="text-2xl font-bold text-gray-600">{stats.closed}</p>
                                        <p className="text-gray-600 text-sm">Closed</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <TrendingUp className="w-8 h-8 text-purple-600" />
                                    <div className="ml-4">
                                        <p className="text-2xl font-bold text-purple-600">{stats.unread_messages}</p>
                                        <p className="text-gray-600 text-sm">Unread</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filters and Search */}
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <Input
                                            type="text"
                                            placeholder="Search conversations by user name, email, or message..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Filter className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm text-gray-600">Filter:</span>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            variant={filterStatus === 'all' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilterStatus('all')}
                                        >
                                            All
                                        </Button>
                                        <Button
                                            variant={filterStatus === 'waiting' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilterStatus('waiting')}
                                            className={filterStatus === 'waiting' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                                        >
                                            Waiting ({stats.waiting})
                                        </Button>
                                        <Button
                                            variant={filterStatus === 'active' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilterStatus('active')}
                                            className={filterStatus === 'active' ? 'bg-green-600 hover:bg-green-700' : ''}
                                        >
                                            Active ({stats.active})
                                        </Button>
                                        <Button
                                            variant={filterStatus === 'closed' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setFilterStatus('closed')}
                                            className={filterStatus === 'closed' ? 'bg-gray-600 hover:bg-gray-700' : ''}
                                        >
                                            Closed ({stats.closed})
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Conversations List */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Recent Conversations ({filteredConversations.length})</span>
                                {searchTerm && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSearchTerm('')}
                                    >
                                        <X className="w-4 h-4 mr-1" />
                                        Clear Search
                                    </Button>
                                )}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {filteredConversations.length === 0 ? (
                                <div className="text-center py-12">
                                    <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations found</h3>
                                    <p className="text-gray-600">
                                        {searchTerm ? 'Try adjusting your search terms.' : 'No conversations match the current filter.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {filteredConversations.map((conversation) => {
                                        const urgency = getUrgencyLevel(conversation);
                                        
                                        return (
                                            <div
                                                key={conversation.id}
                                                className={`p-6 hover:bg-gray-50 transition-colors ${
                                                    urgency === 'high' ? 'border-l-4 border-red-500' :
                                                    urgency === 'medium' ? 'border-l-4 border-yellow-500' : ''
                                                }`}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start space-x-4 flex-1">
                                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                            <User className="w-5 h-5 text-blue-600" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center space-x-3 mb-2">
                                                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                                                    {conversation.user.name}
                                                                </h3>
                                                                <span className="text-xs text-gray-500">
                                                                    {conversation.user.email}
                                                                </span>
                                                                {getStatusBadge(conversation.status, conversation.unread_count_admin)}
                                                                {urgency === 'high' && (
                                                                    <Badge className="bg-red-100 text-red-800 border-red-300">
                                                                        Urgent
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            {conversation.latest_message && (
                                                                <p className="text-sm text-gray-600 truncate mb-2">
                                                                    <span className={conversation.latest_message.is_from_admin ? 'text-blue-600' : 'text-gray-900'}>
                                                                        {conversation.latest_message.is_from_admin ? 'You: ' : `${conversation.user.name}: `}
                                                                    </span>
                                                                    {conversation.latest_message.message}
                                                                </p>
                                                            )}
                                                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                                <div className="flex items-center">
                                                                    <Calendar className="w-3 h-3 mr-1" />
                                                                    Started {formatTimeAgo(conversation.created_at)}
                                                                </div>
                                                                {conversation.last_message_at && (
                                                                    <div className="flex items-center">
                                                                        <Clock className="w-3 h-3 mr-1" />
                                                                        Last message {formatTimeAgo(conversation.last_message_at)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2">
                                                        <Link href={route('admin.chat.show', conversation.id)}>
                                                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                                                <Eye className="w-4 h-4 mr-1" />
                                                                View Chat
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Pagination would go here if needed */}
                    {conversations.last_page > 1 && (
                        <div className="mt-6 flex justify-center">
                            <div className="text-sm text-gray-500">
                                Showing {(conversations.current_page - 1) * conversations.per_page + 1} to{' '}
                                {Math.min(conversations.current_page * conversations.per_page, conversations.total)} of{' '}
                                {conversations.total} conversations
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
} 