import { groupQueries } from "@/lib/db/queries/group";
import { sessionGroupQueries } from "@/lib/db/queries/session-group";
import { sessionQueries } from "@/lib/db/queries/session";
import type { Select as Group } from "@/lib/db/schema/group";
import type { Select as Session } from "@/lib/db/schema/session";
import type { Select as SessionGroup } from "@/lib/db/schema/session-group";
import { NextResponse } from "next/server";

function getSessionStatusPriority(session: Session, now: Date): number {
    if (now >= session.startAt && now <= session.endAt) {
        return 0;
    }

    if (now < session.startAt) {
        return 1;
    }

    return 2;
}

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const resourceId = requestUrl.searchParams.get("resourceId");

    if (!resourceId) {
        return NextResponse.json({ error: "Le paramètre resourceId est requis." }, { status: 400 });
    }

    const sessionsResult = await sessionQueries.getByResourceId(resourceId);
    const sessions = 'error' in sessionsResult ? [] : (sessionsResult.entity as Session[]);

    const sessionGroupsResult = sessions.length > 0
        ? await sessionGroupQueries.getBySessionIds(sessions.map((session) => session.sessionId))
        : { success: 'Aucune seance', entity: [] as SessionGroup[] };

    const sessionGroups = 'error' in sessionGroupsResult ? [] : (sessionGroupsResult.entity as SessionGroup[]);
    const groupIds = [...new Set(sessionGroups.map((sessionGroup) => sessionGroup.groupId))];

    const groups = groupIds.length > 0
        ? (await groupQueries.getByIds(groupIds)).entity as Group[]
        : [];

    const now = new Date();
    const sortedSessions = sessions.slice().sort((firstSession, secondSession) => {
        const firstStatusPriority = getSessionStatusPriority(firstSession, now);
        const secondStatusPriority = getSessionStatusPriority(secondSession, now);

        if (firstStatusPriority !== secondStatusPriority) {
            return firstStatusPriority - secondStatusPriority;
        }

        return firstSession.startAt.getTime() - secondSession.startAt.getTime();
    });

    return NextResponse.json({ sessions: sortedSessions, sessionGroups, groups }, { status: 200 });
}
