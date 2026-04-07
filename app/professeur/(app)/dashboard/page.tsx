import { sessionQueries } from '@/lib/db/queries/session';
import { sessionGroupQueries } from '@/lib/db/queries/session-group';
import { groupQueries } from '@/lib/db/queries/group';
import { teacherQueries } from '@/lib/db/queries/teacher';
import type { Select as Session } from '@/lib/db/schema/session';
import type { Select as SessionGroup } from '@/lib/db/schema/session-group';
import type { Select as Group } from '@/lib/db/schema/group';
import CoursContainer from '@/components/cours/CoursContainer';

function getCourseStatusPriority(course: Session, now: Date): number {
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

    const coursesQueryResults = await sessionQueries.getByTeacherMail(teacher.userMail);

    if ('error' in coursesQueryResults) {
        return (
            <p>{coursesQueryResults.error}</p>
        );
    }

    const courses = coursesQueryResults.entity as Session[];

    const groupCourseQueryResult = await sessionGroupQueries.getBySessionIds(courses.map((course) => course.sessionId));

    const groupCourses = groupCourseQueryResult.entity as SessionGroup[];

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
        <>
        {/*Ajout des filtres et tris pour les cours*/}
        <CoursContainer 
            courses={sortedCourses} 
            groupCourses={groupCourses} 
            groups={groups} 
        />
        </>
    );
}
