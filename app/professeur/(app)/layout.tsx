import TeacherHeader from '@/components/general/TeacherHeader';
import { teacherQueries } from '@/lib/db/queries/teacher';
import { TeacherProvider } from '@/lib/hooks/useTeacher';

export const dynamic = "force-dynamic"

export default function ProfesseurLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const teacherPromise = teacherQueries.getTeacher();

    return (
        <TeacherProvider teacherPromise={teacherPromise}>
            <TeacherHeader />
            <main className="container mx-auto">{children}</main>
        </TeacherProvider>
    );
}
