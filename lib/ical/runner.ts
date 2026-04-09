import { groupQueries } from "@/lib/db/queries/group";
import { resourceQueries } from "@/lib/db/queries/resource";
import { sessionQueries } from "@/lib/db/queries/session";
import { teacherQueries } from "@/lib/db/queries/teacher";
import { mapSummaryToCourse, parseGroupCode } from "@/lib/utils/ical-course-mapping";
import { fetchAndParseIcalFeed } from "@/lib/utils/ical-parser";

export interface IcalImportResult {
    resourceCount: number;
    sessionCount: number;
}

type ProgressCallback = (current: number, total: number) => void;

export async function runIcalImport(
    icalUrl: string,
    teacherMail: string,
    onProgress?: ProgressCallback
): Promise<IcalImportResult> {
    const events = await fetchAndParseIcalFeed(icalUrl);

    const total = events.length;
    onProgress?.(0, total);

    const allAdeSessionsResult = await sessionQueries.findAllAde();
    const sessionIdByAdeUid = new Map<string, string>();

    if ('entity' in allAdeSessionsResult) {
        for (const session of allAdeSessionsResult.entity) {
            if (session.adeUid) {
                sessionIdByAdeUid.set(session.adeUid, session.sessionId);
            }
        }
    }

    const allGroupsResult = await groupQueries.getAll();
    const groupIdByKey = new Map<string, number>();

    if ('entity' in allGroupsResult) {
        for (const group of allGroupsResult.entity) {
            groupIdByKey.set(`${group.promo}-${group.td}-${group.tp}`, group.groupId);
        }
    }

    let resourceCount = 0;
    let sessionCount = 0;
    let current = 0;

    const resourceIdByCourseName = new Map<string, string>();

    for (const event of events) {
        const mapping = mapSummaryToCourse(event.summary);

        if (!mapping) {
            onProgress?.(++current, total);
            continue;
        }

        const { courseName, sessionName } = mapping;
        let resourceId: string;

        if (resourceIdByCourseName.has(courseName)) {
            resourceId = resourceIdByCourseName.get(courseName)!;
        } else {
            const resourceResult = await resourceQueries.upsertAde(courseName, teacherMail);

            if ("error" in resourceResult) {
                throw new Error("Erreur lors de la création d'une ressource.");
            }

            resourceId = resourceResult.entity.resourceId;
            resourceIdByCourseName.set(courseName, resourceId);
            resourceCount++;
        }

        const groupIds: number[] = [];

        if (event.groupCode) {
            for (const parsedGroup of parseGroupCode(event.groupCode)) {
                const groupId = groupIdByKey.get(`${parsedGroup.promo}-${parsedGroup.td}-${parsedGroup.tp}`);

                if (groupId !== undefined) {
                    groupIds.push(groupId);
                }
            }
        }

        const sessionResult = await sessionQueries.upsertAde({
            adeUid: event.uid,
            resourceId,
            subject: sessionName,
            startAt: event.startAt,
            endAt: event.endAt,
            teacherMail,
            groupIds,
            existingSessionId: sessionIdByAdeUid.get(event.uid),
        });

        if ("error" in sessionResult) {
            throw new Error("Erreur lors de la création d'une séance.");
        }

        sessionCount++;
        onProgress?.(++current, total);
    }

    return { resourceCount, sessionCount };
}

export async function runIcalSync(
    teacherMail: string,
    onProgress?: ProgressCallback
): Promise<IcalImportResult> {
    const teacher = await teacherQueries.getByEmail(teacherMail);

    if ('error' in teacher || !teacher.entity.icalUrl) {
        throw new Error("Aucune URL iCal enregistrée. Veuillez d'abord importer vos ressources.");
    }

    return runIcalImport(teacher.entity.icalUrl, teacherMail, onProgress);
}
