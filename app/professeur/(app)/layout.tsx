import { Header } from '@/components/general/header';
import { teacherQueries } from '@/lib/db/queries/teacher';
import { TeacherProvider } from '@/lib/hooks/UseTeacher';

export const dynamic = "force-dynamic"

export default function ProfesseurLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const teacherPromise = teacherQueries.getTeacher();

    return (
        <TeacherProvider teacherPromise={teacherPromise}>
            <Header />
            <main className="container mx-auto">{children}</main>
        </TeacherProvider>
    );
}
