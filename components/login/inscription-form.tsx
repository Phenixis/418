"use client";

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
import { register } from "@/lib/actions/authentication";
import { ActionResult } from "@/lib/actions/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Checkbox } from "../ui/checkbox";
import NewPassword from "./NewPassword";

export default function InscriptionForm() {
    const router = useRouter();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [isRememberChecked, setIsRememberChecked] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isPasswordValid, setIsPasswordValid] = useState(false);

    const formValid =
        firstName.trim() !== "" &&
        lastName.trim() !== "" &&
        email.trim() !== "" &&
        isPasswordValid &&
        password === confirmPassword;

    const [state, formAction, pending] = useActionState<ActionResult, FormData>(async (prevState, formData) => {
        return await register(prevState, formData)
    }, { pending: true })

    useEffect(() => {
        if ("success" in state) {
            router.push(state.redirectTo);
        }
    }, [state, router]);

    return (
        <form className="h-screen w-screen flex items-center justify-center" action={formAction}>
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="h2 font-normal">Inscription</CardTitle>
                    <CardDescription hidden>
                        Créez votre compte.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="w-full flex items-center gap-2">
                        <div className="w-full flex flex-col gap-2">
                            <Label htmlFor="first-name">Prénom</Label>
                            <Input
                                id="first-name"
                                name="first-name"
                                type="text"
                                placeholder="Prénom"

                                required
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                        </div>
                        <div className="w-full flex flex-col gap-2">
                            <Label htmlFor="last-name">Nom</Label>
                            <Input
                                id="last-name"
                                name="last-name"
                                type="text"
                                placeholder="Nom"

                                required
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                        </div>
                    </div>
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
                                onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
                                onBlur={() => {
                                    const emailWithoutDomain = email.split("@")[0];
                                    setEmail(emailWithoutDomain);
                                }}
                            />
                            <p className="text-faded shrink-0">
                                @univ-rennes.fr
                            </p>
                        </div>
                    </div>
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
                    <Link href="/professeur/connexion" className="text-sm text-faded hover:underline">
                        Déjà un compte ?
                    </Link>
                    <Button variant="big" className="w-full" disabled={pending || !formValid} type="submit">
                        S'inscrire
                    </Button>
                    <div className="flex items-center">
                        <Checkbox
                            id="remember"
                            name="remember"
                            checked={isRememberChecked}
                            onCheckedChange={(checked) => setIsRememberChecked(checked === true)}
                        />
                        <Label htmlFor="remember" className="ml-2 cursor-pointer">Rester connecté</Label>
                    </div>
                </CardFooter>
            </Card>
        </form>
    );
}
