import ResourceTable, { ResourceTableItem } from '@/components/cours/ResourceTable';
import { resourceQueries } from '@/lib/db/queries/resource';
import { sessionQueries } from '@/lib/db/queries/session';
import { teacherQueries } from '@/lib/db/queries/teacher';
import type { Select as Resource } from '@/lib/db/schema/resource';
import type { Select as Session } from '@/lib/db/schema/session';

function getResourceStatusPriority(resourceItem: ResourceTableItem): number {
    if (resourceItem.ongoingSessionCount > 0) {
        return 0;
    }

    if (resourceItem.upcomingSessionCount > 0) {
        return 1;
    }

    if (resourceItem.pastSessionCount > 0) {
        return 2;
    }

    return 3;
}

export default async function DashboardPage() {
    const teacher = await teacherQueries.getTeacher();

    const resourcesQueryResult = await resourceQueries.getByTeacherMail(teacher.userMail);

    if ('error' in resourcesQueryResult) {
        return (
            <p>{resourcesQueryResult.error}</p>
        );
    }

    const resources = resourcesQueryResult.entity as Resource[];

    const sessionsQueryResult = resources.length > 0
        ? await sessionQueries.getByResourceIds(resources.map((resource) => resource.resourceId))
        : { success: 'Aucune seance', entity: [] as Session[] };

    const sessions = 'error' in sessionsQueryResult
        ? []
        : (sessionsQueryResult.entity as Session[]);

    const sessionsByResourceId = new Map<string, Session[]>();

    for (const session of sessions) {
        const previousSessions = sessionsByResourceId.get(session.resourceId) ?? [];
        sessionsByResourceId.set(session.resourceId, [...previousSessions, session]);
    }

    const now = new Date();
    const resourceItems = resources
        .map((resource) => {
            const resourceSessions = sessionsByResourceId.get(resource.resourceId) ?? [];

            const ongoingSessionCount = resourceSessions.filter(
                (session) => now >= session.startAt && now <= session.endAt
            ).length;
            const upcomingSessionCount = resourceSessions.filter((session) => now < session.startAt).length;
            const pastSessionCount = resourceSessions.filter((session) => now > session.endAt).length;

            const nextSession = resourceSessions
                .filter((session) => session.startAt > now)
                .sort((firstSession, secondSession) => firstSession.startAt.getTime() - secondSession.startAt.getTime())[0];

            return {
                resource,
                totalSessionCount: resourceSessions.length,
                ongoingSessionCount,
                upcomingSessionCount,
                pastSessionCount,
                nextSessionStartAt: nextSession?.startAt,
            };
        })
        .sort((firstResourceItem, secondResourceItem) => {
            const firstStatusPriority = getResourceStatusPriority(firstResourceItem);
            const secondStatusPriority = getResourceStatusPriority(secondResourceItem);

            if (firstStatusPriority !== secondStatusPriority) {
                return firstStatusPriority - secondStatusPriority;
            }

            const firstNextSessionTimestamp = firstResourceItem.nextSessionStartAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
            const secondNextSessionTimestamp = secondResourceItem.nextSessionStartAt?.getTime() ?? Number.MAX_SAFE_INTEGER;

            if (firstNextSessionTimestamp !== secondNextSessionTimestamp) {
                return firstNextSessionTimestamp - secondNextSessionTimestamp;
            }

            return firstResourceItem.resource.subject.localeCompare(secondResourceItem.resource.subject);
        });

    return (
        <section className="flex flex-col">
            <ResourceTable resourceItems={resourceItems} />
        </section>
    );
}
