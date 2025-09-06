import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { MessageSquare, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface FloatingChatButtonProps {
    user?: {
        id: number;
        name: string;
        email: string;
    };
    unreadCount?: number;
}

export default function FloatingChatButton({ user, unreadCount = 0 }: FloatingChatButtonProps) {
    const [isMinimized, setIsMinimized] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Don't show if user is not authenticated
    if (!user) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Tooltip */}
            {showTooltip && !isMinimized && (
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap">
                    Need help? Chat with us!
                    <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                </div>
            )}

            {/* Chat Button */}
            <div className="relative">
                <Link href="/chat">
                    <Button
                        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg transition-all duration-300 hover:scale-110 relative"
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                    >
                        <MessageSquare className="w-6 h-6 text-white" />

                        {/* Unread count badge */}
                        {unreadCount > 0 && (
                            <Badge className="absolute -top-2 -right-2 bg-red-600 text-white border-2 border-white min-w-[1.25rem] h-5 text-xs flex items-center justify-center rounded-full">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </Badge>
                        )}

                        {/* Pulse animation for new messages */}
                        {unreadCount > 0 && (
                            <div className="absolute inset-0 rounded-full bg-blue-600 animate-ping opacity-75"></div>
                        )}
                    </Button>
                </Link>
            </div>
        </div>
    );
}