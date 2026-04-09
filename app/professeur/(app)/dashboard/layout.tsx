import IcalImportModal from '@/components/cours/IcalImportModal';
import ResourceModal from '@/components/cours/creation/ResourceModal';
import { teacherQueries } from '@/lib/db/queries/teacher';
import { BreadcrumbProvider, BreadcrumbSlot } from './breadcrumb-context';
import { Button } from '@/components/ui/button';
import { useDialog } from '@/lib/hooks/use-dialog';
import { TutorialAutoLauncher } from '@/components/tutorial/TutorialAutoLauncher';

function CreateResourceButton({ id }: Readonly<{ id?: string }>) {
    const { setIsCreateResourceDialogOpen } = useDialog();
    return (
        <Button variant="default" id={id} className="btn-creer-ressource" onClick={() => setIsCreateResourceDialogOpen(true)}>
            Créer une ressource
        </Button>
    );
}

export default async function DashboardLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    const teacher = await teacherQueries.getTeacher();

    return (
        <BreadcrumbProvider>
            <div className="sticky top-0 z-20 mb-4 grid grid-cols-1 gap-3 bg-background py-2 sm:flex sm:items-center sm:justify-between sm:gap-4">
                <div className="flex flex-col items-center gap-2 sm:min-w-max sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <h1 className="h1 min-w-0 text-2xl text-center sm:text-4xl sm:text-left">Dashboard</h1>

                    <div className="flex gap-2 sm:hidden">
                        <IcalImportModal initIcalUrl={teacher.icalUrl ?? undefined} />
                        <CreateResourceButton id="btn-creer-ressource-mobile" />
                    </div>
                </div>

                <div className="order-last sm:order-0 sm:flex sm:flex-1 sm:justify-center">
                    <BreadcrumbSlot />
                </div>

                <div className="hidden sm:flex sm:min-w-max gap-2">
                    <IcalImportModal initIcalUrl={teacher.icalUrl ?? undefined} />
                    <CreateResourceButton id="btn-creer-ressource-desktop" />
                </div>
                <TutorialAutoLauncher />
            </div>
            {children}
        </BreadcrumbProvider>
    );
}
