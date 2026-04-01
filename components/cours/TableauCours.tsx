import CourseTableRow from '@/components/cours/CourseTableRow';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Select as Course } from '@/lib/db/schema/course';
import type { Select as Group } from '@/lib/db/schema/group';
import type { Select as CourseGroup } from '@/lib/db/schema/course-group';
import { CourseStatus } from './course.types';
import TableauCoursGroupe from './TableauCoursGroupe';

export type CourseWithStatus = Course & {
    status: CourseStatus;
};

export default function TableauCours({
    courses,
    groupCourses,
    groups,
    filtered = false
}: Readonly<{
    courses: CourseWithStatus[];
    groupCourses: CourseGroup[];
    groups: Group[];
    filtered?: boolean
}>) {

    const groupByStatus: Record<CourseStatus, CourseWithStatus[]> = {
        [CourseStatus.EN_COURS]: courses.filter(course => course.status === CourseStatus.EN_COURS),
        [CourseStatus.A_VENIR]: courses.filter(course => course.status === CourseStatus.A_VENIR),
        [CourseStatus.TERMINE]: courses.filter(course => course.status === CourseStatus.TERMINE)
    };

    return (
        <Table className="text-center">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-1/14">Statut</TableHead>
                    <TableHead className="w-1/9">Groupes</TableHead>
                    <TableHead className="text-left text-lg">Cours</TableHead>
                    <TableHead className="w-1/20">Début</TableHead>
                    <TableHead className="w-1/20">Fin</TableHead>
                    <TableHead className="w-1/12">Jour</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody className="rounded-lg">
                {courses.length === 0 ? (
                    <TableRow className="bg-white/80">
                        <td colSpan={6} className="text-center">
                            Aucun cours disponible.
                        </td>
                    </TableRow>
                ) : filtered ? (
                    courses.map(course => (
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
                    ))
                ) : (
                    Object.entries(groupByStatus).map(([status, courses]) => (
                        <TableauCoursGroupe
                            key={status}
                            status={status as CourseStatus}
                            courses={courses}
                            groupCourses={groupCourses}
                            groups={groups}
                        />
                    ))
                )}
            </TableBody>
        </Table>
    )
}