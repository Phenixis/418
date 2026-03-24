"use client";

import {
    TableCell,
    TableRow
} from '@/components/ui/table';

import { Select as Course } from '@/lib/db/schema/course';
import { Select as Group } from '@/lib/db/schema/group';
import { format } from 'date-fns';

interface CoursProps {
    cours: Course;
    groups: Group[];
}

export default function CourseTableRow({ cours, groups }: CoursProps) {
    return (
        <TableRow className="bg-white outline-2 outline-transparent hover:bg-white/50 hover:outline-primary rounded-lg overflow-hidden cursor-pointer last:*:first:rounded-bl-lg last:*:last:rounded-br-lg" onClick={() => {
            globalThis.location.href = `/professeur/cours/${cours.courseId}`;
        }}>
            <TableCell>{cours.subject}</TableCell>
            <TableCell>{format(cours.startAt, 'dd/MM/yyyy HH:mm')}</TableCell>
            <TableCell>{format(cours.endAt, 'dd/MM/yyyy HH:mm')}</TableCell>
            <TableCell>{format(cours.createdAt, 'dd/MM/yyyy HH:mm')}</TableCell>
            <TableCell>
                <ul>
                    {groups.map(group => (
                        <li key={group.groupId}>
                            {group.td} {group.tp}
                        </li>
                    ))}
                </ul>
            </TableCell>
        </TableRow>
    );
}
