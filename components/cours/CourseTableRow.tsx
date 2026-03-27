'use client';

import { TableCell, TableRow } from '@/components/ui/table';

import { Select as Course } from '@/lib/db/schema/course';
import { Select as Group } from '@/lib/db/schema/group';
import Vignette from '@/components/ui/Vignette';
import { CourseStatus } from '@/components/cours/course.types';
import { fr } from 'date-fns/locale/fr';
import { formatInTimeZone } from 'date-fns-tz';
import { useRouter } from 'next/navigation';

const PARIS_TIME_ZONE = 'Europe/Paris';

interface CoursProps {
    cours: Course;
    groups: Group[];
}

/**
 * Si la date est de +/- 7 jours, affiche une date relative (ex: "vendredi dernier", "jeudi prochain"),
 * sinon affiche la date au format "dd/MM/yyyy" (ex: "14/09/2023").
 * @param date
 */
function formatDate(date: Date): string {
    const now = new Date();
    const diffInDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays >= -7 && diffInDays <= 7) {
        const weekdayName = formatInTimeZone(date, PARIS_TIME_ZONE, 'EEEE', { locale: fr });

        if (diffInDays === 0) {
            return "Aujourd'hui";
        }

        if (diffInDays < 0) {
            return `${weekdayName} dernier`;
        }

        return `${weekdayName} prochain`;
    }

    return formatInTimeZone(date, PARIS_TIME_ZONE, 'dd/MM/yyyy', { locale: fr });
}

export default function CourseTableRow({ cours, groups }: Readonly<CoursProps>) {
    const now = new Date();
    const router = useRouter();

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
                router.push(`/professeur/cours/${cours.courseId}`);
            }}
        >
            <TableCell className="w-px">{formatDate(cours.startAt)}</TableCell>
            <TableCell className="w-px text-lg">{formatInTimeZone(cours.startAt, PARIS_TIME_ZONE, 'HH:mm', { locale: fr })}</TableCell>
            <TableCell className="w-px text-lg">{formatInTimeZone(cours.endAt, PARIS_TIME_ZONE, 'HH:mm', { locale: fr })}</TableCell>
            <TableCell className="font-bold text-left">{cours.subject}</TableCell>
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
