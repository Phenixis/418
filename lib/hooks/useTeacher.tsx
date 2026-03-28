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

type TeacherContextType = {
    teacher: Teacher;
};

const TeacherContext = createContext<TeacherContextType | null>(null);

export function useTeacher(): TeacherContextType {
    const context = useContext(TeacherContext);
    if (context === null) {
        throw new Error('useTeacher must be used within a TeacherProvider');
    }
    return context;
}

export function TeacherProvider({
    children,
    teacherPromise,
}: Readonly<{
    children: ReactNode;
    teacherPromise: Promise<Teacher>;
}>) {
    let initialTeacher = use(teacherPromise)
    const [teacher, setTeacher] = useState<Teacher>(initialTeacher)

    useEffect(() => {
        setTeacher(initialTeacher)
    }, [initialTeacher])

    return (
        <TeacherContext.Provider value={{ teacher }}>
            {children}
        </TeacherContext.Provider>
    );
}
