"use server";

import { revalidatePath } from "next/cache";
import { groupQueries } from "@/lib/db/queries/group";
import { resourceQueries } from "@/lib/db/queries/resource";
import { sessionQueries } from "@/lib/db/queries/session";
import { teacherQueries } from "@/lib/db/queries/teacher";
import { mapSummaryToCourse, parseGroupCode } from "@/lib/utils/ical-course-mapping";
import { fetchAndParseIcalFeed } from "@/lib/utils/ical-parser";
import { ActionResult } from "./types";

async function runIcalImport(
    icalUrl: string,
    teacherMail: string
): Promise<ActionResult> {
    let events;

    try {
        events = await fetchAndParseIcalFeed(icalUrl);
    } catch (error) {
        return {
            error: true,
            message: error instanceof Error ? error.message : "Erreur lors de la lecture du flux iCal.",
        };
    }

    let resourceCount = 0;
    let sessionCount = 0;

    const resourceIdByCourseName = new Map<string, string>();

    for (const event of events) {
        const mapping = mapSummaryToCourse(event.summary);

        if (!mapping) {
            continue;
        }

        const { courseName, sessionName } = mapping;
        let resourceId: string;

        if (resourceIdByCourseName.has(courseName)) {
            resourceId = resourceIdByCourseName.get(courseName)!;
        } else {
            const resourceResult = await resourceQueries.upsertAde(courseName, teacherMail);

            if ("error" in resourceResult) {
                return { error: true, message: "Erreur lors de la création d'une ressource." };
            }

            resourceId = resourceResult.entity.resourceId;
            resourceIdByCourseName.set(courseName, resourceId);
            resourceCount++;
        }

        const groupIds: number[] = [];

        if (event.groupCode) {
            const parsedGroups = parseGroupCode(event.groupCode);

            for (const parsedGroup of parsedGroups) {
                const groupResult = await groupQueries.getByPromoTdTp(
                    parsedGroup.promo,
                    parsedGroup.td,
                    parsedGroup.tp
                );

                if ('entity' in groupResult) {
                    groupIds.push(groupResult.entity.groupId);
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
        });

        if ("error" in sessionResult) {
            return { error: true, message: "Erreur lors de la création d'une séance." };
        }

        sessionCount++;
    }

    revalidatePath("/professeur/dashboard");

    return { success: true, resourceCount, sessionCount };
}

export async function importFromIcal(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const teacher = await teacherQueries.getTeacher();

    const icalUrlValue = formData.get("icalUrl");

    if (typeof icalUrlValue !== "string" || icalUrlValue.trim().length === 0) {
        return { error: true, message: "L'URL iCal est invalide." };
    }

    const icalUrl = icalUrlValue.trim();

    const result = await runIcalImport(icalUrl, teacher.userMail);

    if ("error" in result) {
        return result;
    }

    const saveResult = await teacherQueries.saveIcalUrl(teacher.userMail, icalUrl);

    if ("error" in saveResult) {
        return { error: true, message: "Import réussi, mais l'URL n'a pas pu être enregistrée." };
    }

    return result;
}

export async function syncFromIcal(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const teacher = await teacherQueries.getTeacher();

    if (!teacher.icalUrl) {
        return { error: true, message: "Aucune URL iCal enregistrée. Veuillez d'abord importer vos ressources." };
    }

    return runIcalImport(teacher.icalUrl, teacher.userMail);
}
