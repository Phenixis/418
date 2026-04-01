"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { passwordRules } from "./rules";

export default function NewPassword({
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    setIsPasswordValid
}: Readonly<{
    password: string,
    setPassword: (password: string) => void,
    confirmPassword: string,
    setConfirmPassword: (confirmPassword: string) => void,
    setIsPasswordValid: (isValid: boolean) => void
}>) {
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    useEffect(() => {
        setIsPasswordValid(passwordRules.every(rule => rule.test(password)));
    }, [password, passwordRules, setIsPasswordValid]);

    return (
        <>
            <div className="w-full flex flex-col gap-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                    <Input
                        id="password"
                        name="password"
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder="Mot de passe"

                        required
                        className="pr-12"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 my-auto mr-1 h-8 w-8"
                        aria-label={isPasswordVisible ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                        aria-pressed={isPasswordVisible}
                        onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
                    >
                        {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
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
                <div className="relative">
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={isPasswordVisible ? "text" : "password"}
                        placeholder="Confirmer le mot de passe"

                        required
                        className="pr-12"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 my-auto mr-1 h-8 w-8"
                        aria-label={isPasswordVisible ? "Cacher le mot de passe" : "Afficher le mot de passe"}
                        aria-controls="confirmPassword"
                        aria-pressed={isPasswordVisible}
                        onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
                    >
                        {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                </div>
                {confirmPassword !== "" && password !== confirmPassword && (
                    <p className="text-xs text-red-500">Les mots de passe ne correspondent pas.</p>
                )}
            </div>
        </>
    )
}