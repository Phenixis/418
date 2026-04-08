"use client";

import { useEffect, useMemo, useState } from 'react';
import EtudiantCard from '@/components/cours/EtudiantCard';
import EtudiantRow from '@/components/cours/EtudiantRow';
import BarreActions, { type FiltrePresence, type ModeAffichage } from '@/components/cours/BarreActions';
import { StatutEtudiant } from '@/components/cours/course.types';
import { getProchainStatut, isEtudiantPresent } from '@/components/cours/course-utils';
import { StudentWithStatus } from '@/lib/actions/cours-actuel';
import { useAttendanceRealtime } from '@/hooks/use-attendance-realtime';

interface ListeEtudiantsProps {
    sessionId: string;
    etudiants: StudentWithStatus[];
    onStudentsChange?: (students: StudentWithStatus[]) => void;
}

type ToggleAttendanceResponse = {
    status: StatutEtudiant;
};

/**
 * Applique un snapshot de présence issu du polling, tout en préservant
 * les statuts de retard déjà définis localement par le professeur.
 */
function applyPresenceSnapshot(
    previousStudents: StudentWithStatus[],
    pendingStudentMails: Set<string>,
    presentStudentMails: Set<string>
): StudentWithStatus[] {
    return previousStudents.map((previousStudent) => {
        // Ne pas écraser un étudiant dont la requête est en cours
        if (pendingStudentMails.has(previousStudent.userMail)) {
            return previousStudent;
        }

        const isDejaPresent = isEtudiantPresent(previousStudent.statut);
        const shouldBePresent = presentStudentMails.has(previousStudent.userMail);

        // Si l'étudiant est déjà marqué présent (ou en retard) et toujours présent
        // en BDD, on préserve son statut local (retard inclus)
        if (shouldBePresent && isDejaPresent) {
            return previousStudent;
        }

        return {
            ...previousStudent,
            statut: shouldBePresent
                ? StatutEtudiant.PRESENT
                : StatutEtudiant["NON-SCANNE"]
        };
    });
}

/** Vérifie si un étudiant correspond à la recherche (prénom ou nom) */
function correspondALaRecherche(etudiant: StudentWithStatus, recherche: string): boolean {
    if (recherche.trim() === '') return true;

    const termeNormalise = recherche.toLowerCase().trim();
    const prenomNom = `${etudiant.firstName} ${etudiant.lastName}`.toLowerCase();
    const nomPrenom = `${etudiant.lastName} ${etudiant.firstName}`.toLowerCase();

    return prenomNom.includes(termeNormalise) || nomPrenom.includes(termeNormalise);
}

/** Vérifie si un étudiant correspond au filtre de présence sélectionné */
function correspondAuFiltre(etudiant: StudentWithStatus, filtre: FiltrePresence): boolean {
    switch (filtre) {
        case "tous":
            return true;
        case "presents":
            // Un étudiant en retard est considéré comme présent
            return isEtudiantPresent(etudiant.statut);
        case "absents":
            return !isEtudiantPresent(etudiant.statut);
    }
}

