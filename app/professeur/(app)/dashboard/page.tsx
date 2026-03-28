import { courseQueries } from '@/lib/db/queries/course';
import { courseGroupQueries } from '@/lib/db/queries/course-group';
import { groupQueries } from '@/lib/db/queries/group';
import { teacherQueries } from '@/lib/db/queries/teacher';
import type { Select as Course } from '@/lib/db/schema/course';
import type { Select as CourseGroup } from '@/lib/db/schema/course-group';
import type { Select as Group } from '@/lib/db/schema/group';
import TableauCours from '@/components/cours/TableauCours';
import { redirect } from 'next/navigation';

function getCourseStatusPriority(course: Course, now: Date): number {
    if (now >= course.startAt && now <= course.endAt) {
        return 0;
    }

    if (now < course.startAt) {
        return 1;
    }

    return 2;
}

export default async function DashboardPage() {
    const teacher = await teacherQueries.getTeacher();

    if (!teacher) {
        redirect("/professeur/connexion")
    }

    const coursesQueryResults = await courseQueries.getByTeacherMail(teacher.userMail);

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

    const groups = groupsQueryResult.entity as Group[];

    const now = new Date();
    const sortedCourses = courses.slice().sort((firstCourse, secondCourse) => {
        const firstCourseStatusPriority = getCourseStatusPriority(firstCourse, now);
        const secondCourseStatusPriority = getCourseStatusPriority(secondCourse, now);

        if (firstCourseStatusPriority !== secondCourseStatusPriority) {
            return firstCourseStatusPriority - secondCourseStatusPriority;
        }

        return firstCourse.startAt.getTime() - secondCourse.startAt.getTime();
    });

    return (
        <TableauCours courses={sortedCourses} groupCourses={groupCourses} groups={groups} />
    );
}
