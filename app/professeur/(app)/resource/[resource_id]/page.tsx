import CoursContainer from '@/components/cours/CoursContainer';
import CreateSessionButton from './CreateSessionButton';
import { groupQueries } from '@/lib/db/queries/group';
import { resourceQueries } from '@/lib/db/queries/resource';
import { sessionGroupQueries } from '@/lib/db/queries/session-group';
import { sessionQueries } from '@/lib/db/queries/session';
import { teacherQueries } from '@/lib/db/queries/teacher';
import type { Select as Group } from '@/lib/db/schema/group';
import type { Select as Session } from '@/lib/db/schema/session';
import type { Select as SessionGroup } from '@/lib/db/schema/session-group';

function getSessionStatusPriority(session: Session, now: Date): number {
    if (now >= session.startAt && now <= session.endAt) {
        return 0;
    }

    if (now < session.startAt) {
        return 1;
    }

    return 2;
}

export default async function ResourcePage({ params }: Readonly<{ params: Promise<{ resource_id: string }> }>) {
    const { resource_id } = await params;

    const teacher = await teacherQueries.getTeacher();
    const resourcesResult = await resourceQueries.getByTeacherMail(teacher.userMail);

    if ('error' in resourcesResult) {
        return <p>{resourcesResult.error}</p>;
    }

    const resource = resourcesResult.entity.find((existingResource) => existingResource.resourceId === resource_id);

    if (!resource) {
        return <p>Ressource introuvable ou non autorisee.</p>;
    }

    const sessionsResult = await sessionQueries.getByResourceId(resource_id);

    const sessions = 'error' in sessionsResult ? [] : (sessionsResult.entity as Session[]);

    const sessionGroupsResult = sessions.length > 0
        ? await sessionGroupQueries.getBySessionIds(sessions.map((session) => session.sessionId))
        : { success: 'Aucune seance', entity: [] as SessionGroup[] };

    const sessionGroups = 'error' in sessionGroupsResult
        ? []
        : (sessionGroupsResult.entity as SessionGroup[]);
    const groupIds = [...new Set(sessionGroups.map((sessionGroup) => sessionGroup.groupId))];

    const groups = groupIds.length > 0
        ? (await groupQueries.getByIds(groupIds)).entity as Group[]
        : [];

    const now = new Date();
    const sortedSessions = sessions.slice().sort((firstSession, secondSession) => {
        const firstSessionStatusPriority = getSessionStatusPriority(firstSession, now);
        const secondSessionStatusPriority = getSessionStatusPriority(secondSession, now);

        if (firstSessionStatusPriority !== secondSessionStatusPriority) {
            return firstSessionStatusPriority - secondSessionStatusPriority;
        }

        return firstSession.startAt.getTime() - secondSession.startAt.getTime();
    });

    return (
        <section className="flex flex-col">
            <header className="sticky top-0 z-20 mb-4 flex flex-col items-center gap-2 bg-background py-2 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <h1 className="h1">{resource.subject}</h1>
                <CreateSessionButton resourceId={resource.resourceId} />
            </header>
            <CoursContainer courses={sortedSessions} groupCourses={sessionGroups} groups={groups} />
        </section>
    );
}
