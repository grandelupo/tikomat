import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, BarChart3, Link as LinkIcon, Video, Workflow, Calendar, TrendingUp, Users, Target, Brain } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'My channels',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'All videos',
        href: '/videos',
        icon: Video,
    },
    {
        title: 'Connections',
        href: '/connections',
        icon: LinkIcon,
    },
    {
        title: 'Workflow',
        href: '/workflow',
        icon: Workflow,
    },
    {
        title: 'Statistics',
        href: '/stats',
        icon: BarChart3,
    },
];

const aiToolsNavItems: NavItem[] = [
    {
        title: 'Content Calendar',
        href: '/ai/content-calendar',
        icon: Calendar,
    },
    {
        title: 'Trend Analyzer',
        href: '/ai/trend-analyzer',
        icon: TrendingUp,
    },
];

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
                <div className="mt-6">
                    <div className="px-4 py-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-sidebar-foreground/70">
                            AI Tools
                        </div>
                    </div>
                    <NavMain items={aiToolsNavItems} />
                </div>
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
