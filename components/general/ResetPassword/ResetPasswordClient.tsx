"use client"

import { Button } from "@/components/ui/button";
import type { Select as Session } from "@/lib/db/schema/reset-password-session"
import { useActionState, useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionResult } from "@/lib/actions/types";
import NewPassword from "@/components/login/NewPassword";
import { resetPassword, verifyResetPasswordSessionEmail } from "@/lib/actions/reset-password";
import { useRouter } from "next/navigation";

export default function ResetPasswordFormClient({
    session
}: Readonly<{
    session: Session
}>) {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPasswordValid, setIsPasswordValid] = useState(false);

    const hasTeacherEmail = Boolean(session.userMailTeacher);
    const emailSuffix = hasTeacherEmail ? "@univ-rennes.fr" : "@etudiant.univ-rennes.fr";
    const completeEmail = `${email}${emailSuffix}`;

    const [emailVerificationState, verifyEmailAction, emailVerificationPending] = useActionState<ActionResult, FormData>(async (prevState, formData) => {
        return await verifyResetPasswordSessionEmail(prevState, formData)
    }, { pending: true })

    const [state, formAction, pending] = useActionState<ActionResult, FormData>(async (prevState, formData) => {
        return await resetPassword(prevState, formData)
    }, { pending: true })

    useEffect(() => {
        if ("success" in emailVerificationState && emailVerificationState.success) {
            setIsEmailVerified(true);
        }
    }, [emailVerificationState])

    useEffect(() => {
        if ("success" in state && state.success && "redirectTo" in state) {
            router.push(state.redirectTo);
        }
    }, [state, router])

    if (!isEmailVerified) {
        return (
            <form className="h-screen w-screen flex items-center justify-center" action={verifyEmailAction}>
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="h2 font-normal">Verification de votre email</CardTitle>
                        <CardDescription hidden>
                            Confirmez l'email lie a cette session avant de modifier votre mot de passe.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <input type="hidden" name="sessionId" value={session.id} />
                        <div className="w-full flex flex-col gap-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="email"
                                    name="emailLocalPart"
                                    type="text"
                                    placeholder="Email"
                                    required
                                    value={email}
                                    onChange={(event) => {
                                        const emailLocalPart = event.target.value.split("@")[0];
                                        setEmail(emailLocalPart);
                                    }}
                                />
                                <p className="text-faded shrink-0">{emailSuffix}</p>
                            </div>
                        </div>
                        <input type="hidden" name="email" value={completeEmail} />
                    </CardContent>
                    <CardFooter className="gap-4 flex-col-reverse justify-end">
                        {
                            "error" in emailVerificationState && (
                                <p className="text-red-500 text-sm">
                                    {emailVerificationState.message}
                                </p>
                            )
                        }
                        <Button variant="big" className="w-full" disabled={emailVerificationPending || email === ""} type="submit">
                            Verifier mon email
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        )
    }

    return (
        <form className="h-screen w-screen flex items-center justify-center" action={formAction}>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="h2 font-normal">Modification du mot de passe</CardTitle>
                    <CardDescription hidden>
                        Modifier le mot de passe de votre compte.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <input type="hidden" name="sessionId" value={session.id} />
                    <input type="hidden" name="email" value={completeEmail} />
                    <NewPassword
                        password={password}
                        setPassword={setPassword}
                        confirmPassword={confirmPassword}
                        setConfirmPassword={setConfirmPassword}
                        setIsPasswordValid={setIsPasswordValid}
                    />
                </CardContent>
                <CardFooter className="gap-4 flex-col-reverse justify-end">
                    {
                        "error" in state && (
                            <p className="text-red-500 text-sm">
                                {state.message}
                            </p>
                        )
                    }
                    <Button
                        variant="big"
                        className="w-full"
                        disabled={pending || !isPasswordValid || password !== confirmPassword}
                        type="submit"
                    >
                        Modifier le mot de passe
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}