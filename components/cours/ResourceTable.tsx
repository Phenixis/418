import CollapsibleResource from '@/components/cours/CollapsibleResource';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Select as Resource } from '@/lib/db/schema/resource';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

export interface ResourceTableItem {
    resource: Resource;
    totalSessionCount: number;
    ongoingSessionCount: number;
    upcomingSessionCount: number;
    pastSessionCount: number;
    nextSessionStartAt?: Date;
}

interface SortableHeaderProps {
    children: React.ReactNode;
    column: string | null;
    currentSortColumn: string | null;
    sortDirection: 'asc' | 'desc';
    onSort: (column: string) => void;
    className?: string;
}

function SortableHeader({
    children,
    column,
    currentSortColumn,
    sortDirection,
    onSort,
    className,
}: SortableHeaderProps) {
    const isActive = column === currentSortColumn;

    return (
        <TableHead
            className={cn(
                column ? 'cursor-pointer hover:bg-muted/50' : '',
                className
            )}
            onClick={() => column && onSort(column)}
        >
            <div className="flex items-center gap-2">
                {children}
                {column && (
                    <span className="shrink-0">
                        {isActive ? (
                            sortDirection === 'asc' ? (
                                <ArrowUpwardIcon className="text-primary" style={{ fontSize: '16px' }} />
                            ) : (
                                <ArrowDownwardIcon className="text-primary" style={{ fontSize: '16px' }} />
                            )
                        ) : (
                            <UnfoldMoreIcon className="text-muted-foreground" style={{ fontSize: '16px' }} />
                        )}
                    </span>
                )}
            </div>
        </TableHead>
    );
}

export default function ResourceTable({
    resourceItems,
    sortColumn = null,
    sortDirection = 'asc',
    onSort = () => {},
}: Readonly<{
    resourceItems: ResourceTableItem[];
    sortColumn?: string | null;
    sortDirection?: 'asc' | 'desc';
    onSort?: (column: string) => void;
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
                    <SortableHeader
                        column="subject"
                        currentSortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="w-full text-xl text-left"
                    >
                        Ressource
                    </SortableHeader>
                    <SortableHeader
                        column="totalSessionCount"
                        currentSortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="hidden sm:table-cell"
                    >
                        Seances
                    </SortableHeader>
                    <SortableHeader
                        column="ongoingSessionCount"
                        currentSortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="hidden sm:table-cell"
                    >
                        En cours
                    </SortableHeader>
                    <SortableHeader
                        column="upcomingSessionCount"
                        currentSortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="hidden sm:table-cell"
                    >
                        A venir
                    </SortableHeader>
                    <SortableHeader
                        column="pastSessionCount"
                        currentSortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="hidden sm:table-cell"
                    >
                        Terminees
                    </SortableHeader>
                    <SortableHeader
                        column="nextSessionStartAt"
                        currentSortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                    >
                        Prochaine seance
                    </SortableHeader>
                    <SortableHeader
                        column={null}
                        currentSortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                    >
                        Statut
                    </SortableHeader>
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