"use server";

import { courseGroupQueries } from "../db/queries/course-group";
import { courseQueries } from "../db/queries/course";
import { ActionResult } from "./types";
import { fromZonedTime } from "date-fns-tz";
import { courseTeacherQueries } from "../db/queries/course-teacher";
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

    const uuid = crypto.randomUUID()

    const result = await courseQueries.create({
        courseId: uuid,
        subject: label,
        startAt: startDate,
        endAt: endTimeDate,
    })

    if ("error" in result) {
        console.error("Error creating course:", result.error);
        return { error: true, message: "Erreur lors de la création du cours." };
    }

    const courseGroupsCreationResults = await Promise.all(
        groupIds.map((groupId) => courseGroupQueries.create({
            courseId: uuid,
            groupId,
        }))
    );

    const hasCourseGroupCreationError = courseGroupsCreationResults.some((creationResult) => "error" in creationResult);

    if (hasCourseGroupCreationError) {
        return { error: true, message: "Le cours a été créé, mais la liaison avec les groupes a échoué." };
    }

    const courseTeachersCreationResults = await Promise.all(
        teachers.map((teacherMail) => courseTeacherQueries.create({
            courseId: uuid,
            teacherMail: teacherMail ,
        }))
    );

    const hasCourseTeacherCreationError = courseTeachersCreationResults.some((creationResult) => "error" in creationResult);

    if (hasCourseTeacherCreationError) {
        return { error: true, message: "Le cours a été créé, mais la liaison avec les enseignants a échoué." };
    }

    return {
        success: true,
        course: {
            id: uuid
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

    const courseId = formData.get("courseId");

    if (typeof courseId !== "string") {
        return { error: true, message: "ID de cours manquant ou invalide." };
    }

    const result = await courseQueries.update(courseId, {
        courseId,
        subject: label,
        startAt: startDate,
        endAt: endTimeDate,
    })

    if ("error" in result) {
        console.error("Error updating course:", result.error);
        return { error: true, message: "Erreur lors de la modification du cours." };
    }

    const deleteCourseGroupsResult = await courseGroupQueries.deleteByCourseId(courseId);

    if ("error" in deleteCourseGroupsResult) {
        return { error: true, message: "Le cours a été modifié, mais la suppression des anciennes liaisons avec les groupes a échoué." };
    }

    const courseGroupsCreationResults = await Promise.all(
        groupIds.map((groupId) => courseGroupQueries.create({
            courseId,
            groupId,
        }))
    );

    const hasCourseGroupCreationError = courseGroupsCreationResults.some((creationResult) => "error" in creationResult);

    if (hasCourseGroupCreationError) {
        return { error: true, message: "Le cours a été modifié, mais la liaison avec les groupes a échoué." };
    }

    const deleteCourseTeachersResult = await courseTeacherQueries.deleteByCourseId(courseId);

    if ("error" in deleteCourseTeachersResult) {
        return { error: true, message: "Le cours a été modifié, mais la suppression des anciennes liaisons avec les enseignants a échoué." };
    }

    const courseTeachersCreationResults = await Promise.all(
        teachers.map((teacherMail) => courseTeacherQueries.create({
            courseId,
            teacherMail: teacherMail ,
        }))
    );

    const hasCourseTeacherCreationError = courseTeachersCreationResults.some((creationResult) => "error" in creationResult);

    if (hasCourseTeacherCreationError) {
        return { error: true, message: "Le cours a été modifié, mais la liaison avec les enseignants a échoué." };
    }
    
    return {
        success: true,
        course: {
            id: courseId
        },
    };
}

export async function demarrerAppel(courseId: string): Promise<ActionResult> {
    await teacherQueries.getTeacher();

    const courseResult = await courseQueries.getByStringId(courseId);
    if ('error' in courseResult) {
        return { error: true, message: "Cours introuvable." };
    }

    const cours = courseResult.entity;
    const now = new Date();
    const courseDurationMs = cours.endAt.getTime() - cours.startAt.getTime();
    const calledEndAt = new Date(now.getTime() + courseDurationMs);

    const result = await courseQueries.update(courseId, {
        calledStartAt: now,
        calledEndAt,
    });

    if ('error' in result) {
        return { error: true, message: "Erreur lors du démarrage de l'appel." };
    }

    revalidatePath(`/professeur/cours/${courseId}`);
    return { success: true };
}

export async function terminerAppel(courseId: string): Promise<ActionResult> {
    await teacherQueries.getTeacher();

    const result = await courseQueries.update(courseId, {
        calledEndAt: new Date(),
    });

    if ('error' in result) {
        return { error: true, message: "Erreur lors de la clôture de l'appel." };
    }

    revalidatePath(`/professeur/cours/${courseId}`);
    return { success: true };
}

export async function deleteCourse(formData: FormData): Promise<void> {
    await teacherQueries.getTeacher();

    const courseId = formData.get("courseId");
    if (typeof courseId !== "string" || courseId.trim().length === 0) {
        return;
    }

    const deletionResult = await courseQueries.deleteByCourseId(courseId);
    if ("error" in deletionResult) {
        return;
    }

    /*
    La suppression d'un cours utilise un soft delete (mise à jour du champ deletedAt).
    Les relations course_group, course_teacher et attendance ne sont donc pas supprimées automatiquement en cascade
    au niveau de la base de données et doivent être gérées séparément si nécessaire.
    */

    revalidatePath("/professeur/dashboard");
}
