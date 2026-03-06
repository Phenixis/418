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
} from "@/components/ui/card"
import { Button } from "@/components/ui/button";
import Link from "next/link";

const passwordRules = [
  { label: "Au moins 8 caractères", test: (v: string) => v.length >= 8 },
  { label: "Au moins 1 majuscule", test: (v: string) => /[A-Z]/.test(v) },
  { label: "Au moins 1 minuscule", test: (v: string) => /[a-z]/.test(v) },
  { label: "Au moins 1 chiffre", test: (v: string) => /[0-9]/.test(v) },
];

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordValid = passwordRules.every((rule) => rule.test(password));
  const formValid = email.trim() !== "" && passwordValid;

  return (
    <main className="h-screen w-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription hidden>
            Veuillez vous connecter à votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full flex flex-col gap-2 mb-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="Email" className="bg-white" value={email} onChange={(e) => setEmail(e.target.value)} />
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
        </CardContent>
        <CardFooter className="gap-4 justify-end">
          {
            formValid ? (
              <Link href="/dashboard">
                <Button variant="default">
                  Se connecter
                </Button>
              </Link>
            ) : (
              <Button variant="default" disabled>
                Se connecter
              </Button>
            )
          }
        </CardFooter>
      </Card>
    </main>
  );
}
