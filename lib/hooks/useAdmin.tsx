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

type AdminContextType = {
    admin: Teacher;
};

const AdminContext = createContext<AdminContextType | null>(null);

export function useAdmin(): AdminContextType {
    const context = useContext(AdminContext);
    if (context === null) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
}

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
