"use server";

import { revalidatePath } from "next/cache";
import { annotationQueries } from "@/lib/db/queries/annotation";
import { teacherQueries } from "@/lib/db/queries/teacher";
import { ActionResult } from "./types";

export async function upsertAnnotation(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const teacher = await teacherQueries.getTeacher();

    const contentValue = formData.get("content");
    const studentEmailValue = formData.get("studentEmail");
    const annotationIdValue = formData.get("annotationId");

    if (typeof contentValue !== "string" || typeof studentEmailValue !== "string") {
        return { error: true, message: "Données de formulaire invalides." };
    }

    const content = contentValue.trim();
    const studentEmail = studentEmailValue.trim();

    if (content.length === 0) {
        return { error: true, message: "Le contenu de l'annotation ne peut pas être vide." };
    }

    if (studentEmail.length === 0) {
        return { error: true, message: "Étudiant invalide." };
    }

    const annotationId = annotationIdValue ? parseInt(annotationIdValue as string, 10) : null;

    if (annotationId !== null && !isNaN(annotationId)) {
        const updateResult = await annotationQueries.updateById(annotationId, content);

        if ("error" in updateResult) {
            return { error: true, message: "Erreur lors de la modification de l'annotation." };
        }
    } else {
        const createResult = await annotationQueries.create({
            teacherEmail: teacher.userMail,
            studentEmail,
            content,
        });

        if ("error" in createResult) {
            return { error: true, message: "Erreur lors de la création de l'annotation." };
        }
    }

    revalidatePath("/professeur/etudiant");

    return { success: true };
}

export async function clearAnnotation(prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    await teacherQueries.getTeacher();

    const annotationIdValue = formData.get("annotationId");
    const annotationId = annotationIdValue ? parseInt(annotationIdValue as string, 10) : NaN;

    if (isNaN(annotationId)) {
        return { error: true, message: "ID d'annotation invalide." };
    }

    const result = await annotationQueries.updateById(annotationId, "");

    if ("error" in result) {
        return { error: true, message: "Erreur lors de la suppression du contenu." };
    }

    revalidatePath("/professeur/etudiant");

    return { success: true };
}
