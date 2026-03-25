'use client';

import { TableCell, TableRow } from '@/components/ui/table';

import { Select as Course } from '@/lib/db/schema/course';
import { Select as Group } from '@/lib/db/schema/group';
import Vignette from '@/components/ui/Vignette';
import { CourseStatus } from '@/components/cours/course.types';
import { fr } from 'date-fns/locale/fr';
import { formatInTimeZone } from 'date-fns-tz';

const PARIS_TIME_ZONE = 'Europe/Paris';

interface CoursProps {
    cours: Course;
    groups: Group[];
}

export default function CourseTableRow({ cours, groups }: Readonly<CoursProps>) {
    const now = new Date();

    let status: CourseStatus = CourseStatus.EN_COURS;

    if (now < cours.startAt) {
        status = CourseStatus.A_VENIR;
    } else if (now > cours.endAt) {
        status = CourseStatus.TERMINE;
    }

    return (
        <TableRow
            className="even:bg-background odd:bg-white outline-2 outline-transparent hover:bg-white/50 hover:outline-primary cursor-pointer"
            onClick={() => {
                globalThis.location.href = `/professeur/cours/${cours.courseId}`;
            }}
        >
            <TableCell className="font-bold text-left">{cours.subject}</TableCell>
            <TableCell>{formatInTimeZone(cours.startAt, PARIS_TIME_ZONE, 'EEEE', { locale: fr })}</TableCell>
            <TableCell className="text-lg">{formatInTimeZone(cours.startAt, PARIS_TIME_ZONE, 'HH:mm', { locale: fr })}</TableCell>
            <TableCell className="text-lg">{formatInTimeZone(cours.endAt, PARIS_TIME_ZONE, 'HH:mm', { locale: fr })}</TableCell>
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
