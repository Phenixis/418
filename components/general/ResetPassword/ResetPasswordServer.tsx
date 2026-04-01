import { resetPasswordSessionQueries } from "@/lib/db/queries/reset-password-session";
import ResetPasswordSessionInvalid from "./ResetPasswordSessionInvalid";
import ResetPasswordFormClient from "./ResetPasswordClient";

export default async function ResetPasswordForm({ sessionId }: Readonly<{ sessionId: string }>) {
    const sessionQueryResult = await resetPasswordSessionQueries.getBySessionId(sessionId);

    if ("error" in sessionQueryResult) {
        console.log("Error fetching reset password session:", sessionQueryResult.error);
        return <ResetPasswordSessionInvalid />
    }

    const session = sessionQueryResult.entity

    if (session.expiresAt < new Date()) {
        console.log("Reset password session has expired.");
        return <ResetPasswordSessionInvalid />
    }

    return <ResetPasswordFormClient session={session} />
}

