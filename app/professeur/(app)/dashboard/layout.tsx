import CreerCours from '@/components/cours/creation/creer-cours';
import { BreadcrumbProvider, BreadcrumbSlot } from './breadcrumb-context';

export default function DashboardLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <BreadcrumbProvider>
            <div className="flex items-center justify-between mb-4 gap-4">
                <h1 className="h1 min-w-max">Dashboard</h1>
                
                <div className="flex-1 flex justify-center">
                    <BreadcrumbSlot />
                </div>
                
                <div className="min-w-max">
                    <CreerCours />
                </div>
            </div>
            {children}
        </BreadcrumbProvider>
    );
}
