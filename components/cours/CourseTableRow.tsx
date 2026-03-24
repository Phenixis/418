'use client';

import { TableCell, TableRow } from '@/components/ui/table';

import { Select as Course } from '@/lib/db/schema/course';
import { Select as Group } from '@/lib/db/schema/group';
import { format } from 'date-fns';
import Vignette, { vignetteLabels } from '@/components/ui/Vignette';
import { CourseStatus } from '@/components/cours/course.types';
import { fr } from 'date-fns/locale/fr';

interface CoursProps {
    cours: Course;
    groups: Group[];
}

export default function CourseTableRow({ cours, groups }: CoursProps) {
    const now = new Date();

    const status: CourseStatus =
        now < cours.startAt ? CourseStatus.A_VENIR : now > cours.endAt ? CourseStatus.TERMINE : CourseStatus.EN_COURS;

    return (
        <TableRow
            className="even:bg-background odd:bg-white outline-2 outline-transparent hover:bg-white/50 hover:outline-primary cursor-pointer"
            onClick={() => {
                globalThis.location.href = `/professeur/cours/${cours.courseId}`;
            }}
        >
            <TableCell className="font-bold text-left">{cours.subject}</TableCell>
            <TableCell>{format(cours.startAt, 'EEEE', { locale: fr })}</TableCell>
            <TableCell className="font-lg">{format(cours.startAt, 'HH:mm', { locale: fr })}</TableCell>
            <TableCell className="font-lg">{format(cours.endAt, 'HH:mm', { locale: fr })}</TableCell>
            <TableCell className="flex flex-row text-center justify-center gap-1">
                {groups.map((group, index) => (
                    <span key={group.groupId}>
                        {group.td}{group.tp}{index < groups.length - 1 ? (<>,&nbsp;</>) : ''}
                    </span>
                ))}
            </TableCell>
            <TableCell>
                <Vignette status={status} />
            </TableCell>
        </TableRow>
    );
}
