"use server";

import { revalidatePath } from "next/cache";
import { resourceQueries } from "@/lib/db/queries/resource";
import { resourceTeacherQueries } from "@/lib/db/queries/resource-teacher";
import { sessionQueries } from "@/lib/db/queries/session";
import { teacherQueries } from "@/lib/db/queries/teacher";
import { ActionResult } from "./types";

function parseResourceFormData(formData: FormData): {
    label: string;
    teacherEmail: string;
} | { error: true; message: string } {
    const labelValue = formData.get("label");
    const teacherEmailValue = formData.get("teacherEmail");

    if (typeof labelValue !== "string" || typeof teacherEmailValue !== "string") {
        return { error: true, message: "Données de formulaire invalides." };
    }

    const label = labelValue.trim();
    const teacherEmail = teacherEmailValue.trim();

    if (label.length === 0 || label.length > 50) {
        return { error: true, message: "Le nom de la ressource est invalide." };
    }

    if (teacherEmail.length === 0) {
        return { error: true, message: "Enseignant invalide." };
    }

    return { label, teacherEmail };
}

/**
 * Creates a new resource (course module) and links it to a teacher.
 *
 * Requires an active teacher session. Revalidates the dashboard cache.
 *
 * @param prevState - Previous {@link ActionResult} required by `useActionState`.
 * @param formData - Must include `label` (1–50 chars) and `teacherEmail`.
 * @returns `{ success: true, resource: { id: string } }` on success, or an error result.
 */
export async function createResource(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    await teacherQueries.getTeacher();

    const parsedData = parseResourceFormData(formData);

    if ("error" in parsedData) {
        return parsedData;
    }

    const resourceId = crypto.randomUUID();

    const createResourceResult = await resourceQueries.create({
        resourceId,
        subject: parsedData.label,
    });

    if ("error" in createResourceResult) {
        return { error: true, message: "Erreur lors de la création de la ressource." };
    }

    const createResourceTeacherResult = await resourceTeacherQueries.create({
        resourceId,
        teacherMail: parsedData.teacherEmail,
    });

    if ("error" in createResourceTeacherResult) {
        return { error: true, message: "Ressource créée, mais liaison enseignant échouée." };
    }

    revalidatePath("/professeur/dashboard");

    return {
        success: true,
        resource: {
            id: resourceId,
        },
    };
}

/**
 * Updates the label of an existing resource.
 *
 * Requires an active teacher session. Revalidates the dashboard cache.
 *
 * @param prevState - Previous {@link ActionResult} required by `useActionState`.
 * @param formData - Must include `resourceId`, `label` (1–50 chars), and `teacherEmail`.
 * @returns `{ success: true, resource: { id: string } }` on success, or an error result.
 */
export async function updateResource(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    await teacherQueries.getTeacher();

    const parsedData = parseResourceFormData(formData);

    if ("error" in parsedData) {
        return parsedData;
    }

    const resourceIdValue = formData.get("resourceId");

    if (typeof resourceIdValue !== "string" || resourceIdValue.trim().length === 0) {
        return { error: true, message: "ID de ressource manquant ou invalide." };
    }

    const resourceId = resourceIdValue.trim();

    const updateResourceResult = await resourceQueries.update(resourceId, {
        subject: parsedData.label,
    });

    if ("error" in updateResourceResult) {
        return { error: true, message: "Erreur lors de la modification de la ressource." };
    }

    revalidatePath("/professeur/dashboard");

    return {
        success: true,
        resource: {
            id: resourceId,
        },
    };
}

/**
 * Soft-deletes a resource and all its associated sessions.
 *
 * Fetches the resource's sessions, soft-deletes each one, then soft-deletes the
 * resource itself. Requires an active teacher session. Revalidates the dashboard cache.
 *
 * @param prevState - Previous {@link ActionResult} required by `useActionState`.
 * @param formData - Must include `resourceId`.
 * @returns `{ success: true }` on success, or an error result.
 */
export async function deleteResource(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    await teacherQueries.getTeacher();

    const resourceId = formData.get("resourceId");

    if (typeof resourceId !== "string" || resourceId.trim().length === 0) {
        return { error: true, message: "ID de ressource manquant ou invalide." };
    }

    const trimmedResourceId = resourceId.trim();

    const sessionsResult = await sessionQueries.getByResourceId(trimmedResourceId);
    const sessions = 'error' in sessionsResult ? [] : sessionsResult.entity;

    await Promise.all(sessions.map((session) => sessionQueries.deleteBySessionId(session.sessionId)));

    const deletionResult = await resourceQueries.deleteByResourceId(trimmedResourceId);

    if ('error' in deletionResult) {
        return { error: true, message: "Erreur lors de la suppression de la ressource." };
    }

    revalidatePath("/professeur/dashboard");

    return { success: true };
}