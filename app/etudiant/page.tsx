'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// --- Imports de la charte graphique ---
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner"; // Pop-ups de notification modernes

// --- MOCKS (Simulation de la Base de Données) ---
const mockCours =[
    { id: "1", nom: "Développement Web - TP2", actif: true },
    { id: "2", nom: "Architecture Logicielle - TD1", actif: false }, // Cours terminé
];

const mockEtudiants =[
    { email: "jean.dupont@etu.iut.fr", password: "mdp", attenduDans: ["1"] },
    { email: "intrus@etu.iut.fr", password: "mdp", attenduDans:[] }, // Étudiant non autorisé
];
// --------------------------------------------------------------------

function PresenceForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const coursId = searchParams.get('cours_id');

    // États du processus de connexion
    const [step, setStep] = useState<'LOADING' | 'EMAIL' | 'PASSWORD' | 'SUCCESS'>('LOADING');
    const[email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const[courseName, setCourseName] = useState<string>('');

    // CA 1 : Vérification de la validité du cours au chargement
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
        } else if (!cours.actif) {
            toast.error("Cours terminé", {
                description: "La connexion à ce cours est terminée.",
            });
            setStep('LOADING');
        } else {
            setCourseName(cours.nom);
            setStep('EMAIL'); // Le cours est valide, on passe à l'étape Email
        }
    }, [coursId]);

    // Validation de l'étape 1 : Email
    const handleEmailSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.includes('@')) {
            toast.error("Format invalide", {
                description: "Veuillez entrer une adresse email valide.",
            });
            return;
        }
        setStep('PASSWORD');
    };

    // Validation de l'étape 2 : Mot de passe et vérification d'appartenance au cours
    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const etudiant = mockEtudiants.find(etu => etu.email === email);

        if (!etudiant || etudiant.password !== password) {
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

        // Si tout est bon, on affiche l'écran de succès
        setStep('SUCCESS');
    };

    // --- RENDUS DE L'INTERFACE ---

    // 1. Écran de succès (CA 5)
    if (step === 'SUCCESS') {
        return (
            <Card className="max-w-md w-full border-t-4 border-t-green-500 shadow-lg">
                <CardHeader className="text-center pb-2">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
                        ✓
                    </div>
                    <CardTitle className="h2 text-green-600">Présence validée</CardTitle>
                </CardHeader>
                <CardContent className="text-center mt-4">
                    <p className="text-lg">Vous avez bien été connecté au cours :</p>
                    <Badge variant="default" className="mt-4 text-base px-4 py-1.5 font-medium">
                        {courseName}
                    </Badge>
                </CardContent>
                <CardFooter className="justify-center mt-6">
                    <Button variant="link" className="font-action" onClick={() => router.push('/etudiant')}>
                        Simuler un autre scan
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    // 2. Écran principal (Menu Dev ou Formulaire)
    return (
        <div className="max-w-md w-full space-y-6">
            
            {/* 🛠️ MENU DE TEST (Caché si un cours est détecté via l'URL) */}
            {!coursId && (
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

            {/* FORMULAIRE DE PRÉSENCE */}
            <Card className="shadow-lg border-gray-100">
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
                        <form onSubmit={step === 'EMAIL' ? handleEmailSubmit : handlePasswordSubmit} className="space-y-4">
                            
                            {/* ÉTAPE 1 : Champ Email */}
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

                            {/* Bouton de soumission Étape 1 */}
                            {step === 'EMAIL' && (
                                <div className="pt-4">
                                    <Button type="submit" variant="big" className="w-full">
                                        Suivant
                                    </Button>
                                </div>
                            )}

                            {/* ÉTAPE 2 : Champ Mot de passe (Apparaît avec animation) */}
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

                                    {/* Boutons de soumission et retour (Étape 2) */}
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

// Layout de base enveloppant le formulaire
export default function EtudiantPage() {
    return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
            <Suspense fallback={<div className="font-faded text-gray-500 uppercase">Chargement du cours...</div>}>
                <PresenceForm />
            </Suspense>
        </div>
    );
}