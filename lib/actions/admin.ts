"use server";

import { revalidatePath } from "next/cache";
import { teacherQueries } from "@/lib/db/queries/teacher";

function parseTeacherEmail(formData: FormData): string | null {
	const rawTeacherEmail = formData.get("teacherEmail");

	if (typeof rawTeacherEmail !== "string") {
		return null;
	}

	const teacherEmail = rawTeacherEmail.trim();

	if (teacherEmail.length === 0) {
		return null;
	}

	return teacherEmail;
}

export async function validateTeacherAccount(formData: FormData): Promise<{ success: true } | { error: true; message: string }> {
	await teacherQueries.getAdmin();

	const teacherEmail = parseTeacherEmail(formData);

	if (teacherEmail === null) {
		return { error: true, message: "Adresse email invalide." };
	}

	const validationResult = await teacherQueries.validateTeacherByEmail(teacherEmail);

	if ("error" in validationResult) {
		return { error: true, message: "Impossible de valider le compte." };
	}

	revalidatePath("/administrateur/gestion-professeurs");
	return { success: true };
}

export async function refuseTeacherAccount(formData: FormData): Promise<{ success: true } | { error: true; message: string }> {
	await teacherQueries.getAdmin();

	const teacherEmail = parseTeacherEmail(formData);

	if (teacherEmail === null) {
		return { error: true, message: "Adresse email invalide." };
	}

	const refusalResult = await teacherQueries.refuseTeacherByEmail(teacherEmail);

	if ("error" in refusalResult) {
		return { error: true, message: "Impossible de refuser le compte." };
	}

	revalidatePath("/administrateur/gestion-comptes");
	return { success: true };
	revalidatePath("/administrateur/gestion-professeurs");
}

export async function deleteTeacherAccount(formData: FormData): Promise<{ success: true } | { error: true; message: string }> {
	await teacherQueries.getAdmin();

	const teacherEmail = parseTeacherEmail(formData);

	if (teacherEmail === null) {
		return { error: true, message: "Adresse email invalide." };
	}

	const deletionResult = await teacherQueries.refuseTeacherByEmail(teacherEmail);

	if ("error" in deletionResult) {
		return { error: true, message: "Impossible de supprimer le compte." };
	}

	revalidatePath("/administrateur/gestion-comptes");
	return { success: true };
	revalidatePath("/administrateur/gestion-professeurs");
}
