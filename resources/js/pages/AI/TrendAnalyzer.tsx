import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import AITrendAnalyzer from '@/components/AITrendAnalyzer';
import ErrorBoundary from '@/components/ErrorBoundary';
import { type BreadcrumbItem } from '@/types';

export default function TrendAnalyzerPage() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'AI Tools',
            href: '/ai/trend-analyzer',
        },
        {
            title: 'Trend Analyzer',
            href: '/ai/trend-analyzer',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="AI Trend Analyzer" />
            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">AI Trend Analyzer</h1>
                        <p className="text-muted-foreground">
                            Discover trending content and viral opportunities with AI insights
                        </p>
                    </div>
                </div>
                
                <ErrorBoundary>
                    <AITrendAnalyzer 
                        userId={1} // In real implementation, this would come from auth
                    />
                </ErrorBoundary>
            </div>
        </AppLayout>
    );
} 