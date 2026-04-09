'use client';

import { BreadcrumbProvider, BreadcrumbSlot } from './breadcrumb-context';
import { Button } from '@/components/ui/button';
import { useDialog } from '@/lib/hooks/use-dialog';
import { TutorialAutoLauncher } from '@/components/tutorial/TutorialAutoLauncher';

function CreateResourceButton() {
    const { setIsCreateResourceDialogOpen } = useDialog();
    return (
        <Button variant="default" onClick={() => setIsCreateResourceDialogOpen(true)}>
            Créer une ressource
        </Button>
    );
}

export default function DashboardLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <BreadcrumbProvider>
            <div className="sticky top-0 z-20 mb-4 grid grid-cols-1 gap-3 bg-background py-2 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div className="flex flex-col items-center gap-2 sm:min-w-max sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <h1 className="h1 min-w-0 text-2xl text-center sm:text-4xl sm:text-left">Dashboard</h1>

                    <div className="sm:hidden">
                        <CreateResourceButton />
                    </div>
                </div>

                <div className="order-last sm:order-0 sm:flex sm:flex-1 sm:justify-center">
                    <BreadcrumbSlot />
                </div>

                <div className="hidden sm:block sm:min-w-max">
                    <CreateResourceButton />
                </div>
                <TutorialAutoLauncher />
            </div>
            {children}
        </BreadcrumbProvider>
    );
}
