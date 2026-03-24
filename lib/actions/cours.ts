"use server";

import { courseGroupQueries } from "../db/queries/course-group";
import { courseQueries } from "../db/queries/course";
import { ActionResult } from "./types";

export async function creerCours(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const label = formData.get("label");
    const startDateString = formData.get("start-date");
    const startTimeString = formData.get("start-time");
    const duration = formData.get("duration");
    const groups = formData.getAll("groups");

    if (typeof label !== "string" || typeof startDateString !== "string" || typeof startTimeString !== "string" || typeof duration !== "string" || groups.some(group => typeof group !== "string")) {
        return { error: true, message: "Données de formulaire invalides." };
    }

    const groupIds = [...new Set(
        groups.map((group) => Number.parseInt(group as string, 10))
    )];

    const hasInvalidGroupId = groupIds.some((groupId) => !Number.isInteger(groupId) || groupId <= 0);

    if (hasInvalidGroupId || groupIds.length === 0) {
        return { error: true, message: "Les groupes sélectionnés sont invalides." };
    }

    const startDateDate = new Date(`${startDateString}T${startTimeString}:00`);
    const endTimeDate = new Date(startDateDate.getTime() + (Number.parseInt(duration) * 60 * 1000));

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

    return {
        success: true,
        course: {
            id: uuid
        },
    };
}