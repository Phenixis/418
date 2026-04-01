import AdminHeader from '@/components/general/AdminHeader';
import { teacherQueries } from '@/lib/db/queries/teacher';
import { AdminProvider } from '@/lib/hooks/useAdmin';

export const dynamic = "force-dynamic"

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const adminPromise = teacherQueries.getAdmin();

    return (
        <div suppressHydrationWarning>
            <AdminProvider adminPromise={adminPromise}>
                <AdminHeader />
                <main className="container mx-auto">{children}</main>
            </AdminProvider>
        </div>
    );
}
