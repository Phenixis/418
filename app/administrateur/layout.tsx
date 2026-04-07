import { teacherQueries } from '@/lib/db/queries/teacher';
import { AdminProvider } from '@/lib/hooks/useAdmin';
import AdminHeaderNoSSR from '@/components/general/AdminHeaderNoSSR';

export const dynamic = "force-dynamic"

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const adminPromise = teacherQueries.getAdmin();

    return (
        <AdminProvider adminPromise={adminPromise}>
            <AdminHeaderNoSSR />
            <main className="container mx-auto">{children}</main>
        </AdminProvider>
    );
}
