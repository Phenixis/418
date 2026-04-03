'use client';

import { useActionState, useState } from 'react';
import { useRouter } from 'next/navigation';

import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from '@/components/ui/alert-dialog';
import Vignette from '@/components/ui/Vignette';

import { formatInTimeZone } from 'date-fns-tz';
import { fr } from 'date-fns/locale/fr';

import { deleteCourse } from '@/lib/actions/cours';
import { CourseWithStatus } from './TableauCours';
import { Select as Group } from '@/lib/db/schema/group';

import MoreVertIcon from '@mui/icons-material/MoreVert';

const PARIS_TIME_ZONE = 'Europe/Paris';

interface CoursProps {
    cours: CourseWithStatus;
    groups: Group[];
    showStatus?: boolean;
    rowIndex?: number;
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

export default function CourseTableRow({ cours, groups, showStatus = true, rowIndex = 0 }: Readonly<CoursProps>) {
    const router = useRouter();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const isEvenRow = rowIndex % 2 === 0;

    const [deleteState, deleteCourseAction, deleting] = useActionState<any, FormData>(
        async (_previousState, formData) => {
            const deleteResult: unknown = await deleteCourse(formData);

            if (typeof deleteResult === 'object' && deleteResult !== null && 'success' in deleteResult) {
                setIsDeleteDialogOpen(false);
                router.refresh();
            }

            return deleteResult as any;
        },
        { pending: false }
    );

    return (
        <TableRow
            className={`outline-2 outline-transparent hover:bg-white/50 hover:outline-primary cursor-pointer ${isEvenRow ? 'bg-white' : 'bg-background'}`}
            onClick={(event) => {
                const target = event.target as HTMLElement;

                if (target.closest('[data-ignore-row-click]')) {
                    return;
                }

                router.push(`/professeur/cours/${cours.courseId}`);
            }}
        >
            <TableCell className="flex flex-row text-center justify-center gap-1">
                {groups.map((group, index) => (
                    <span key={group.groupId}>
                        {group.td}{group.tp}{index < groups.length - 1 ? (<>,&nbsp;</>) : ''}
                    </span>
                ))}
            </TableCell>
            <TableCell className="font-bold text-left">{cours.subject}</TableCell>
            <TableCell className="w-px text-lg">{formatInTimeZone(cours.startAt, PARIS_TIME_ZONE, 'HH:mm', { locale: fr })}</TableCell>
            <TableCell className="w-px text-lg">{formatInTimeZone(cours.endAt, PARIS_TIME_ZONE, 'HH:mm', { locale: fr })}</TableCell>
            <TableCell className="w-px">{formatDate(cours.startAt)}</TableCell>
            {showStatus && (
                <TableCell>
                    <Vignette status={cours.status} />
                </TableCell>
            )}
            <TableCell className="w-px px-1 text-right" data-ignore-row-click onClick={(event) => event.stopPropagation()}>
                <DropdownMenu>
                    <DropdownMenuTrigger className="cursor-pointer p-0" title="Actions" asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(event) => {
                                event.stopPropagation();
                            }}
                        >
                            <span className="sr-only">Open actions menu</span>
                            <MoreVertIcon fontSize="small" />
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
                                <Button variant="destructive" type="submit" disabled={deleting}>
                                    {deleting ? 'Suppression...' : 'Supprimer'}
                                </Button>
                            </AlertDialogFooter>
                        </form>
                    </AlertDialogContent>
                </AlertDialog>

                {'error' in deleteState && typeof deleteState.error === 'string' ? (
                    <p className="text-sm text-destructive mt-2">{deleteState.error}</p>
                ) : null}

            </TableCell>
        </TableRow>
    );
}
