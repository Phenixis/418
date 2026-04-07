"use client";

import dynamic from 'next/dynamic';
import type { Select as Group } from '@/lib/db/schema/group';
import type { Select as Student } from '@/lib/db/schema/student';

const StudentsManagementClientOnly = dynamic(() => import('./StudentsManagementClient'), {
    ssr: false,
});

type StudentsManagementNoSSRProps = {
    initialStudents: Student[];
    groups: Group[];
};

export default function StudentsManagementNoSSR({
    initialStudents,
    groups,
}: Readonly<StudentsManagementNoSSRProps>) {
    return <StudentsManagementClientOnly initialStudents={initialStudents} groups={groups} />;
}
