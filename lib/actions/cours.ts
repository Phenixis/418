"use server";

import { sessionGroupQueries } from "../db/queries/session-group";
import { sessionQueries } from "../db/queries/session";
import { ActionResult } from "./types";
import { fromZonedTime } from "date-fns-tz";
import { resourceQueries } from "../db/queries/resource";
import { resourceTeacherQueries } from "../db/queries/resource-teacher";
import { sessionTeacherQueries } from "../db/queries/session-teacher";
import { revalidatePath } from "next/cache";
import { teacherQueries } from "@/lib/db/queries/teacher";

const PARIS_TIME_ZONE = "Europe/Paris";

function parseFormDataValues(formData: FormData): {
    label: string;
    startDate: Date;
    durationInMinutes: number;
    groupIds: number[];
    teachers: string[];
} | { error: true; message: string } {
    const label = formData.get("label");
    const startDateString = formData.get("start-date");
    const startTimeString = formData.get("start-time");
    const duration = formData.get("duration");
    const groups = formData.getAll("groups");
    const teachers = formData.getAll("teacherEmail");

    if (typeof label !== "string" || typeof startDateString !== "string" || typeof duration !== "string" || groups.some(group => typeof group !== "string") || teachers.some(teacher => typeof teacher !== "string") || teachers.length === 0) {
        return { error: true, message: "Données de formulaire invalides." };
    }

    let startDateAndTime: string | null = null;

    if (startDateString.includes("T")) {
        startDateAndTime = startDateString.slice(0, 16);
    } else if (typeof startTimeString === "string") {
        startDateAndTime = `${startDateString}T${startTimeString}`;
    }

    if (startDateAndTime === null || startDateAndTime.length < 16) {
        return { error: true, message: "La date ou l'heure du cours est invalide." };
    }

    const durationInMinutes = Number.parseInt(duration, 10);

    if (!Number.isInteger(durationInMinutes) || durationInMinutes <= 0) {
        return { error: true, message: "La durée du cours est invalide." };
    }

    const groupIds = [...new Set(
        groups.map((group) => Number.parseInt(group as string, 10))
    )];

    const hasInvalidGroupId = groupIds.some((groupId) => !Number.isInteger(groupId) || groupId <= 0);

    if (hasInvalidGroupId || groupIds.length === 0) {
        return { error: true, message: "Les groupes sélectionnés sont invalides." };
    }

    const startDateDate = fromZonedTime(`${startDateAndTime}:00`, PARIS_TIME_ZONE);

    if (Number.isNaN(startDateDate.getTime())) {
        return { error: true, message: "La date ou l'heure du cours est invalide." };
    }

    return { label, startDate: startDateDate, durationInMinutes, groupIds, teachers: teachers as string[] };
}

export async function creerCours(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const parsedData = parseFormDataValues(formData);

    if ("error" in parsedData) {
        return { error: true, message: parsedData.message };
    }

    const { label, startDate, durationInMinutes, groupIds, teachers } = parsedData;

    const endTimeDate = new Date(startDate.getTime() + (durationInMinutes * 60 * 1000));

    const sessionId = crypto.randomUUID()
    const resourceId = crypto.randomUUID()

    const resourceCreationResult = await resourceQueries.create({
        resourceId,
        subject: label,
    })

    if ("error" in resourceCreationResult) {
        console.error("Error creating resource:", resourceCreationResult.error);
        return { error: true, message: "Erreur lors de la création de la ressource." };
    }

    const sessionCreationResult = await sessionQueries.create({
        sessionId,
        resourceId,
        subject: label,
        startAt: startDate,
        endAt: endTimeDate,
    })

    if ("error" in sessionCreationResult) {
        console.error("Error creating session:", sessionCreationResult.error);
        return { error: true, message: "Erreur lors de la création de la séance." };
    }

    const sessionGroupsCreationResults = await Promise.all(
        groupIds.map((groupId) => sessionGroupQueries.create({
            sessionId,
            groupId,
        }))
    );

    const hasSessionGroupCreationError = sessionGroupsCreationResults.some((creationResult) => "error" in creationResult);

    if (hasSessionGroupCreationError) {
        return { error: true, message: "La séance a été créée, mais la liaison avec les groupes a échoué." };
    }

    const resourceTeachersCreationResults = await Promise.all(
        teachers.map((teacherMail) => resourceTeacherQueries.create({
            resourceId,
            teacherMail,
        }))
    );

    const sessionTeachersCreationResults = await Promise.all(
        teachers.map((teacherMail) => sessionTeacherQueries.create({
            sessionId,
            teacherMail,
        }))
    );

    const hasResourceTeacherCreationError = resourceTeachersCreationResults.some((creationResult) => "error" in creationResult);
    const hasSessionTeacherCreationError = sessionTeachersCreationResults.some((creationResult) => "error" in creationResult);

    if (hasResourceTeacherCreationError || hasSessionTeacherCreationError) {
        return { error: true, message: "La séance a été créée, mais la liaison avec les enseignants a échoué." };
    }

    return {
        success: true,
        course: {
            id: sessionId
        },
    };
}

