"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { passwordRules } from "./rules";
import { register } from "@/lib/actions/authentication";
import { ActionResult } from "@/lib/actions/types";
import { Checkbox } from "../ui/checkbox";
import { useRouter } from "next/navigation";

export default function InscriptionForm() {
    const router = useRouter();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [isRememberChecked, setIsRememberChecked] = useState(false);

    const passwordValid = passwordRules.every((rule) => rule.test(password));
    const formValid =
        firstName.trim() !== "" &&
        lastName.trim() !== "" &&
        email.trim() !== "" &&
        passwordValid &&
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
                                onChange={(e) => setEmail(e.target.value)}
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
                    <div className="w-full flex flex-col gap-2">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="Mot de passe"

                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setPasswordFocused(true)}
                            onBlur={() => setPasswordFocused(false)}
                        />
                        {passwordFocused && (
                            <ul className="flex flex-col gap-1 mt-1">
                                {passwordRules.map((rule) => {
                                    const valid = rule.test(password);
                                    return (
                                        <li
                                            key={rule.label}
                                            className={`text-xs flex items-center gap-1 ${valid ? "text-green-600" : "text-red-500"}`}
                                        >
                                            <span>{valid ? "✓" : "✗"}</span>
                                            {rule.label}
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                        <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            placeholder="Confirmer le mot de passe"

                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {confirmPassword !== "" && password !== confirmPassword && (
                            <p className="text-xs text-red-500">Les mots de passe ne correspondent pas.</p>
                        )}
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
