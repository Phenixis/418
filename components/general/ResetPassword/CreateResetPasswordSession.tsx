"use client"

import { Button } from "@/components/ui/button";
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
import { createResetPasswordSession } from "@/lib/actions/reset-password";
import type { ActionResult } from "@/lib/actions/types";
import { useActionState, useState } from "react";

export default function CreateResetPasswordSession({
    target
}: Readonly<{
    target: "teacher" | "student"
}>) {
    const [email, setEmail] = useState("");

    const [state, formAction, pending] = useActionState<ActionResult, FormData>(async (prevState, formData) => {
        return await createResetPasswordSession(prevState, formData)
    }, { pending: true })

    if ("success" in state && "message" in state) {
        return (
            <div className="h-screen w-screen flex items-center justify-center">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="h2 font-normal">Email envoyé</CardTitle>
                        <CardDescription hidden>
                            Un email de réinitialisation a été envoyé si un compte avec l'email fourni existe.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-4">
                        <p>{state.message}</p>
                    </CardContent>
                </Card>
            </div>
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
                    <input type="hidden" name="target" value={target} />
                    <div className="w-full flex flex-col gap-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="email"
                                name="email"
                                type="text"
                                placeholder="Email"
                                required
                                value={email}
                                onChange={(event) => {
                                    const emailWithoutDomain = event.target.value.split("@")[0];
                                    setEmail(emailWithoutDomain.toLowerCase().trim());
                                }}
                            />
                            <p className="text-faded shrink-0">
                                @{target === 'student' ? "etudiant." : ""}univ-rennes.fr
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="gap-4 flex-col-reverse justify-end">
                    {
                        "error" in state && (
                            <p className="text-red-500 text-sm">
                                {state.message}
                            </p>
                        )
                    }
                    <Button variant="big" className="w-full" disabled={pending || (email === "")} type="submit">
                        Réinitialiser le mot de passe
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}