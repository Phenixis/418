import { courseQueries } from '@/lib/db/queries/course';
import { courseGroupQueries } from '@/lib/db/queries/course-group';
import { groupQueries } from '@/lib/db/queries/group';
import { teacherQueries } from '@/lib/db/queries/teacher';
import type { Select as Course } from '@/lib/db/schema/course';
import type { Select as CourseGroup } from '@/lib/db/schema/course-group';
import type { Select as Group } from '@/lib/db/schema/group';
import CoursContainer from '@/components/cours/CoursContainer';
import { CourseWithStatus } from '@/components/cours/TableauCours';
import { CourseStatus } from '@/components/cours/course.types';

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

    const courseWithStatus: CourseWithStatus[] = courses.map(course => {
        let status = CourseStatus.EN_COURS;

        if (now < course.startAt) {
            status = CourseStatus.A_VENIR;
        } else if (now > course.endAt) {
            status = CourseStatus.TERMINE;
        }

        return {
            ...course,
            status
        };
    });

    const sortedCourses = courseWithStatus.slice().sort((firstCourse, secondCourse) => {
        const firstCourseStatusPriority = getCourseStatusPriority(firstCourse, now);
        const secondCourseStatusPriority = getCourseStatusPriority(secondCourse, now);

        if (firstCourseStatusPriority !== secondCourseStatusPriority) {
            return firstCourseStatusPriority - secondCourseStatusPriority;
        }

        return secondCourse.startAt.getTime() - firstCourse.startAt.getTime();
    });

    return (
        <CoursContainer
            courses={sortedCourses}
            groupCourses={groupCourses}
            groups={groups}
        />
    );
}
