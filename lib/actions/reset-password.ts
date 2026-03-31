"use server";

import bcrypt from "bcrypt";
import { sendEmail } from "./email";
import type { Select as ResetPasswordSession } from "@/lib/db/schema/reset-password-session";
import type { Select as Teacher } from "@/lib/db/schema/teacher";
import type { Select as Student } from "@/lib/db/schema/student";
import { resetPasswordSessionQueries } from "@/lib/db/queries/reset-password-session";
import { QueryResult } from "../db/queries/model";
import { ActionResult } from "./types";
import { teacherQueries } from "../db/queries/teacher";
import { studentQueries } from "../db/queries/student";

export async function createResetPasswordSession(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const target = formData.get("target");
    const email = formData.get("email");

    if (typeof target !== "string" || typeof email !== "string") {
        return {
            error: true,
            message: "Données de formulaire invalides.",
        };
    }

    const completeEmail = email + (target === "student" ? "@etudiant.univ-rennes.fr" : "@univ-rennes.fr");

    let user: Teacher | Student | null = null;

    if (target === "teacher") {
        const teacherResult = await teacherQueries.getByEmail(completeEmail);

        if ("error" in teacherResult) {
            return {
                success: true,
                message: "Si un compte avec cet email existe, vous recevrez un email de réinitialisation.",
            };
        }

        user = teacherResult.entity;
    } else if (target === "student") {
        const studentResult = await studentQueries.getByEmail(completeEmail);

        if ("error" in studentResult) {
            return {
                success: true,
                message: "Si un compte avec cet email existe, vous recevrez un email de réinitialisation.",
            };
        }

        user = studentResult.entity;
    } else {
        return {
            error: true,
            message: "Veuillez fournir un email valide.",
        };
    }

    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 3600 * 1000); // Expire in 1 hour

    const sessionData: ResetPasswordSession = {
        id,
        userMailStudent: user.isTeacher ? null : user.userMail,
        userMailTeacher: user.isTeacher ? user.userMail : null,
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
    };

    const result = await resetPasswordSessionQueries.create(sessionData);

    if ("error" in result) {
        console.error("Erreur lors de la création de la session de réinitialisation :", result.error);
        return {
            error: true,
            message: "Une erreur interne est survenue. Veuillez réessayer plus tard.",
        };
    }

    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?session_id=${sessionData.id}`;

    const emailContent = `<p>Bonjour ${user.firstName},</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le lien ci-dessous pour procéder :</p>
    <a href="${resetLink}">Réinitialiser mon mot de passe</a>
    <p>Ce lien expirera dans 1 heure.</p>
    <p>Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet e-mail.</p>
    <p>L'équipe de Soko.</p>
    `;

    try {
        await sendEmail(user.userMail, "Réinitialisation de votre mot de passe", emailContent);
    } catch (error) {
        console.error("Erreur lors de l'envoi de l'email de réinitialisation :", error);
        return {
            error: true,
            message: "Une erreur est survenue lors de l'envoi de l'email de réinitialisation. Veuillez réessayer plus tard.",
        };
    }

    return {
        success: true,
        message: "Si un compte avec cet email existe, vous recevrez un email de réinitialisation.",
    };
}

const resetPasswordErrorResult = {
    error: true,
    message: "Session de réinitialisation invalide ou expirée.",
} as const;

export async function verifyResetPasswordSessionEmail(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const sessionId = formData.get("sessionId");
    const email = formData.get("email");

    if (typeof sessionId !== "string" || typeof email !== "string") {
        return {
            error: true,
            message: "Données de formulaire invalides.",
        };
    }

    const sessionResult = await resetPasswordSessionQueries.getBySessionId(sessionId);

    if ("error" in sessionResult) {
        return resetPasswordErrorResult;
    }

    const session = sessionResult.entity;

    if (session.expiresAt < new Date()) {
        return resetPasswordErrorResult;
    }

    const sessionEmail = session.userMailTeacher ?? session.userMailStudent;

    if (sessionEmail?.toLowerCase() !== email.toLowerCase()) {
        return {
            error: true,
            message: "L'email ne correspond pas a la session de reinitialisation.",
        };
    }

    return {
        success: true,
        message: "Email verifie. Vous pouvez maintenant modifier votre mot de passe.",
    };
}

export async function resetPassword(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
    const sessionId = formData.get("sessionId");
    const newPassword = formData.get("password");
    const email = formData.get("email");

    if (typeof sessionId !== "string" || typeof newPassword !== "string" || typeof email !== "string") {
        return {
            error: true,
            message: "Données de formulaire invalides.",
        };
    }

    const sessionResult = await resetPasswordSessionQueries.getBySessionId(sessionId);

    if ("error" in sessionResult) {
        return resetPasswordErrorResult;
    }

    const session = sessionResult.entity;

    if (session.expiresAt < new Date()) {
        return resetPasswordErrorResult;
    }

    const sessionEmail = session.userMailTeacher ?? session.userMailStudent;

    if (sessionEmail?.toLowerCase() !== email.toLowerCase()) {
        return {
            error: true,
            message: "L'email ne correspond pas a la session de reinitialisation.",
        };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    let result: QueryResult<string>;
    const accoutType = session.userMailTeacher ? "teacher" : "student" as const;

    if (session.userMailTeacher) {
        result = await teacherQueries.updatePassword(session.userMailTeacher, hashedPassword);
    } else if (session.userMailStudent) {
        result = await studentQueries.updatePassword(session.userMailStudent, hashedPassword);
    } else {
        return resetPasswordErrorResult;
    }

    if ("error" in result) {
        return {
            error: true,
            message: "Erreur lors de la mise à jour du mot de passe.",
        };
    }

    await resetPasswordSessionQueries.markSessionAsUsed(sessionId);

    return {
        success: true,
        message: "Mot de passe réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.",
        redirectTo: accoutType === "teacher" ? "/professeur/connexion" : "/etudiant",
    };
}