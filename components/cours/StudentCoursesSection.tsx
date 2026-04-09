import CoursContainer from "@/components/cours/CoursContainer";
import { groupQueries } from "@/lib/db/queries/group";
import { sessionGroupQueries } from "@/lib/db/queries/session-group";
import { sessionQueries } from "@/lib/db/queries/session";
import type { Select as Group } from "@/lib/db/schema/group";
import type { Select as Session } from "@/lib/db/schema/session";
import type { Select as SessionGroup } from "@/lib/db/schema/session-group";

function getSessionStatusPriority(session: Session, now: Date): number {
    if (now >= session.startAt && now <= session.endAt) {
        return 0;
    }

    if (now < session.startAt) {
        return 1;
    }

    return 2;
}

export default async function StudentCoursesSection({ studentMail }: Readonly<{ studentMail: string }>) {
    const studentSessionsResult = await sessionQueries.getByStudentMail(studentMail);
    const studentSessions = "error" in studentSessionsResult ? [] : (studentSessionsResult.entity as Session[]);

    const studentSessionGroupsResult = studentSessions.length > 0
        ? await sessionGroupQueries.getBySessionIds(studentSessions.map((session) => session.sessionId))
        : { success: "Aucune seance", entity: [] as SessionGroup[] };

    const studentSessionGroups = "error" in studentSessionGroupsResult
        ? []
        : (studentSessionGroupsResult.entity as SessionGroup[]);

    const studentGroupIds = [...new Set(studentSessionGroups.map((sessionGroup) => sessionGroup.groupId))];

    const studentGroups = studentGroupIds.length > 0
        ? (await groupQueries.getByIds(studentGroupIds)).entity as Group[]
        : [];

    const now = new Date();
    const sortedStudentSessions = studentSessions.slice().sort((firstSession, secondSession) => {
        const firstSessionStatusPriority = getSessionStatusPriority(firstSession, now);
        const secondSessionStatusPriority = getSessionStatusPriority(secondSession, now);

        if (firstSessionStatusPriority !== secondSessionStatusPriority) {
            return firstSessionStatusPriority - secondSessionStatusPriority;
        }

        return firstSession.startAt.getTime() - secondSession.startAt.getTime();
    });

    return (
        <div className="flex w-full flex-col gap-2">
            <h2 className="h2">Cours de l&apos;étudiant</h2>
            <CoursContainer
                courses={sortedStudentSessions}
                groupCourses={studentSessionGroups}
                groups={studentGroups}
            />
        </div>
    );
}
