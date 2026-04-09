import CourseTableRow from '@/components/cours/CourseTableRow';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Select as Session } from '@/lib/db/schema/session';
import type { Select as Group } from '@/lib/db/schema/group';
import type { Select as SessionGroup } from '@/lib/db/schema/session-group';
import { cn } from '@/lib/utils';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

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

export default function TableauCours({
    courses,
    groupCourses,
    groups,
    sortColumn = null,
    sortDirection = 'asc',
    onSort = () => {},
}: Readonly<{
    courses: Session[];
    groupCourses: SessionGroup[];
    groups: Group[];
    sortColumn?: string | null;
    sortDirection?: 'asc' | 'desc';
    onSort?: (column: string) => void;
}>) {
    if (courses.length === 0) {
        return (
            <p>
                Aucun cours trouvé.
            </p>
        )
    }

    return (
        <Table className="text-center">
            <TableHeader>
                <TableRow>
                    <SortableHeader
                        column="startAt"
                        currentSortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="w-px"
                    >
                        Jour
                    </SortableHeader>
                    <SortableHeader
                        column="startAt"
                        currentSortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="w-px"
                    >
                        Début
                    </SortableHeader>
                    <SortableHeader
                        column="endAt"
                        currentSortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="w-px"
                    >
                        Fin
                    </SortableHeader>
                    <SortableHeader
                        column="subject"
                        currentSortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                        className="w-full text-xl"
                    >
                        Cours
                    </SortableHeader>
                    <SortableHeader
                        column={null}
                        currentSortColumn={sortColumn}
                        sortDirection={sortDirection}
                        onSort={onSort}
                    >
                        Groupes
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
                {courses.map(course => (
                    <CourseTableRow
                        key={course.sessionId}
                        cours={course}
                        groups={groups.filter(group =>
                            groupCourses.some(
                                groupCourse =>
                                    groupCourse.sessionId === course.sessionId &&
                                    groupCourse.groupId === group.groupId
                            )
                        )}
                    />
                ))}
            </TableBody>
        </Table>
    )
}