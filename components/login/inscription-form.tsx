"use client";

import { useState } from "react";
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

export default function InscriptionForm() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordFocused, setPasswordFocused] = useState(false);

    const passwordValid = passwordRules.every((rule) => rule.test(password));
    const formValid =
        name.trim() !== "" &&
        email.trim() !== "" &&
        passwordValid &&
        password === confirmPassword;

    return (
        <main className="h-screen w-screen flex items-center justify-center">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Inscription</CardTitle>
                    <CardDescription hidden>
                        Créez votre compte.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div className="w-full flex flex-col gap-2">
                        <Label htmlFor="name">Nom</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="Nom"
                            className="bg-white"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Email"
                            className="bg-white"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div className="w-full flex flex-col gap-2">
                        <Label htmlFor="password">Mot de passe</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Mot de passe"
                            className="bg-white"
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
                            type="password"
                            placeholder="Confirmer le mot de passe"
                            className="bg-white"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {confirmPassword !== "" && password !== confirmPassword && (
                            <p className="text-xs text-red-500">Les mots de passe ne correspondent pas.</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="gap-4 justify-between">
                    <Link href="/connexion" className="text-sm text-muted-foreground hover:underline">
                        Déjà un compte ?
                    </Link>
                    {formValid ? (
                        <Link href="/dashboard">
                            <Button variant="default">S&apos;inscrire</Button>
                        </Link>
                    ) : (
                        <Button variant="default" disabled>
                            S&apos;inscrire
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </main>
    );
}
