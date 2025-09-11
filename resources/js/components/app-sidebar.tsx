import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { BookOpen, Folder, LayoutGrid, BarChart3, Link as LinkIcon, Video, Shield, FileText } from 'lucide-react';
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
        title: 'Statistics',
        href: '/stats',
        icon: BarChart3,
    },
];

const aiToolsNavItems: NavItem[] = [];

const footerNavItems: NavItem[] = [
    {
        title: 'Privacy Policy',
        href: '/privacy',
        icon: Shield,
    },
    {
        title: 'Terms of Service',
        href: '/terms',
        icon: FileText,
    },
];

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
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
