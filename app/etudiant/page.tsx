'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2 } from "lucide-react";
import {
    authenticateStudentAction,
    checkStudentEmailAction,
    createStudentPasswordAction,
    getCourseStatusAction,
} from './actions';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { passwordRules } from "@/components/login/rules";

const STUDENT_EMAIL_DOMAIN = "etudiant.univ-rennes.fr";

// Flux de pointage etudiant pilote par cours_id.
function PresenceForm() {
    const searchParams = useSearchParams();
    const coursId = searchParams.get('cours_id');

    const [step, setStep] = useState<'LOADING' | 'EMAIL' | 'PASSWORD' | 'CREATE_PASSWORD' | 'SUCCESS'>('LOADING');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [shouldRememberSession, setShouldRememberSession] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [courseName, setCourseName] = useState<string>('');
    const [isSubmittingForm, setIsSubmittingForm] = useState(false);

    // Initialisation du cours scanne (validation en base puis passage a l'etape email).
    useEffect(() => {
        if (!coursId) {
            toast.error("Action requise", {
                description: "Aucun cours détecté. Veuillez scanner un QR Code.",
            });
            return;
        }

        const courseId = coursId;

        let shouldIgnoreResult = false;

        async function initializeCourseFlow() {
            const result = await getCourseStatusAction(courseId);
            if (shouldIgnoreResult) {
                return;
            }

            if (!result.success) {
                toast.error("Erreur de QR Code", {
                    description: result.error,
                });
                setStep('LOADING');
                return;
            }

            setCourseName(result.data.courseName);
            setStep('EMAIL');
        }

        void initializeCourseFlow();

        return () => {
            shouldIgnoreResult = true;
        };
    }, [coursId]);

    // Etape 1: verification de l'identite et choix du prochain ecran.
    const handleEmailSubmit = async () => {
        if (email.trim() === '') {
            toast.error("Format invalide", {
                description: "Veuillez entrer une adresse email valide.",
            });
            return;
        }

        if (!coursId) {
            toast.error("Accès refusé", {
                description: "Aucun cours détecté. Veuillez scanner un QR Code.",
            });
            return;
        }

        setIsSubmittingForm(true);

        const result = await checkStudentEmailAction(email, coursId);
        setIsSubmittingForm(false);

        if (!result.success) {
            toast.error("Accès refusé", {
                description: result.error,
            });
            return;
        }

        setCourseName(result.data.courseName);

        if (result.data.nextStep === 'CREATE_PASSWORD') {
            setStep('CREATE_PASSWORD');
            return;
        }

        setStep('PASSWORD');
    };

    // Etape 2: authentification et enregistrement de presence.
    const handlePasswordSubmit = async () => {
        if (!coursId) {
            toast.error("Accès refusé", {
                description: "Aucun cours détecté. Veuillez scanner un QR Code.",
            });
            return;
        }

        setIsSubmittingForm(true);
        const result = await authenticateStudentAction(email, password, coursId);
        setIsSubmittingForm(false);

        if (!result.success) {
            toast.error("Accès refusé", {
                description: result.error,
            });
            return;
        }

        setCourseName(result.data.courseName);

        setStep('SUCCESS');
    };

    // Etape d'activation: creation du premier mot de passe.
    const handleCreatePasswordSubmit = async () => {
        if (!coursId) {
            toast.error("Accès refusé", {
                description: "Aucun cours détecté. Veuillez scanner un QR Code.",
            });
            return;
        }

        setIsSubmittingForm(true);
        const result = await createStudentPasswordAction(email, password, confirmPassword, coursId);
        setIsSubmittingForm(false);

        if (!result.success) {
            toast.error("Accès refusé", {
                description: result.error,
            });
            return;
        }

        setCourseName(result.data.courseName);
        setStep('SUCCESS');
    };

    // Ecran de succes apres validation de la presence.
    if (step === 'SUCCESS') {
        return (
            <Card className="max-w-md w-full bg-white shadow-lg border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <CardHeader className="text-center py-7 bg-white border-b border-gray-100">
                    <div className="flex justify-center mb-4">
                        <div className="rounded-full bg-green-100/80 p-3.5 ring-1 ring-green-200">
                            <CheckCircle2 className="w-12 h-12 text-green-600" strokeWidth={2.25} />
                        </div>
                    </div>
                    <CardTitle className="h2 text-gray-900">Présence validée</CardTitle>
                </CardHeader>

                <CardContent className="text-center py-6 space-y-4 bg-white">
                    <p className="text-base text-gray-600">
                        Vous avez bien été enregistré pour le cours :
                    </p>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <span className="h3 font-semibold text-gray-900 break-words leading-tight">
                            {courseName}
                        </span>
                    </div>

                    <p className="text-sm text-faded px-2">
                        Vous pouvez maintenant verrouiller votre téléphone.
                    </p>
                </CardContent>
            </Card>
        );
    }

    let formDescription = "Scannez le QR code du professeur pour commencer.";
    if (step === 'CREATE_PASSWORD') {
        formDescription = "Première connexion : créez votre mot de passe pour continuer.";
    } else if (coursId && step !== 'LOADING') {
        formDescription = `Inscription au cours : ${courseName}`;
    }

    // Formulaire principal de connexion etudiant.
    return (
        <div className="w-11/12 sm:w-full sm:max-w-md space-y-6">
            {/* Carte de connexion */}
            <Card className="bg-white shadow-lg border-gray-100">
                <CardHeader className="text-center">
                    <CardTitle className="h1">Présence</CardTitle>
                    <CardDescription className="text-base mt-2">{formDescription}</CardDescription>
                </CardHeader>

                <CardContent>
                    {(step === 'EMAIL' || step === 'PASSWORD' || step === 'CREATE_PASSWORD') && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (step === 'EMAIL') {
                                    handleEmailSubmit();
                                    return;
                                }
                                if (step === 'CREATE_PASSWORD') {
                                    handleCreatePasswordSubmit();
                                    return;
                                }
                                handlePasswordSubmit();
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2">
                                <Label htmlFor="email" className="font-semibold text-gray-700">Adresse email IUT</Label>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                    <Input
                                        id="email"
                                        name="email"
                                        type="text"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        onBlur={() => {
                                            const emailWithoutDomain = email.split("@")[0]?.trim().toLowerCase() ?? "";
                                            setEmail(emailWithoutDomain);
                                        }}
                                        disabled={step === 'PASSWORD' || step === 'CREATE_PASSWORD'}
                                        placeholder="prenom.nom"
                                        required
                                        className={`sm:flex-1 ${step === 'PASSWORD' || step === 'CREATE_PASSWORD' ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                                    />
                                    <p className="text-faded text-xs sm:text-sm whitespace-nowrap">@etudiant.univ-rennes.fr</p>
                                </div>
                            </div>

                            {step === 'EMAIL' && (
                                <div className="pt-4">
                                    <Button type="submit" variant="big" className="w-full" disabled={isSubmittingForm}>
                                        {isSubmittingForm ? 'Chargement...' : 'Suivant'}
                                    </Button>
                                </div>
                            )}

                            {step === 'PASSWORD' && (
                                <div className="space-y-5 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="font-semibold text-gray-700">Mot de passe</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mot de passe"
                                            required
                                        />
                                    </div>

                                    <div className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                                        <div className="flex items-center gap-2.5">
                                            <Checkbox
                                                id="remember-session"
                                                className="mt-0.5"
                                                checked={shouldRememberSession}
                                                onCheckedChange={(value) => setShouldRememberSession(value === true)}
                                            />
                                            <Label htmlFor="remember-session" className="text-sm leading-none text-gray-700 cursor-pointer">
                                                Rester connecté
                                            </Label>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button type="button" variant="link" className="h-auto p-0 text-sm font-action text-gray-600 hover:text-gray-900">
                                                    Mot de passe oublié ?
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="w-11/12 sm:w-full">
                                                <DialogHeader>
                                                    <DialogTitle>Récupération du mot de passe</DialogTitle>
                                                    <DialogDescription>
                                                        Entrez votre email pour recevoir un lien de réinitialisation.
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
                                                </div>

                                                <DialogFooter>
                                                    <Button
                                                        type="button"
                                                        onClick={() => {
                                                            toast.info("Fonctionnalité à venir", {
                                                                description: "La fonctionnalité n'est pas encore fonctionnelle.",
                                                            });
                                                        }}
                                                    >
                                                        Envoyer le lien
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <div className="pt-2 space-y-3">
                                        <Button type="submit" variant="big" className="w-full" disabled={isSubmittingForm}>
                                            {isSubmittingForm ? 'Connexion...' : 'Se connecter'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="w-full text-sm font-action text-gray-500 hover:text-gray-800"
                                            disabled={isSubmittingForm}
                                            onClick={() => setStep('EMAIL')}
                                        >
                                            Modifier l&apos;adresse email
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 'CREATE_PASSWORD' && (
                                <div className="space-y-5 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-left">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Activation du compte</p>
                                        <p className="text-sm text-blue-700">Votre email est reconnu. Définissez votre mot de passe pour finaliser l&apos;accès.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="font-semibold text-gray-700">Créer un mot de passe</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Mot de passe"
                                            required
                                        />
                                    </div>

                                    {confirmPassword !== '' && password !== confirmPassword && (
                                        <p className="text-xs text-red-500">Les deux mots de passe doivent être identiques.</p>
                                    )}

                                    <div className="space-y-2">
                                        <Label htmlFor="confirmPassword" className="font-semibold text-gray-700">Confirmer le mot de passe</Label>
                                        <Input
                                            id="confirmPassword"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Mot de passe"
                                            required
                                        />
                                    </div>

                                    <ul className="flex flex-col gap-1 mt-1">
                                        {passwordRules.map((rule) => {
                                            const isRuleValid = rule.test(password);
                                            return (
                                                <li
                                                    key={rule.label}
                                                    className={`text-xs flex items-center gap-1 ${isRuleValid ? "text-green-600" : "text-red-500"}`}
                                                >
                                                    <span>{isRuleValid ? "✓" : "✗"}</span>
                                                    {rule.label}
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    <div className="pt-2 space-y-3">
                                        <Button type="submit" variant="big" className="w-full" disabled={isSubmittingForm}>
                                            {isSubmittingForm ? 'Validation...' : 'Créer mon mot de passe'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="w-full text-sm font-action text-gray-500 hover:text-gray-800"
                                            disabled={isSubmittingForm}
                                            onClick={() => {
                                                setPassword('');
                                                setConfirmPassword('');
                                                setStep('EMAIL');
                                            }}
                                        >
                                            Retour
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Enveloppe de page avec fallback de chargement.
export default function EtudiantPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <Suspense fallback={<div className="font-faded text-gray-500 uppercase">Chargement du cours...</div>}>
                <PresenceForm />
            </Suspense>
        </div>
    );
}