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
import { useActionState, useEffect, useState } from "react";
import { Checkbox } from "../ui/checkbox";
import { useRouter } from "next/navigation";

export default function ConnexionForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRememberChecked, setIsRememberChecked] = useState(false);

  const formValid = email.trim() !== "" && password.trim() !== "";

  const [state, formAction, pending] = useActionState<ActionResult, FormData>(async (prevState, formData) => {
    return await login(prevState, formData)
  }, { pending: true })

  useEffect(() => {
    if ("success" in state) {
      router.push(state.redirectTo);
    }
  }, [state]);

  return (
    <form className="h-screen w-screen flex items-center justify-center" action={formAction}>
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
          <div className="w-full flex flex-col">
            <Label htmlFor="password" className="mb-2">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              name="password"
              placeholder="Mot de passe"
              className="mb-2"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
          <div className="flex items-center">
            <Checkbox
              id="remember"
              name="remember"
              checked={isRememberChecked}
              onCheckedChange={(checked) => setIsRememberChecked(checked === true)}
            />
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
