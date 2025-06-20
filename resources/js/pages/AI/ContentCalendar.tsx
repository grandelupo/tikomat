import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import AIContentCalendar from '@/components/AIContentCalendar';
import ErrorBoundary from '@/components/ErrorBoundary';
import { type BreadcrumbItem } from '@/types';

export default function ContentCalendarPage() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'AI Tools',
            href: '/ai/content-calendar',
        },
        {
            title: 'Content Calendar',
            href: '/ai/content-calendar',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Content Calendar" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">AI Content Calendar</h1>
                        <p className="text-muted-foreground">
                            Plan and schedule your content with AI-powered insights
                        </p>
                    </div>
                </div>
                
                <ErrorBoundary>
                    <AIContentCalendar 
                        userId={1} // In real implementation, this would come from auth
                    />
                </ErrorBoundary>
            </div>
        </AppLayout>
    );
} 