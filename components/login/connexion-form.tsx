"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { passwordRules } from "./rules";

type ActionResult = {
  success: boolean;
  redirectTo?: string;
  pending?: boolean;
};

export async function login(_prevState: ActionResult, formData: FormData): Promise<ActionResult> {
  const email = formData.get("email");
  const password = formData.get("password");
  const remember = formData.get("remember");

  if (typeof email !== "string" || typeof password !== "string") {
    return { success: false };
  }

  if (email.trim() === "" || password.trim() === "") {
    return { success: false };
  }

  if (remember !== null && remember !== "on") {
    return { success: false };
  }

  return {
    success: true,
    redirectTo: "/professeur/dashboard"
  };
}

export default function ConnexionForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [state, formAction, pending] = useActionState<ActionResult, FormData>(async (prevState, formData) => {
    return await login(prevState, formData);
  }, { pending: true, success: false });

  useEffect(() => {
    if (state.success && state.redirectTo) {
      router.push(state.redirectTo);
    }
  }, [router, state.redirectTo, state.success]);

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
        <form action={formAction}>
          <CardContent>
            <div className="w-full flex flex-col gap-2 mb-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
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
                name="password"
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
            <div className="mt-4 flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  name="remember"
                  checked={remember}
                  onCheckedChange={(value) => setRemember(value === true)}
                />
                <Label htmlFor="remember">Se souvenir de moi</Label>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide text-faded border-faded">Non fonctionnel</Badge>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <p className="text-xs text-faded">
                L&apos;option de session persistante sera activee prochainement.
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button type="button" variant="link" className="px-0 text-sm text-black">
                    Mot de passe oublié ?
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Récupération du mot de passe</DialogTitle>
                    <DialogDescription>
                      Entrez votre adresse email pour recevoir un lien de reinitialisation.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-2">
                    <Label htmlFor="forgot-password-email">Email</Label>
                    <Input
                      id="forgot-password-email"
                      type="email"
                      value={forgotPasswordEmail}
                      onChange={(e) => setForgotPasswordEmail(e.target.value)}
                      placeholder="prenom.nom@etu.iut.fr"
                    />
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide text-faded border-faded">
                      Non fonctionnel pour le moment
                    </Badge>
                  </div>

                  <DialogFooter>
                    <Button
                      type="button"
                      onClick={() => {
                        toast.info("Fonctionnalité à venir", {
                          description: "La récupération de mot de passe n'est pas encore connectée au backend.",
                        });
                      }}
                    >
                      Envoyer le lien
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
          <CardFooter className="gap-4 justify-end">
            <Button variant="default" type="submit" disabled={!formValid || pending}>
              {pending ? "Connexion..." : "Se connecter"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
