import TableDemo from '@/components/cours/CourseTableRow';
import CreerCours from '@/components/cours/creation/creer-cours';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { courseQueries } from '@/lib/db/queries/course';
import { courseGroupQueries } from '@/lib/db/queries/course-group';
import { groupQueries } from '@/lib/db/queries/group';
import type { Select as Course } from '@/lib/db/schema/course';
import type { Select as CourseGroup } from '@/lib/db/schema/course-group';
import type { Select as Group } from '@/lib/db/schema/group';
import Link from 'next/dist/client/link';
import Vignette from '@/components/ui/Vignette';

export default async function DashboardPage() {
    const coursesQueryResults = await courseQueries.getAll();

    if ('error' in coursesQueryResults) {
        return (
            <>
                <p>{coursesQueryResults.error}</p>
            </>
        );
    }

    const courses = coursesQueryResults.entity as Course[];

    const groupCourseQueryResult = await courseGroupQueries.getByCourseIds(courses.map(course => course.courseId));

    if ('error' in groupCourseQueryResult) {
        return (
            <>
                <p>{groupCourseQueryResult.error}</p>
            </>
        );
    }

    const groupCourses = groupCourseQueryResult.entity as CourseGroup[];

    const groupIds = [...new Set(groupCourses.map(gc => gc.groupId))];

    const groupsQueryResult = await groupQueries.getByIds(groupIds);

    if ('error' in groupsQueryResult) {
        return (
            <>
                <p>{groupsQueryResult.error}</p>
            </>
        );
    }

    const groups = groupsQueryResult.entity as Group[];

    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h1 className="h1">Dashboard</h1>
                <CreerCours />
            </div>
            {'success' in coursesQueryResults && (
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
                        {(coursesQueryResults.entity as Course[]).map(course => (
                            <TableDemo
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
                        ))}
                    </TableBody>
                </Table>
            )}
        </>
    );
}
