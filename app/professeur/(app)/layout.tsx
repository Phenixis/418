import TeacherHeader from '@/components/general/TeacherHeader';
import { teacherQueries } from '@/lib/db/queries/teacher';
import { DialogProvider } from '@/lib/hooks/use-dialog';
import { TeacherProvider } from '@/lib/hooks/useTeacher';

export const dynamic = "force-dynamic"

export default function ProfesseurLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const teacherPromise = teacherQueries.getTeacher();

    return (
        <TeacherProvider teacherPromise={teacherPromise}>
            <DialogProvider>
                <TeacherHeader />
                <main className="container mx-auto">{children}</main>
            </DialogProvider>
        </TeacherProvider>
    );
}
