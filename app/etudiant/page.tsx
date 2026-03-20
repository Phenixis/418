'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2 } from "lucide-react";

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
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { passwordRules } from "@/components/login/rules";

// Donnees mock pour simuler la validation du cours et de l'etudiant
const mockCours = [
    { id: "1", nom: "Développement Web - TP2", actif: true },
    { id: "2", nom: "Architecture Logicielle - TD1", actif: false },
];

const mockEtudiants = [
    { email: "jean.dupont@etu.iut.fr", password: "mdp", attenduDans: ["1"] },
    { email: "intrus@etu.iut.fr", password: "mdp", attenduDans: [] },
    { email: "emma.nouveau@etu.iut.fr", password: "", attenduDans: ["1"] },
];

// Composant principal du parcours de pointage etudiant
function PresenceForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const coursId = searchParams.get('cours_id');

    const [step, setStep] = useState<'LOADING' | 'EMAIL' | 'PASSWORD' | 'CREATE_PASSWORD' | 'SUCCESS'>('LOADING');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [shouldRememberSession, setShouldRememberSession] = useState(false);
    const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
    const [courseName, setCourseName] = useState<string>('');

    // Initialisation du flux a partir du cours transmis par QR code
    useEffect(() => {
        if (!coursId) {
            toast.error("Action requise", {
                description: "Aucun cours détecté. Veuillez scanner un QR Code.",
            });
            setStep('LOADING');
            return;
        }

        const cours = mockCours.find(c => c.id === coursId);
        if (!cours) {
            toast.error("Erreur de QR Code", {
                description: "Cours non reconnu (ID invalide).",
            });
            setStep('LOADING');
        } else if (cours.actif === false) {
            toast.error("Cours terminé", {
                description: "La connexion à ce cours est terminée.",
            });
            setStep('LOADING');
        } else {
            setCourseName(cours.nom);
            setStep('EMAIL');
        }
    }, [coursId]);

    // Etape 1: validation de l'email
    const handleEmailSubmit = () => {
        if (!email.includes('@')) {
            toast.error("Format invalide", {
                description: "Veuillez entrer une adresse email valide.",
            });
            return;
        }

        const etudiant = mockEtudiants.find((etu) => etu.email === email);
        if (!etudiant) {
            toast.error("Accès refusé", {
                description: "Email ou mot de passe incorrect.",
            });
            return;
        }

        if (etudiant.password.trim() === "") {
            setStep('CREATE_PASSWORD');
            return;
        }

        setStep('PASSWORD');
    };

    // Etape 2: validation mot de passe + autorisation sur le cours
    const handlePasswordSubmit = () => {
        const etudiant = mockEtudiants.find(etu => etu.email === email);

        if (etudiant?.password !== password) {
            toast.error("Accès refusé", {
                description: "Email ou mot de passe incorrect.",
            });
            return;
        }

        if (!etudiant.attenduDans.includes(coursId!)) {
            toast.error("Non autorisé", {
                description: "Personne non attendue dans ce cours.",
            });
            return;
        }

        setStep('SUCCESS');
    };

    // Variante inscription: compte existant mais mot de passe non cree
    const handleCreatePasswordSubmit = () => {
        const etudiant = mockEtudiants.find((etu) => etu.email === email);
        if (!etudiant) {
            toast.error("Accès refusé", {
                description: "Compte introuvable.",
            });
            return;
        }

        const isPasswordValid = passwordRules.every((rule) => rule.test(password));
        if (!isPasswordValid) {
            toast.error("Mot de passe invalide", {
                description: "Le mot de passe ne respecte pas les regles de securite.",
            });
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Confirmation invalide", {
                description: "Les deux mots de passe ne correspondent pas.",
            });
            return;
        }

        if (!etudiant.attenduDans.includes(coursId!)) {
            toast.error("Non autorisé", {
                description: "Personne non attendue dans ce cours.",
            });
            return;
        }

        etudiant.password = password;
        setStep('SUCCESS');
    };

    // Ecran de confirmation apres validation complete
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

                <CardFooter className="bg-white px-6 pb-6 pt-2 border-t border-gray-100 flex justify-center">
                    <Button
                        variant="outline"
                        className="w-full font-action text-gray-700 bg-white hover:bg-gray-50"
                        onClick={() => {
                            setStep('LOADING');
                            router.push('/etudiant');
                        }}
                    >
                        Simuler un autre scan
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    let formDescription = "Scannez le QR code du professeur pour commencer.";
    if (step === 'CREATE_PASSWORD') {
        formDescription = "Première connexion : créez votre mot de passe pour continuer.";
    } else if (coursId && step !== 'LOADING') {
        formDescription = `Inscription au cours : ${courseName}`;
    }

    // Ecran principal: menu de test (dev) + formulaire de presence
    return (
        <div className="max-w-md w-full space-y-6">
            {!coursId && (
                // Bloc de simulation rapide pour tester les cas du flux
                <Card className="border-dashed border-2 border-blue-300 bg-blue-50/50 shadow-none">
                    <CardHeader className="pb-2">
                        <CardTitle className="h3 text-blue-800">🛠️ Mode Développeur</CardTitle>
                        <CardDescription className="text-blue-600 font-medium">
                            Simulez le scan d'un QR code pour tester le flux.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        <Button variant="outline" className="justify-start border-blue-300 text-blue-800 hover:bg-blue-100" onClick={() => router.push('?cours_id=1')}>
                            ➡️ Cours Valide (ID: 1)
                        </Button>
                        <Button variant="outline" className="justify-start border-blue-300 text-blue-800 hover:bg-blue-100" onClick={() => router.push('?cours_id=2')}>
                            ➡️ Cours Terminé (ID: 2)
                        </Button>
                        <div className="mt-4 text-sm text-blue-800 p-3 bg-white/60 rounded border border-blue-200">
                            <strong>Comptes de test :</strong><br />
                            ✅ jean.dupont@etu.iut.fr (mdp: mdp)<br />
                            ❌ intrus@etu.iut.fr (mdp: mdp)
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bloc principal de saisie et d'authentification */}
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
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={step === 'PASSWORD' || step === 'CREATE_PASSWORD'}
                                    placeholder="prenom.nom@etu.iut.fr"
                                    required
                                    className={step === 'PASSWORD' || step === 'CREATE_PASSWORD' ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}
                                />
                            </div>

                            {step === 'EMAIL' && (
                                <div className="pt-4">
                                    <Button type="submit" variant="big" className="w-full">
                                        Suivant
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
                                            placeholder="••••••••"
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
                                            <DialogContent>
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
                                                                description: "Le formulaire de récupération n'est pas encore connecté au backend.",
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
                                        <Button type="submit" variant="big" className="w-full">
                                            Se connecter
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="w-full text-sm font-action text-gray-500 hover:text-gray-800"
                                            onClick={() => setStep('EMAIL')}
                                        >
                                            Modifier l'adresse email
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {step === 'CREATE_PASSWORD' && (
                                <div className="space-y-5 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-left">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">Activation du compte</p>
                                        <p className="text-sm text-blue-700">Votre email est reconnu. Définissez votre mot de passe pour finaliser l'accès.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="font-semibold text-gray-700">Créer un mot de passe</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="••••••••"
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
                                            placeholder="••••••••"
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
                                        <Button type="submit" variant="big" className="w-full">
                                            Créer mon mot de passe
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="link"
                                            className="w-full text-sm font-action text-gray-500 hover:text-gray-800"
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

// Page wrapper: centrage, fond global, chargement suspense
export default function EtudiantPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <Suspense fallback={<div className="font-faded text-gray-500 uppercase">Chargement du cours...</div>}>
                <PresenceForm />
            </Suspense>
        </div>
    );
}