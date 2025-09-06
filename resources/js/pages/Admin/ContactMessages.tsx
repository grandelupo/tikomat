import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Head, Link } from '@inertiajs/react';
import {
    Mail,
    User,
    Calendar,
    MessageSquare,
    Eye,
    CheckCircle,
    Clock,
    Reply,
    Search,
    Filter
} from 'lucide-react';

interface ContactMessage {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    subject: string;
    message: string;
    status: 'unread' | 'read' | 'replied';
    created_at: string;
    updated_at: string;
}

interface ContactMessagesProps {
    messages: {
        data: ContactMessage[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: {
        total: number;
        unread: number;
        read: number;
        replied: number;
    };
}

export default function ContactMessages({ messages, stats }: ContactMessagesProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'unread':
                return <Badge className="bg-red-100 text-red-800">Unread</Badge>;
            case 'read':
                return <Badge className="bg-yellow-100 text-yellow-800">Read</Badge>;
            case 'replied':
                return <Badge className="bg-green-100 text-green-800">Replied</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'unread':
                return <Mail className="w-4 h-4 text-red-600" />;
            case 'read':
                return <Eye className="w-4 h-4 text-yellow-600" />;
            case 'replied':
                return <Reply className="w-4 h-4 text-green-600" />;
            default:
                return <MessageSquare className="w-4 h-4 text-gray-600" />;
        }
    };

    return (
        <>
            <Head title="Contact Messages - Admin" />

            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Messages</h1>
                            <p className="text-gray-600">Manage and respond to customer inquiries</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link href={route('admin.chat.index')}>
                                <Button className="bg-blue-600 hover:bg-blue-700">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Live Chat
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Unread</CardTitle>
                            <Mail className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Read</CardTitle>
                            <Eye className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.read}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Replied</CardTitle>
                            <Reply className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.replied}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                            <option value="">All Status</option>
                            <option value="unread">Unread</option>
                            <option value="read">Read</option>
                            <option value="replied">Replied</option>
                        </select>
                    </div>
                </div>

                {/* Messages Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Messages</CardTitle>
                        <CardDescription>
                            {messages.total} total messages
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {messages.data.map((message) => (
                                <div
                                    key={message.id}
                                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                                        message.status === 'unread' ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start space-x-4 flex-1">
                                            <div className="flex-shrink-0">
                                                {getStatusIcon(message.status)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                        {message.first_name} {message.last_name}
                                                    </h3>
                                                    {getStatusBadge(message.status)}
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                                                    <span className="flex items-center">
                                                        <Mail className="w-3 h-3 mr-1" />
                                                        {message.email}
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Calendar className="w-3 h-3 mr-1" />
                                                        {new Date(message.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-gray-900 font-medium mb-2">{message.subject}</p>
                                                <p className="text-gray-600 line-clamp-2">
                                                    {message.message.length > 150
                                                        ? message.message.substring(0, 150) + '...'
                                                        : message.message
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4">
                                            <Link href={`/admin/contact-messages/${message.id}`}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="w-4 h-4 mr-1" />
                                                    View
                                                </Button>
                                            </Link>
                                            <a href={`mailto:${message.email}?subject=Re: ${message.subject}`}>
                                                <Button variant="outline" size="sm">
                                                    <Reply className="w-4 h-4 mr-1" />
                                                    Reply
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {messages.last_page > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <p className="text-sm text-gray-600">
                                    Showing {((messages.current_page - 1) * messages.per_page) + 1} to{' '}
                                    {Math.min(messages.current_page * messages.per_page, messages.total)} of{' '}
                                    {messages.total} results
                                </p>
                                <div className="flex items-center space-x-2">
                                    {messages.current_page > 1 && (
                                        <Button variant="outline" size="sm">
                                            Previous
                                        </Button>
                                    )}
                                    {messages.current_page < messages.last_page && (
                                        <Button variant="outline" size="sm">
                                            Next
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}