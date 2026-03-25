import { courseQueries } from '@/lib/db/queries/course';
import { courseGroupQueries } from '@/lib/db/queries/course-group';
import { groupQueries } from '@/lib/db/queries/group';
import type { Select as Course } from '@/lib/db/schema/course';
import type { Select as CourseGroup } from '@/lib/db/schema/course-group';
import type { Select as Group } from '@/lib/db/schema/group';
import TableauCours from '@/components/cours/TableauCours';

export default async function DashboardPage() {
    const coursesQueryResults = await courseQueries.getAll();

    if ('error' in coursesQueryResults) {
        return (
            <p>{coursesQueryResults.error}</p>
        );
    }

    const courses = coursesQueryResults.entity as Course[];

    const groupCourseQueryResult = await courseGroupQueries.getByCourseIds(courses.map(course => course.courseId));

    const groupCourses = groupCourseQueryResult.entity as CourseGroup[];

    const groupIds = [...new Set(groupCourses.map(gc => gc.groupId))];

    const groupsQueryResult = await groupQueries.getByIds(groupIds);

    if ('error' in groupsQueryResult) {
        return (
            <p>{groupsQueryResult.error}</p>
        );
    }

    const groups = groupsQueryResult.entity as Group[];

    return (
        <TableauCours courses={courses.slice().sort((a, b) => a.startAt.getTime() - b.startAt.getTime())} groupCourses={groupCourses} groups={groups} />
    );
}
