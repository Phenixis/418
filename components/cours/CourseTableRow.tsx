'use client';

import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CourseStatus } from '@/components/cours/course.types';
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Vignette from '@/components/ui/Vignette';
import { useDialog } from '@/lib/hooks/use-dialog';
import { Select as Session } from '@/lib/db/schema/session';
import { Select as Group } from '@/lib/db/schema/group';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { formatInTimeZone } from 'date-fns-tz';
import { fr } from 'date-fns/locale/fr';
import { useRouter } from 'next/navigation';

const PARIS_TIME_ZONE = 'Europe/Paris';

export interface CoursProps {
    cours: Session;
    groups: Group[];
}

/**
 * Si la date est de +/- 7 jours, affiche une date relative (ex: "vendredi dernier", "jeudi prochain"),
 * sinon affiche la date au format "dd/MM/yyyy" (ex: "14/09/2023").
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
    const { setEditSessionData, setDeleteSessionData } = useDialog();

    let status: CourseStatus = CourseStatus.EN_COURS;

    if (now < cours.startAt) {
        status = CourseStatus.A_VENIR;
    } else if (now > cours.endAt) {
        status = CourseStatus.TERMINE;
    }

    return (
        <TableRow
            className="even:bg-background odd:bg-white outline-2 outline-transparent hover:bg-white/50 hover:outline-primary cursor-pointer"
            onClick={(event) => {
                const target = event.target as HTMLElement;

                if (target.closest('[data-ignore-row-click]')) {
                    return;
                }

                router.push(`/professeur/session/${cours.sessionId}`);
            }}
        >
            <TableCell className="w-px text-left pl-5">{formatDate(cours.startAt)}</TableCell>
            <TableCell className="w-px text-lg">{formatInTimeZone(cours.startAt, PARIS_TIME_ZONE, 'HH:mm', { locale: fr })}</TableCell>
            <TableCell className="w-px text-lg">{formatInTimeZone(cours.endAt, PARIS_TIME_ZONE, 'HH:mm', { locale: fr })}</TableCell>
            <TableCell className="font-bold text-left">
                {cours.subject}
                {cours.source === 'ADE' && (
                    <Badge variant="secondary" className="ml-2">ADE</Badge>
                )}
            </TableCell>
            <TableCell className="text-center justify-center gap-1">
                {groups.map((group, index) => (
                    <span key={group.groupId}>
                        {group.td}{group.tp}{index < groups.length - 1 ? (<>,&nbsp;</>) : ''}
                    </span>
                ))}
            </TableCell>
            <TableCell>
                <Vignette status={status} />
            </TableCell>
            <TableCell data-ignore-row-click onClick={(event) => event.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger className="cursor-pointer p-2" title="Actions" asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(event) => event.stopPropagation()}
                        >
                            <span className="sr-only">Open actions menu</span>
                            <MoreVertIcon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem
                            onSelect={() => setEditSessionData({
                                resourceId: cours.resourceId,
                                session: {
                                    sessionId: cours.sessionId,
                                    subject: cours.subject,
                                    startAt: cours.startAt,
                                    endAt: cours.endAt,
                                    groups: groups.map((group) => ({ groupId: group.groupId })),
                                },
                            })}
                        >
                            Modifier la séance
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => setDeleteSessionData({
                                sessionId: cours.sessionId,
                                subject: cours.subject,
                                startAt: cours.startAt,
                            })}
                        >
                            Supprimer le cours
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}
