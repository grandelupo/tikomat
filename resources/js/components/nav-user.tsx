import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { useIsMobile } from '@/hooks/use-mobile';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ChevronsUpDown, Bell, Check, Trash2, AlertCircle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Notification {
    id: string;
    type: 'error' | 'warning' | 'success' | 'info';
    title: string;
    message: string;
    data: any;
    read: boolean;
    created_at: string;
}

export function NavUser() {
    const { auth } = usePage<SharedData>().props;
    const { state } = useSidebar();
    const isMobile = useIsMobile();
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);

    // Fetch unread notifications count
    useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await fetch('/api/notifications/unread-count', {
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setUnreadCount(data.count || 0);
                }
            } catch (error) {
                console.error('Failed to fetch unread notifications count:', error);
            }
        };

        fetchUnreadCount();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);

        return () => clearInterval(interval);
    }, []);

    // Fetch notifications when dropdown is opened
    const fetchNotifications = async () => {
        try {
            const response = await fetch('/api/notifications/list', {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications || []);
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const markAsRead = async (notificationId: string) => {
        try {
            await fetch(`/api/notifications/mark-read/${notificationId}`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            // Update local state
            setNotifications(prev => prev.map(n =>
                n.id === notificationId ? { ...n, read: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            // Update local state
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const clearNotifications = async () => {
        try {
            await fetch('/api/notifications/clear', {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            // Update local state
            setNotifications([]);
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to clear notifications:', error);
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'error':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'warning':
                return <AlertCircle className="w-4 h-4 text-yellow-500" />;
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            default:
                return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <SidebarMenu>
            {/* Notification Bell */}
            <SidebarMenuItem>
                <DropdownMenu onOpenChange={(open) => {
                    setShowNotifications(open);
                    if (open) {
                        fetchNotifications();
                    }
                }}>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent group relative"
                        >
                            <Bell className="size-4" />
                            <span className="text-sm font-medium">Notifications</span>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-80 max-h-96 overflow-y-auto"
                        align="end"
                        side={isMobile ? 'bottom' : state === 'collapsed' ? 'left' : 'bottom'}
                    >
                        <div className="p-4 border-b">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold">Notifications</h3>
                                <div className="flex gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-blue-600 hover:text-blue-700"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                    {notifications.length > 0 && (
                                        <button
                                            onClick={clearNotifications}
                                            className="text-xs text-red-600 hover:text-red-700"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-2">
                            {notifications.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No notifications</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {notifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-3 rounded-lg border ${
                                                notification.read
                                                    ? 'bg-gray-50 border-gray-200'
                                                    : 'bg-blue-50 border-blue-200'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                {getNotificationIcon(notification.type)}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className={`text-sm font-medium ${
                                                        notification.read ? 'text-gray-700' : 'text-gray-900'
                                                    }`}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className={`text-xs mt-1 ${
                                                        notification.read ? 'text-gray-500' : 'text-gray-600'
                                                    }`}>
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(notification.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                {!notification.read && (
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="text-blue-600 hover:text-blue-700"
                                                        title="Mark as read"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>

            {/* User Menu */}
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton size="lg" className="text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent group">
                            <UserInfo user={auth.user} />
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                        align="end"
                        side={isMobile ? 'bottom' : state === 'collapsed' ? 'left' : 'bottom'}
                    >
                        <UserMenuContent user={auth.user} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
