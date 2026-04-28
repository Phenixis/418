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

export type TeacherContextType = {
    teacher: Teacher;
};

const TeacherContext = createContext<TeacherContextType | null>(null);

/**
 * Returns the teacher data from the nearest {@link TeacherProvider}.
 *
 * @throws {Error} When called outside of a `TeacherProvider` tree.
 */
export function useTeacher(): TeacherContextType {
    const context = useContext(TeacherContext);
    if (context === null) {
        throw new Error('useTeacher must be used within a TeacherProvider');
    }
    return context;
}

/**
 * Provides the authenticated teacher's data to the React tree.
 *
 * Unwraps `teacherPromise` with `use()` for seamless integration with React
 * Suspense. Re-syncs the state whenever the promise resolves to a new value.
 * Wrap layout components that need teacher data with this provider so that
 * {@link useTeacher} works in all descendants.
 *
 * The `children` prop is the component tree that may consume {@link useTeacher}.
 * The `teacherPromise` prop is a promise resolving to the authenticated teacher record.
 */
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
