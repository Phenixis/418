'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

// Donnees mock pour simuler la validation du cours et de l'etudiant
const mockCours = [
    { id: "1", nom: "Développement Web - TP2", actif: true },
    { id: "2", nom: "Architecture Logicielle - TD1", actif: false },
];

const mockEtudiants = [
    { email: "jean.dupont@etu.iut.fr", password: "mdp", attenduDans: ["1"] },
    { email: "intrus@etu.iut.fr", password: "mdp", attenduDans: [] },
];

// Composant principal du parcours de pointage etudiant
function PresenceForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const coursId = searchParams.get('cours_id');

    const [step, setStep] = useState<'LOADING' | 'EMAIL' | 'PASSWORD' | 'SUCCESS'>('LOADING');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
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

    // Ecran de confirmation apres validation complete
    if (step === 'SUCCESS') {
        return (
            <Card className="max-w-md w-full bg-white shadow-xl border-t-8 border-t-green-500 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
                <CardHeader className="text-center pt-10 pb-6 bg-green-50/50 border-b border-green-100">
                    <div className="flex justify-center mb-6">
                        <div className="rounded-full bg-green-100 p-4 shadow-sm">
                            <CheckCircle2 className="w-16 h-16 text-green-600" strokeWidth={2.5} />
                        </div>
                    </div>
                    <CardTitle className="h1 text-green-700">Présence validée</CardTitle>
                </CardHeader>

                <CardContent className="text-center pt-8 pb-8 space-y-6 bg-white">
                    <p className="text-lg text-gray-600">
                        Vous avez bien été enregistré pour le cours :
                    </p>

                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 mx-2 shadow-inner">
                        <span className="h3 font-semibold text-gray-800 break-words leading-tight">
                            {courseName}
                        </span>
                    </div>

                    <p className="text-sm font-faded text-gray-400 mt-6 px-4">
                        Vous pouvez maintenant verrouiller votre téléphone.
                    </p>
                </CardContent>

                <CardFooter className="bg-gray-50 p-6 border-t border-gray-100 flex justify-center">
                    <Button
                        variant="outline"
                        className="w-full font-action text-gray-600 bg-white hover:bg-gray-100"
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
                    <CardDescription className="text-base mt-2">
                        {coursId && step !== 'LOADING'
                            ? `Inscription au cours : ${courseName}`
                            : "Scannez le QR code du professeur pour commencer."}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {(step === 'EMAIL' || step === 'PASSWORD') && (
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                if (step === 'EMAIL') {
                                    handleEmailSubmit();
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
                                    disabled={step === 'PASSWORD'}
                                    placeholder="prenom.nom@etu.iut.fr"
                                    required
                                    className={step === 'PASSWORD' ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}
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