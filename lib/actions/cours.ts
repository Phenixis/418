"use server";

import { courseGroupQueries } from "../db/queries/course-group";
import { courseQueries } from "../db/queries/course";
import { ActionResult } from "./types";
import { fromZonedTime } from "date-fns-tz";
import { courseTeacherQueries } from "../db/queries/course-teacher";

const PARIS_TIME_ZONE = "Europe/Paris";

export async function creerCours(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const label = formData.get("label");
    const startDateString = formData.get("start-date");
    const startTimeString = formData.get("start-time");
    const duration = formData.get("duration");
    const groups = formData.getAll("groups");
    const teachers = formData.getAll("teacherId");

    if (typeof label !== "string" || typeof startDateString !== "string" || typeof startTimeString !== "string" || typeof duration !== "string" || groups.some(group => typeof group !== "string")) {
        return { error: true, message: "Données de formulaire invalides." };
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

    const startDateDate = fromZonedTime(`${startDateString}T${startTimeString}:00`, PARIS_TIME_ZONE);

    if (Number.isNaN(startDateDate.getTime())) {
        return { error: true, message: "La date ou l'heure du cours est invalide." };
    }

    const endTimeDate = new Date(startDateDate.getTime() + (durationInMinutes * 60 * 1000));

    const uuid = crypto.randomUUID()

    const result = await courseQueries.create({
        courseId: uuid,
        subject: label,
        startAt: startDateDate,
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
            teacherMail: teacherMail as string,
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