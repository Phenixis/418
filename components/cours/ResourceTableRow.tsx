'use client';

import { CourseStatus } from '@/components/cours/course.types';
import type { ResourceTableItem } from '@/components/cours/ResourceTable';
import { Badge } from '@/components/ui/badge';
import Vignette from '@/components/ui/Vignette';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatInTimeZone } from 'date-fns-tz';
import { fr } from 'date-fns/locale/fr';
import { useRouter } from 'next/navigation';

const PARIS_TIME_ZONE = 'Europe/Paris';

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

export default function ResourceTableRow({ resourceItem }: Readonly<{ resourceItem: ResourceTableItem }>) {
    const router = useRouter();
    const resourceStatus = getResourceStatus(resourceItem);

    return (
        <TableRow
            className="even:bg-background odd:bg-white outline-2 outline-transparent hover:bg-white/50 hover:outline-primary cursor-pointer"
            onClick={() => {
                router.push(`/professeur/resource/${resourceItem.resource.resourceId}`);
            }}
        >
            <TableCell className="font-bold text-left">
                {resourceItem.resource.subject.length > 50
                    ? `${resourceItem.resource.subject.slice(0, 50)}...`
                    : resourceItem.resource.subject}
                {resourceItem.resource.source === 'ADE' && (
                    <Badge variant="secondary" className="ml-2">ADE</Badge>
                )}
            </TableCell>
            <TableCell className="hidden sm:table-cell">{resourceItem.totalSessionCount}</TableCell>
            <TableCell className="hidden sm:table-cell">{resourceItem.ongoingSessionCount}</TableCell>
            <TableCell className="hidden sm:table-cell">{resourceItem.upcomingSessionCount}</TableCell>
            <TableCell className="hidden sm:table-cell">{resourceItem.pastSessionCount}</TableCell>
            <TableCell className="hidden sm:table-cell">{formatNextSessionDate(resourceItem.nextSessionStartAt)}</TableCell>
            <TableCell className="sm:hidden">{formatInTimeZone(resourceItem.nextSessionStartAt || new Date(), PARIS_TIME_ZONE, 'dd/MM/yyyy', { locale: fr })}</TableCell>
            <TableCell>{resourceStatus ? <Vignette status={resourceStatus} /> : <span>Aucune seance</span>}</TableCell>
        </TableRow>
    );
}
