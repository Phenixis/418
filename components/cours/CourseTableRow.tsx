'use client';

import { TableCell, TableRow } from '@/components/ui/table';

import { CourseStatus } from '@/components/cours/course.types';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Vignette from '@/components/ui/Vignette';
import { deleteCourse } from '@/lib/actions/cours';
import { Select as Course } from '@/lib/db/schema/course';
import { Select as Group } from '@/lib/db/schema/group';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { formatInTimeZone } from 'date-fns-tz';
import { fr } from 'date-fns/locale/fr';
import { useRouter } from 'next/navigation';
import { useActionState, useEffect, useState } from 'react';

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
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [deleteState, deleteCourseAction, deleting] = useActionState<any, FormData>(
        async (prevState, formData) => {
            return await deleteCourse(formData);
        },
        { pending: false }
    );

    useEffect(() => {
        if ("success" in deleteState) {
            setIsDeleteDialogOpen(false);
            router.refresh();
        }
    }, [deleteState, router]);

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
            <TableCell data-ignore-row-click onClick={(event) => event.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger className="cursor-pointer p-2" title="Actions" asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={(event) => {
                                event.stopPropagation();
                            }}
                        >
                            <span className="sr-only">Open actions menu</span>
                            <MoreVertIcon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent >
                        {/* <DropdownMenuItem
                            onSelect={(event) => {
                                event.stopPropagation();
                            }}
                        >
                            <CoursModal initCourse={{
                                ...cours,
                                groups
                            }} />
                        </DropdownMenuItem>
                        <DropdownMenuSeparator /> */}
                        <DropdownMenuItem
                            data-ignore-row-click
                            variant="destructive"
                            onSelect={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                setIsDeleteDialogOpen(true);
                            }}
                        >
                            Supprimer le cours
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogContent size="sm">
                        <form action={deleteCourseAction}>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer ce cours ?</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogDescription>
                                Cette action supprimera le cours <strong>{cours.subject}</strong> programmé pour {formatDate(cours.startAt)}.
                            </AlertDialogDescription>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <input type="hidden" name="courseId" value={cours.courseId} />
                                <Button variant="destructive" type="submit">
                                    Supprimer
                                </Button>
                            </AlertDialogFooter>
                        </form>
                    </AlertDialogContent>
                </AlertDialog>

            </TableCell>
        </TableRow>
    );
}
