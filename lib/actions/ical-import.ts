"use server";

import { revalidatePath } from "next/cache";
import { teacherQueries } from "@/lib/db/queries/teacher";
import { runIcalImport } from "@/lib/ical/runner";
import { ActionResult } from "./types";

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
