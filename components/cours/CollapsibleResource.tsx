'use client';

import { CourseStatus } from '@/components/cours/course.types';
import type { ResourceTableItem } from '@/components/cours/ResourceTable';
import TableauCours from '@/components/cours/TableauCours';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Vignette from '@/components/ui/Vignette';
import { TableCell, TableRow } from '@/components/ui/table';
import { useDialog } from '@/lib/hooks/use-dialog';
import type { Select as Group } from '@/lib/db/schema/group';
import type { Select as Session } from '@/lib/db/schema/session';
import type { Select as SessionGroup } from '@/lib/db/schema/session-group';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { cn } from '@/lib/utils';
import { formatInTimeZone } from 'date-fns-tz';
import { fr } from 'date-fns/locale/fr';
import { useEffect, useState } from 'react';

const PARIS_TIME_ZONE = 'Europe/Paris';

interface SessionsApiResponse {
    sessions: (Omit<Session, 'startAt' | 'endAt' | 'createdAt' | 'updatedAt' | 'deletedAt'> & {
        startAt: string;
        endAt: string;
        createdAt: string;
        updatedAt: string;
        deletedAt: string | null;
    })[];
    sessionGroups: SessionGroup[];
    groups: Group[];
}

interface SessionsData {
    sessions: Session[];
    sessionGroups: SessionGroup[];
    groups: Group[];
}

function getResourceStatus(resourceItem: ResourceTableItem): CourseStatus | null {
    if (resourceItem.ongoingSessionCount > 0) {
        return CourseStatus.EN_COURS;
    }

    if (resourceItem.upcomingSessionCount > 0) {
        return CourseStatus.A_VENIR;
    }

    if (resourceItem.pastSessionCount > 0) {
        return CourseStatus.TERMINE;
    }

    return null;
}

function formatNextSessionDate(nextSessionStartAt?: Date): string {
    if (!nextSessionStartAt) {
        return '-';
    }

    return formatInTimeZone(nextSessionStartAt, PARIS_TIME_ZONE, 'dd/MM/yyyy HH:mm', { locale: fr });
}

function SessionsLoadingSkeleton() {
    return (
        <div className="p-2 space-y-2">
            {Array.from({ length: 3 }, (_, index) => `skeleton-${index + 1}`).map((key) => (
                <div key={key} className="h-10 w-full animate-pulse rounded bg-muted" />
            ))}
        </div>
    );
}

export default function CollapsibleResource({ resourceItem }: Readonly<{ resourceItem: ResourceTableItem }>) {
    const { setCreateSessionResourceId, setDeleteResourceData } = useDialog();

    const [isOpen, setIsOpen] = useState(false);
    const [sessionsData, setSessionsData] = useState<SessionsData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const resourceStatus = getResourceStatus(resourceItem);

    useEffect(() => {
        setHasFetched(false);
        setSessionsData(null);
    }, [
        resourceItem.totalSessionCount,
        resourceItem.ongoingSessionCount,
        resourceItem.upcomingSessionCount,
        resourceItem.pastSessionCount,
    ]);

    useEffect(() => {
        const shouldFetchSessions = isOpen && !hasFetched && !isLoading;

        if (!shouldFetchSessions) {
            return;
        }

        const loadSessions = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(`/api/teacher/sessions?resourceId=${resourceItem.resource.resourceId}`);

                if (!response.ok) {
                    throw new Error(`Impossible de charger les séances de ${resourceItem.resource.subject}.`);
                }

                const data = (await response.json()) as SessionsApiResponse;

                const sessions: Session[] = data.sessions.map((session) => ({
                    ...session,
                    startAt: new Date(session.startAt),
                    endAt: new Date(session.endAt),
                    createdAt: new Date(session.createdAt),
                    updatedAt: new Date(session.updatedAt),
                    deletedAt: session.deletedAt ? new Date(session.deletedAt) : null,
                }));

                setSessionsData({ sessions, sessionGroups: data.sessionGroups, groups: data.groups });
                setHasFetched(true);
            } catch (err) {
                const errorMessage = err instanceof Error
                    ? err.message
                    : 'Une erreur inattendue est survenue pendant le chargement des séances.';

                setError(errorMessage);
            } finally {
                setIsLoading(false);
            }
        };

        void loadSessions();
    }, [hasFetched, isLoading, isOpen, resourceItem.resource.resourceId, resourceItem.resource.subject]);

    const showSkeleton = isOpen && !hasFetched && !error;

    return (
        <>
            <TableRow
                className="even:bg-background odd:bg-white outline-2 outline-transparent hover:bg-white/50 hover:outline-primary cursor-pointer"
                onClick={(event) => {
                    const target = event.target as HTMLElement;
                    if (target.closest('[data-ignore-row-click]')) {
                        return;
                    }
                    setIsOpen((previous) => !previous);
                }}
            >
                <TableCell className="font-bold text-left">
                    <div className="flex items-center gap-2">
                        <ExpandMoreIcon
                            className={cn(
                                'shrink-0 transition-transform duration-200 ease-in-out text-muted-foreground',
                                isOpen && 'rotate-180'
                            )}
                        />
                        {resourceItem.resource.subject}
                    </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{resourceItem.totalSessionCount}</TableCell>
                <TableCell className="hidden sm:table-cell">{resourceItem.ongoingSessionCount}</TableCell>
                <TableCell className="hidden sm:table-cell">{resourceItem.upcomingSessionCount}</TableCell>
                <TableCell className="hidden sm:table-cell">{resourceItem.pastSessionCount}</TableCell>
                <TableCell className="hidden sm:table-cell">{formatNextSessionDate(resourceItem.nextSessionStartAt)}</TableCell>
                <TableCell className="sm:hidden">
                    {formatInTimeZone(
                        resourceItem.nextSessionStartAt || new Date(),
                        PARIS_TIME_ZONE,
                        'dd/MM/yyyy',
                        { locale: fr }
                    )}
                </TableCell>
                <TableCell>
                    {resourceStatus ? <Vignette status={resourceStatus} /> : <span>Aucune séance</span>}
                </TableCell>
                <TableCell data-ignore-row-click onClick={(event) => event.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger className="cursor-pointer" title="Actions" asChild>
                            <Button variant="ghost" size="icon" onClick={(event) => event.stopPropagation()}>
                                <span className="sr-only">Ouvrir le menu actions</span>
                                <MoreVertIcon />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem
                                onSelect={() => setCreateSessionResourceId(resourceItem.resource.resourceId)}
                            >
                                Créer une séance
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                variant="destructive"
                                onSelect={() => setDeleteResourceData({
                                    resourceId: resourceItem.resource.resourceId,
                                    subject: resourceItem.resource.subject,
                                })}
                            >
                                Supprimer la ressource
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
            </TableRow>
            {isOpen && (
                <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={8} className="p-0">
                        <div className="ml-6 border-l-2 border-border bg-muted/20">
                            {showSkeleton && <SessionsLoadingSkeleton />}
                            {error && <p className="p-4 text-destructive">{error}</p>}
                            {sessionsData && (
                                <TableauCours
                                    courses={sessionsData.sessions}
                                    groupCourses={sessionsData.sessionGroups}
                                    groups={sessionsData.groups}
                                />
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
}
