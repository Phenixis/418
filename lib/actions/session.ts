"use server";

import { fromZonedTime } from "date-fns-tz";
import { revalidatePath } from "next/cache";
import { sessionGroupQueries } from "@/lib/db/queries/session-group";
import { sessionQueries } from "@/lib/db/queries/session";
import { sessionTagQueries } from "@/lib/db/queries/session-tag";
import { sessionTeacherQueries } from "@/lib/db/queries/session-teacher";
import { teacherQueries } from "@/lib/db/queries/teacher";
import { ActionResult } from "./types";

const PARIS_TIME_ZONE = "Europe/Paris";

function parseSessionFormData(formData: FormData): {
    label: string;
    resourceId: string;
    startDate: Date;
    durationInMinutes: number;
    groupIds: number[];
    tagIds: number[];
    teacherMails: string[];
} | { error: true; message: string } {
    const labelValue = formData.get("label");
    const resourceIdValue = formData.get("resourceId");
    const startDateValue = formData.get("start-date");
    const startTimeValue = formData.get("start-time");
    const durationValue = formData.get("duration");
    const groupsValues = formData.getAll("groups");
    const tagsValues = formData.getAll("tags");
    const teacherMailsValues = formData.getAll("teacherEmail");

    if (
        typeof labelValue !== "string" ||
        typeof resourceIdValue !== "string" ||
        typeof startDateValue !== "string" ||
        typeof durationValue !== "string" ||
        groupsValues.some((groupValue) => typeof groupValue !== "string") ||
        teacherMailsValues.some((teacherMailValue) => typeof teacherMailValue !== "string") ||
        teacherMailsValues.length === 0
    ) {
        return { error: true, message: "Données de formulaire invalides." };
    }

    const label = labelValue.trim();
    const resourceId = resourceIdValue.trim();

    if (label.length === 0 || label.length > 50) {
        return { error: true, message: "Le nom de la séance est invalide." };
    }

    if (resourceId.length === 0) {
        return { error: true, message: "Ressource invalide." };
    }

    let startDateAndTime: string | null = null;

    if (startDateValue.includes("T")) {
        startDateAndTime = startDateValue.slice(0, 16);
    } else if (typeof startTimeValue === "string") {
        startDateAndTime = `${startDateValue}T${startTimeValue}`;
    }

    if (startDateAndTime === null || startDateAndTime.length < 16) {
        return { error: true, message: "La date ou l'heure de la séance est invalide." };
    }

    const durationInMinutes = Number.parseInt(durationValue, 10);

    if (!Number.isInteger(durationInMinutes) || durationInMinutes <= 0) {
        return { error: true, message: "La durée de la séance est invalide." };
    }

    const groupIds = [
        ...new Set(groupsValues.map((groupValue) => Number.parseInt(groupValue as string, 10))),
    ];

    if (groupIds.some((groupId) => !Number.isInteger(groupId) || groupId <= 0)) {
        return { error: true, message: "Les groupes sélectionnés sont invalides." };
    }

    const tagIds = tagsValues.length > 0
        ? [...new Set(tagsValues.map((tagValue) => Number.parseInt(tagValue as string, 10)))]
        : [];

    if (tagIds.some((tagId) => !Number.isInteger(tagId) || tagId <= 0)) {
        return { error: true, message: "Les tags sélectionnés sont invalides." };
    }

    if (groupIds.length === 0 && tagIds.length === 0) {
        return { error: true, message: "Veuillez sélectionner au moins un groupe ou un tag." };
    }

    const startDate = fromZonedTime(`${startDateAndTime}:00`, PARIS_TIME_ZONE);

    if (Number.isNaN(startDate.getTime())) {
        return { error: true, message: "La date ou l'heure de la séance est invalide." };
    }

    const teacherMails = teacherMailsValues.map((teacherMailValue) => (teacherMailValue as string).trim());

    if (teacherMails.some((teacherMail) => teacherMail.length === 0)) {
        return { error: true, message: "Enseignant invalide." };
    }

    return {
        label,
        resourceId,
        startDate,
        durationInMinutes,
        groupIds,
        tagIds,
        teacherMails,
    };
}

/**
 * Creates a new session under an existing resource.
 *
 * Links the session to the supplied groups, teachers, and tags (optional).
 * Paris timezone is applied when parsing the start time. Revalidates the
 * resource page and dashboard caches.
 *
 * @param prevState - Previous {@link ActionResult} required by `useActionState`.
 * @param formData - Must include `label`, `resourceId`, `start-date`, `start-time`,
 *   `duration`, one or more `groups`, and one or more `teacherEmail` values.
 *   Optionally includes one or more `tags`.
 * @returns `{ success: true, session: { id: string } }` on success, or an error result.
 */
