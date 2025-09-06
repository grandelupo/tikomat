import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import AIContentStrategyPlanner from '@/components/AIContentStrategyPlanner';
import ErrorBoundary from '@/components/ErrorBoundary';
import { type BreadcrumbItem } from '@/types';

export default function StrategyPlannerPage() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'AI Tools',
            href: '/ai/strategy-planner',
        },
        {
            title: 'Strategy Planner',
            href: '/ai/strategy-planner',
        },
    ];

    // Mock video data for strategy planning
    const mockVideo = {
        id: 0,
        title: 'General Strategy Planning',
        description: 'Plan your content strategy with AI insights',
        duration: 0,
        formatted_duration: '0:00',
        created_at: new Date().toISOString(),
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Strategy Planner" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">AI Content Strategy Planner</h1>
                        <p className="text-muted-foreground">
                            Create comprehensive content strategies with AI-powered planning and insights
                        </p>
                    </div>
                </div>

                <ErrorBoundary>
                    <AIContentStrategyPlanner
                        video={mockVideo}
                    />
                </ErrorBoundary>
            </div>
        </AppLayout>
    );
}