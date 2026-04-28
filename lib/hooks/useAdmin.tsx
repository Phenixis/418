'use client';

import { Select as Teacher } from '@/lib/db/schema/teacher';
import {
    createContext,
    ReactNode,
    use,
    useContext,
    useEffect,
    useState
} from 'react';

export type AdminContextType = {
    admin: Teacher;
};

const AdminContext = createContext<AdminContextType | null>(null);

/**
 * Returns the admin teacher data from the nearest {@link AdminProvider}.
 *
 * @throws {Error} When called outside of an `AdminProvider` tree.
 */
export function useAdmin(): AdminContextType {
    const context = useContext(AdminContext);
    if (context === null) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}

/**
 * Provides the authenticated admin's teacher record to the React tree.
 *
 * Mirrors `TeacherProvider` but scoped to admin layouts. Wrap admin
 * layout components with this provider so that {@link useAdmin} works in
 * all descendant components.
 *
 * The `children` prop is the component tree that may consume {@link useAdmin}.
 * The `adminPromise` prop is a promise resolving to the authenticated admin's teacher record.
 */
export function AdminProvider({
    children,
    adminPromise,
}: Readonly<{
    children: ReactNode;
    adminPromise: Promise<Teacher>;
}>) {
    let initialAdmin = use(adminPromise)
    const [admin, setAdmin] = useState<Teacher>(initialAdmin)

    useEffect(() => {
        setAdmin(initialAdmin)
    }, [initialAdmin])

    return (
        <AdminContext.Provider value={{ admin }}>
            {children}
        </AdminContext.Provider>
    );
}