export default function ListeEtudiants({ sessionId, etudiants, onStudentsChange }: Readonly<ListeEtudiantsProps>) {
    const [students, setStudents] = useState<StudentWithStatus[]>(etudiants);
    const [pendingStudentMails, setPendingStudentMails] = useState<Set<string>>(new Set());
    const [recherche, setRecherche] = useState('');
    const [filtreActif, setFiltreActif] = useState<FiltrePresence>('tous');
    const [modeAffichage, setModeAffichage] = useState<ModeAffichage>('grille');

    useEffect(() => {
        setStudents(etudiants);
    }, [etudiants]);

    useEffect(() => {
        onStudentsChange?.(students);
    }, [students, onStudentsChange]);

    // Étudiants triés puis filtrés par recherche et par statut
    const etudiantsFiltres = useMemo(() => {
        return students
            .slice()
            .sort((a, b) => {
                const groupComparison = a.groupName.localeCompare(b.groupName, 'fr', { sensitivity: 'base' });
                if (groupComparison !== 0) return groupComparison;
                const lastNameComparison = a.lastName.localeCompare(b.lastName, 'fr', { sensitivity: 'base' });
                if (lastNameComparison !== 0) return lastNameComparison;
                return a.firstName.localeCompare(b.firstName, 'fr', { sensitivity: 'base' });
            })
            .filter((etudiant) =>
                correspondALaRecherche(etudiant, recherche) &&
                correspondAuFiltre(etudiant, filtreActif)
            );
    }, [students, recherche, filtreActif]);

    const { connectionState } = useAttendanceRealtime({
        sessionId,
        pendingStudentMails,
        onAttendanceEvent: (attendanceEvent) => {
            setStudents((previousStudents) => previousStudents.map((previousStudent) => {
                if (previousStudent.userMail !== attendanceEvent.studentMail) {
                    return previousStudent;
                }

                // Si l'étudiant a déjà un statut de retard défini par le professeur
                // et que l'événement indique « présent », on préserve le retard
                if (attendanceEvent.status === "present" && isEtudiantPresent(previousStudent.statut)) {
                    return previousStudent;
                }

                return {
                    ...previousStudent,
                    statut: attendanceEvent.status === "present"
                        ? StatutEtudiant.PRESENT
                        : StatutEtudiant["NON-SCANNE"]
                };
            }));
        }
    });

    useEffect(() => {
        if (connectionState === "connected" || connectionState === "connecting") {
            return;
        }

        const syncAttendanceStatus = async () => {
            try {
                const response = await fetch(`/api/teacher/attendance/status?sessionId=${encodeURIComponent(sessionId)}`, {
                    method: "GET",
                    cache: "no-store"
                });

                if (!response.ok) {
                    return;
                }

                const responseData = await response.json() as { presentStudentMails?: string[] };

                if (!Array.isArray(responseData.presentStudentMails)) {
                    return;
                }

                const presentStudentMails = new Set(responseData.presentStudentMails);
                setStudents((previousStudents) => (
                    applyPresenceSnapshot(previousStudents, pendingStudentMails, presentStudentMails)
                ));
            } catch {
                return;
            }
        };

        void syncAttendanceStatus();
        const intervalId = setInterval(() => {
            void syncAttendanceStatus();
        }, 3000);

        return () => {
            clearInterval(intervalId);
        };
    }, [connectionState, sessionId, pendingStudentMails]);

    async function handleStudentClick(student: StudentWithStatus) {
        if (pendingStudentMails.has(student.userMail)) {
            return;
        }

        const previousStudentStatus = student.statut;
        // Calcul du prochain statut dans le cycle
        const optimisticStudentStatus = getProchainStatut(previousStudentStatus);

        // Mise à jour optimiste
        setStudents((previousStudents) => previousStudents.map((previousStudent) => {
            if (previousStudent.userMail !== student.userMail) {
                return previousStudent;
            }

            return {
                ...previousStudent,
                statut: optimisticStudentStatus
            };
        }));

        setPendingStudentMails((previousPendingStudentMails) => {
            const nextPendingStudentMails = new Set(previousPendingStudentMails);
            nextPendingStudentMails.add(student.userMail);
            return nextPendingStudentMails;
        });

        try {
            const response = await fetch('/api/teacher/attendance/toggle', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId,
                    studentMail: student.userMail,
                    nextStatut: optimisticStudentStatus
                })
            });

            if (!response.ok) {
                throw new Error("Impossible de mettre à jour le statut de l'étudiant.");
            }

            const responseData = await response.json() as ToggleAttendanceResponse;

            // Confirmation du serveur : on applique le statut réel
            setStudents((previousStudents) => previousStudents.map((previousStudent) => {
                if (previousStudent.userMail !== student.userMail) {
                    return previousStudent;
                }

                return {
                    ...previousStudent,
                    statut: responseData.status
                };
            }));
        } catch (error) {
            console.error(error);

            // Rollback en cas d'erreur
            setStudents((previousStudents) => previousStudents.map((previousStudent) => {
                if (previousStudent.userMail !== student.userMail) {
                    return previousStudent;
                }

                return {
                    ...previousStudent,
                    statut: previousStudentStatus
                };
            }));
        } finally {
            setPendingStudentMails((previousPendingStudentMails) => {
                const nextPendingStudentMails = new Set(previousPendingStudentMails);
                nextPendingStudentMails.delete(student.userMail);
                return nextPendingStudentMails;
            });
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div id="barre-actions-etudiants">
                <BarreActions
                    recherche={recherche}
                    onRechercheChange={setRecherche}
                    filtreActif={filtreActif}
                    onFiltreChange={setFiltreActif}
                    modeAffichage={modeAffichage}
                    onModeAffichageChange={setModeAffichage}
                />
            </div>

            {modeAffichage === "grille" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {etudiantsFiltres.map((etudiant) => (
                        <EtudiantCard
                            key={etudiant.userMail}
                            etudiant={etudiant}
                            isDisabled={pendingStudentMails.has(etudiant.userMail)}
                            onClick={handleStudentClick}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {etudiantsFiltres.map((etudiant) => (
                        <EtudiantRow
                            key={etudiant.userMail}
                            etudiant={etudiant}
                            isDisabled={pendingStudentMails.has(etudiant.userMail)}
                            onClick={handleStudentClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
