"use server";

import { revalidatePath } from "next/cache";
import { teacherQueries } from "@/lib/db/queries/teacher";
import { runIcalImport } from "@/lib/ical/runner";
import { ActionResult } from "./types";

/**
 * Imports resources and sessions from an iCal feed URL provided by the teacher.
 *
 * Validates the URL, runs the import via {@link runIcalImport}, and persists the
 * URL in the teacher record for future syncs. Revalidates the dashboard cache.
 *
 * @param prevState - Previous {@link ActionResult} required by `useActionState`.
 * @param formData - Must include `icalUrl`.
 * @returns `{ success: true, resourceCount, sessionCount }` on success, or an error result.
 */
export async function importFromIcal(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const teacher = await teacherQueries.getTeacher();

    const icalUrlValue = formData.get("icalUrl");

    if (typeof icalUrlValue !== "string" || icalUrlValue.trim().length === 0) {
        return { error: true, message: "L'URL iCal est invalide." };
    }

    const icalUrl = icalUrlValue.trim();

    try {
        const result = await runIcalImport(icalUrl, teacher.userMail);

        const saveResult = await teacherQueries.saveIcalUrl(teacher.userMail, icalUrl);

        if ("error" in saveResult) {
            return { error: true, message: "Import réussi, mais l'URL n'a pas pu être enregistrée." };
        }

        revalidatePath("/professeur/dashboard");
        return { success: true, ...result };
    } catch (error) {
        return { error: true, message: error instanceof Error ? error.message : "Erreur lors de l'import." };
    }
}

/**
 * Re-synchronises from the iCal URL previously saved for the authenticated teacher.
 *
 * Reads the stored URL from the teacher record and re-runs the import. Returns
 * an error if no URL has been saved yet. Revalidates the dashboard cache.
 *
 * @param prevState - Previous {@link ActionResult} required by `useActionState`.
 * @param formData - Not used; present to conform to the server action signature.
 * @returns `{ success: true, resourceCount, sessionCount }` on success, or an error result.
 */
export async function syncFromIcal(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const teacher = await teacherQueries.getTeacher();

    if (!teacher.icalUrl) {
        return { error: true, message: "Aucune URL iCal enregistrée. Veuillez d'abord importer vos ressources." };
    }

    try {
        const result = await runIcalImport(teacher.icalUrl, teacher.userMail);
        revalidatePath("/professeur/dashboard");
        return { success: true, ...result };
    } catch (error) {
        return { error: true, message: error instanceof Error ? error.message : "Erreur lors de la synchronisation." };
    }
}