export async function createSession(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    await teacherQueries.getTeacher();

    const parsedData = parseSessionFormData(formData);

    if ("error" in parsedData) {
        return parsedData;
    }

    const sessionId = crypto.randomUUID();
    const endDate = new Date(parsedData.startDate.getTime() + parsedData.durationInMinutes * 60 * 1000);

    const sessionCreationResult = await sessionQueries.create({
        sessionId,
        resourceId: parsedData.resourceId,
        subject: parsedData.label,
        startAt: parsedData.startDate,
        endAt: endDate,
    });

    if ("error" in sessionCreationResult) {
        return { error: true, message: "Erreur lors de la création de la séance." };
    }

    const sessionGroupsResults = await Promise.all(
        parsedData.groupIds.map((groupId) =>
            sessionGroupQueries.create({
                sessionId,
                groupId,
            })
        )
    );

    if (sessionGroupsResults.some((sessionGroupsResult) => "error" in sessionGroupsResult)) {
        return { error: true, message: "La séance a été créée, mais la liaison avec les groupes a échoué." };
    }

    const sessionTeachersResults = await Promise.all(
        parsedData.teacherMails.map((teacherMail) =>
            sessionTeacherQueries.create({
                sessionId,
                teacherMail,
            })
        )
    );

    if (sessionTeachersResults.some((sessionTeachersResult) => "error" in sessionTeachersResult)) {
        return { error: true, message: "La séance a été créée, mais la liaison avec les enseignants a échoué." };
    }

    if (parsedData.tagIds.length > 0) {
        await Promise.all(
            parsedData.tagIds.map((tagId) =>
                sessionTagQueries.create({ sessionId, tagId })
            )
        );
    }

    revalidatePath(`/professeur/resource/${parsedData.resourceId}`);
    revalidatePath("/professeur/dashboard");

    return {
        success: true,
        session: {
            id: sessionId,
        },
    };
}

/**
 * Updates an existing session's schedule, groups, teachers, and tags.
 *
 * Replaces group, teacher, and tag associations via delete-then-recreate.
 * Revalidates the resource page and dashboard caches.
 *
 * @param prevState - Previous {@link ActionResult} required by `useActionState`.
 * @param formData - Same fields as {@link createSession} plus `sessionId`.
 * @returns `{ success: true, session: { id: string } }` on success, or an error result.
 */
export async function updateSession(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    await teacherQueries.getTeacher();

    const parsedData = parseSessionFormData(formData);

    if ("error" in parsedData) {
        return parsedData;
    }

    const sessionIdValue = formData.get("sessionId");

    if (typeof sessionIdValue !== "string" || sessionIdValue.trim().length === 0) {
        return { error: true, message: "ID de séance manquant ou invalide." };
    }

    const sessionId = sessionIdValue.trim();
    const endDate = new Date(parsedData.startDate.getTime() + parsedData.durationInMinutes * 60 * 1000);

    const updateSessionResult = await sessionQueries.update(sessionId, {
        sessionId,
        resourceId: parsedData.resourceId,
        subject: parsedData.label,
        startAt: parsedData.startDate,
        endAt: endDate,
    });

    if ("error" in updateSessionResult) {
        return { error: true, message: "Erreur lors de la modification de la séance." };
    }

    const deleteGroupsResult = await sessionGroupQueries.deleteBySessionId(sessionId);

    if ("error" in deleteGroupsResult) {
        return { error: true, message: "La séance a été modifiée, mais la suppression des anciens groupes a échoué." };
    }

    const createGroupsResults = await Promise.all(
        parsedData.groupIds.map((groupId) =>
            sessionGroupQueries.create({
                sessionId,
                groupId,
            })
        )
    );

    if (createGroupsResults.some((createGroupsResult) => "error" in createGroupsResult)) {
        return { error: true, message: "La séance a été modifiée, mais la liaison avec les groupes a échoué." };
    }

    const deleteTeachersResult = await sessionTeacherQueries.deleteBySessionId(sessionId);

    if ("error" in deleteTeachersResult) {
        return { error: true, message: "La séance a été modifiée, mais la suppression des anciens enseignants a échoué." };
    }

    const createTeachersResults = await Promise.all(
        parsedData.teacherMails.map((teacherMail) =>
            sessionTeacherQueries.create({
                sessionId,
                teacherMail,
            })
        )
    );

    if (createTeachersResults.some((createTeachersResult) => "error" in createTeachersResult)) {
        return { error: true, message: "La séance a été modifiée, mais la liaison avec les enseignants a échoué." };
    }

    await sessionTagQueries.deleteBySessionId(sessionId);

    if (parsedData.tagIds.length > 0) {
        await Promise.all(
            parsedData.tagIds.map((tagId) =>
                sessionTagQueries.create({ sessionId, tagId })
            )
        );
    }

    revalidatePath(`/professeur/resource/${parsedData.resourceId}`);
    revalidatePath("/professeur/dashboard");

    return {
        success: true,
        session: {
            id: sessionId,
        },
    };
}