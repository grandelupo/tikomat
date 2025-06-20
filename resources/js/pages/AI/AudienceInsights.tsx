import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import AIAudienceInsights from '@/components/AIAudienceInsights';
import ErrorBoundary from '@/components/ErrorBoundary';
import { type BreadcrumbItem } from '@/types';

export default function AudienceInsightsPage() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'AI Tools',
            href: '/ai/audience-insights',
        },
        {
            title: 'Audience Insights',
            href: '/ai/audience-insights',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Audience Insights" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">AI Audience Insights</h1>
                        <p className="text-muted-foreground">
                            Understand your audience better with AI-powered analytics and insights
                        </p>
                    </div>
                </div>
                
                <ErrorBoundary>
                    <AIAudienceInsights 
                        videoId={null} // For general audience insights, not video-specific
                    />
                </ErrorBoundary>
            </div>
        </AppLayout>
    );
} 