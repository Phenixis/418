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
import { login } from "@/lib/actions/authentication";
import { ActionResult } from "@/lib/actions/types";
import { useActionState, useEffect, useRef, useState } from "react";
import { Checkbox } from "../ui/checkbox";
import { passwordRules } from "./rules";

export default function ConnexionForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);

  const passwordValid = passwordRules.every((rule) => rule.test(password));
  const formValid = email.trim() !== "" && passwordValid;

  const [state, formAction, pending] = useActionState<ActionResult, FormData>(async (prevState, formData) => {
    return await login(prevState, formData)
  }, { pending: true })

  useEffect(() => {
    if ("success" in state) {
      globalThis.location.href = state.redirectTo;
    }
  }, [state]);

  return (
    <form className="h-screen w-screen flex items-center justify-center" action={formAction} ref={formRef}>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="h2 font-normal">Connexion</CardTitle>
          <CardDescription hidden>
            Veuillez vous connecter à votre compte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="w-full flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            
            <div className="flex items-center gap-2">
              <Input 
              id="email" 
              name="email" 
              type="text" 
              placeholder="Email" 
              className="bg-white" 
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
          <div className="w-full flex flex-col">
            <Label htmlFor="password" className="mb-2">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="Mot de passe"
              className="bg-white mb-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            {passwordFocused && (
              <ul className="flex flex-col gap-1">
                {passwordRules.filter(rule => !rule.test(password)).map((rule) => {
                  return (
                    <li
                      key={rule.label}
                      className={`text-xs flex items-center gap-1 text-red-500`}
                    >
                      <span>✗</span>
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </CardContent>
        <CardFooter className="gap-4 flex-col-reverse justify-end">
          <div className="flex items-center">
            <Checkbox id="remember" name="remember" />
            <Label htmlFor="remember" className="ml-2">Rester connecté</Label>
          </div>
          <Button variant="big" className="w-full" disabled={pending || !formValid} type="submit">
            Se connecter
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
