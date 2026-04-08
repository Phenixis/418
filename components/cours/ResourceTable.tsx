import CollapsibleResource from '@/components/cours/CollapsibleResource';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Select as Resource } from '@/lib/db/schema/resource';

export interface ResourceTableItem {
    resource: Resource;
    totalSessionCount: number;
    ongoingSessionCount: number;
    upcomingSessionCount: number;
    pastSessionCount: number;
    nextSessionStartAt?: Date;
}

export default function ResourceTable({
    resourceItems,
}: Readonly<{
    resourceItems: ResourceTableItem[];
}>) {
    if (resourceItems.length === 0) {
        return (
            <p>
                Aucune ressource trouvee.
            </p>
        );
    }

    return (
        <Table className="text-center">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-full text-xl text-left">Ressource</TableHead>
                    <TableHead className="hidden sm:table-cell">Seances</TableHead>
                    <TableHead className="hidden sm:table-cell">En cours</TableHead>
                    <TableHead className="hidden sm:table-cell">A venir</TableHead>
                    <TableHead className="hidden sm:table-cell">Terminees</TableHead>
                    <TableHead>Prochaine seance</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody className="rounded-lg overflow-hidden">
                {resourceItems.map((resourceItem) => (
                    <CollapsibleResource
                        key={resourceItem.resource.resourceId}
                        resourceItem={resourceItem}
                    />
                ))}
            </TableBody>
        </Table>
    );
}