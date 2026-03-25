import CourseTableRow from '@/components/cours/CourseTableRow';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Select as Course } from '@/lib/db/schema/course';
import type { Select as Group } from '@/lib/db/schema/group';
import type { Select as CourseGroup } from '@/lib/db/schema/course-group';

export default function TableauCours({
    courses,
    groupCourses,
    groups
}: Readonly<{
    courses: Course[];
    groupCourses: CourseGroup[];
    groups: Group[];
}>) {
    return (
                <Table className="text-center">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-xl">Cours</TableHead>
                            <TableHead>Jours</TableHead>
                            <TableHead>Début</TableHead>
                            <TableHead>Fin</TableHead>
                            <TableHead>Groupes</TableHead>
                            <TableHead>Statut</TableHead>

                        </TableRow>
                    </TableHeader>
                    <TableBody className="rounded-lg overflow-hidden">
                        {courses.length > 0 ? courses.map(course => (
                            <CourseTableRow
                                key={course.courseId}
                                cours={course}
                                groups={groups.filter(group =>
                                    groupCourses.some(
                                        groupCourse =>
                                            groupCourse.courseId === course.courseId &&
                                            groupCourse.groupId === group.groupId
                                    )
                                )}
                            />
                        )) : (
                            <TableRow className="bg-white/80">
                                <td colSpan={6} className="text-center">
                                    Aucun cours disponible.
                                </td>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
    )
}