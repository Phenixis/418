"use server";

import bcrypt from "bcrypt";
import { teacherQueries } from "../db/queries/teacher";
import { ActionResult } from "./types";

export async function login(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {

    const email = formData.get("email");
    const password = formData.get("password");

    if (typeof email !== "string" || typeof password !== "string") {
        return {
            error: true,
            message: "Veuillez fournir un email et un mot de passe valides.",
        };
    }

    const completeEmail = email + "@univ-rennes.fr";

    const teacherResult = await teacherQueries.getByEmail(completeEmail);

    if ("error" in teacherResult) {
        return {
            error: true,
            message: "Email ou mot de passe incorrect.",
        };
    }

    const isPasswordValid = await bcrypt.compare(password, teacherResult.entity.password);

    if (!isPasswordValid) {
        return {
            error: true,
            message: "Email ou mot de passe incorrect.",
        };
    }

    return {
        success: true,
        redirectTo: "/professeur/dashboard",
    };
}

export async function register(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const firstName = formData.get("first-name");
    const lastName = formData.get("last-name");
    const email = formData.get("email");
    const password = formData.get("password");

    if (
        typeof firstName !== "string" ||
        typeof lastName !== "string" ||
        typeof email !== "string" ||
        typeof password !== "string"
    ) {
        return {
            error: true,
            message: "Veuillez remplir correctement tous les champs.",
        };
    }

    const completeEmail = email + "@univ-rennes.fr";

    const existingTeacher = await teacherQueries.getByEmail(completeEmail);

    if ("success" in existingTeacher) {
        return {
            error: true,
            message: "Un compte existe deja avec cet email.",
        };
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const creationResult = await teacherQueries.create({
        firstName,
        lastName,
        userMail: completeEmail,
        password: hashedPassword,
        isTeacher: true,
    });

    if ("error" in creationResult) {
        return {
            error: true,
            message: "Une erreur est survenue lors de l'inscription.",
        };
    }

    return {
        success: true,
        redirectTo: "/professeur/dashboard?onboarding=true",
    };

}