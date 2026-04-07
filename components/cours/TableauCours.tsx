import CourseTableRow from '@/components/cours/CourseTableRow';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Select as Session } from '@/lib/db/schema/session';
import type { Select as Group } from '@/lib/db/schema/group';
import type { Select as SessionGroup } from '@/lib/db/schema/session-group';

export default function TableauCours({
    courses,
    groupCourses,
    groups
}: Readonly<{
    courses: Session[];
    groupCourses: SessionGroup[];
    groups: Group[];
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
                    <TableHead className="w-px">Jour</TableHead>
                    <TableHead className="w-px">Début</TableHead>
                    <TableHead className="w-px">Fin</TableHead>
                    <TableHead className="w-full text-xl">Cours</TableHead>
                    <TableHead>Groupes</TableHead>
                    <TableHead>Statut</TableHead>
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