export async function modifierCours(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const parsedData = parseFormDataValues(formData);

    if ("error" in parsedData) {
        return { error: true, message: parsedData.message };
    }

    const { label, startDate, durationInMinutes, groupIds, teachers } = parsedData;

    const endTimeDate = new Date(startDate.getTime() + (durationInMinutes * 60 * 1000));

    const resourceId = formData.get("resourceId");

    if (typeof resourceId !== "string") {
        return { error: true, message: "ID de cours manquant ou invalide." };
    }

    const result = await sessionQueries.update(resourceId, {
        resourceId,
        subject: label,
        startAt: startDate,
        endAt: endTimeDate,
    })

    if ("error" in result) {
        console.error("Error updating course:", result.error);
        return { error: true, message: "Erreur lors de la modification du cours." };
    }

    const deleteCourseGroupsResult = await sessionGroupQueries.deleteBySessionId(resourceId);

    if ("error" in deleteCourseGroupsResult) {
        return { error: true, message: "Le cours a été modifié, mais la suppression des anciennes liaisons avec les groupes a échoué." };
    }

    const courseGroupsCreationResults = await Promise.all(
        groupIds.map((groupId) => sessionGroupQueries.create({
            sessionId: resourceId,
            groupId,
        }))
    );

    const hasCourseGroupCreationError = courseGroupsCreationResults.some((creationResult) => "error" in creationResult);

    if (hasCourseGroupCreationError) {
        return { error: true, message: "Le cours a été modifié, mais la liaison avec les groupes a échoué." };
    }

    const deleteCourseTeachersResult = await sessionTeacherQueries.deleteBySessionId(resourceId);

    if ("error" in deleteCourseTeachersResult) {
        return { error: true, message: "Le cours a été modifié, mais la suppression des anciennes liaisons avec les enseignants a échoué." };
    }

    const courseTeachersCreationResults = await Promise.all(
        teachers.map((teacherMail) => sessionTeacherQueries.create({
            sessionId: resourceId,
            teacherMail,
        }))
    );

    const hasCourseTeacherCreationError = courseTeachersCreationResults.some((creationResult) => "error" in creationResult);

    if (hasCourseTeacherCreationError) {
        return { error: true, message: "Le cours a été modifié, mais la liaison avec les enseignants a échoué." };
    }
    
    return {
        success: true,
        course: {
            id: resourceId
        },
    };
}

export async function deleteCourse(formData: FormData): Promise<ActionResult> {
    await teacherQueries.getTeacher();

    const resourceId = formData.get("courseId");
    if (typeof resourceId !== "string" || resourceId.trim().length === 0) {
        return { error: true, message: "ID de cours manquant ou invalide." };
    }

    const deletionResult = await sessionQueries.deleteBySessionId(resourceId);
    if ("error" in deletionResult) {
        return { error: true, message: "Erreur lors de la suppression du cours." };
    }

    /*
    La suppression d'une seance utilise un soft delete (mise a jour du champ deletedAt).
    Les relations session_group, session_teacher et attendance ne sont donc pas supprimees automatiquement en cascade
    au niveau de la base de données et doivent être gérées séparément si nécessaire.
    */

    revalidatePath("/professeur/dashboard");

    return {
        success: true,
        course: {
            id: resourceId
        },
    }
}
