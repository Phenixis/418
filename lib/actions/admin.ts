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

export async function validateTeacherAccount(formData: FormData): Promise<void> {
	await teacherQueries.getAdmin();

	const teacherEmail = parseTeacherEmail(formData);

	if (teacherEmail === null) {
		return;
	}

	const validationResult = await teacherQueries.validateTeacherByEmail(teacherEmail);

	if ("error" in validationResult) {
		return;
	}

	revalidatePath("/administrateur/gestion-comptes");
}

export async function refuseTeacherAccount(formData: FormData): Promise<void> {
	await teacherQueries.getAdmin();

	const teacherEmail = parseTeacherEmail(formData);

	if (teacherEmail === null) {
		return;
	}

	const refusalResult = await teacherQueries.refuseTeacherByEmail(teacherEmail);

	if ("error" in refusalResult) {
		return;
	}

	revalidatePath("/administrateur/gestion-comptes");
}

export async function deleteTeacherAccount(formData: FormData): Promise<void> {
	await teacherQueries.getAdmin();

	const teacherEmail = parseTeacherEmail(formData);

	if (teacherEmail === null) {
		return;
	}

	const deletionResult = await teacherQueries.refuseTeacherByEmail(teacherEmail);

	if ("error" in deletionResult) {
		return;
	}

	revalidatePath("/administrateur/gestion-comptes");
}
