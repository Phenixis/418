import { teacherQueries } from '@/lib/db/queries/teacher';
import { TeacherProvider } from '@/lib/hooks/UseTeacher';

export const dynamic = "force-dynamic"

export default function ProfesseurLayout({ children }: { children: React.ReactNode }) {
    const teacherPromise = teacherQueries.getTeacher();
    return (
        <TeacherProvider teacherPromise={teacherPromise}>
            {children}
        </TeacherProvider>
    );
}
