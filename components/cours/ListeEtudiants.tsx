"use client";

import { useEffect, useMemo, useState } from 'react';
import EtudiantCard from '@/components/cours/EtudiantCard';
import BarreActions, { type FiltrePresence } from '@/components/cours/BarreActions';
import { StatutEtudiant } from '@/components/cours/course.types';
import { StudentWithStatus } from '@/lib/actions/cours-actuel';
import { useAttendanceRealtime } from '@/hooks/use-attendance-realtime';

interface ListeEtudiantsProps {
    courseId: string;
    etudiants: StudentWithStatus[];
    onStudentsChange?: (students: StudentWithStatus[]) => void;
}

type ToggleAttendanceResponse = {
    status: StatutEtudiant;
};

function applyPresenceSnapshot(
    previousStudents: StudentWithStatus[],
    pendingStudentMails: Set<string>,
    presentStudentMails: Set<string>
): StudentWithStatus[] {
    return previousStudents.map((previousStudent) => {
        if (pendingStudentMails.has(previousStudent.userMail)) {
            return previousStudent;
        }

        return {
            ...previousStudent,
            statut: presentStudentMails.has(previousStudent.userMail)
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
            return etudiant.statut === StatutEtudiant.PRESENT;
        case "absents":
            return etudiant.statut !== StatutEtudiant.PRESENT;
    }
}

export default function ListeEtudiants({ courseId, etudiants, onStudentsChange }: Readonly<ListeEtudiantsProps>) {
    const [students, setStudents] = useState<StudentWithStatus[]>(etudiants);
    const [pendingStudentMails, setPendingStudentMails] = useState<Set<string>>(new Set());
    const [recherche, setRecherche] = useState('');
    const [filtreActif, setFiltreActif] = useState<FiltrePresence>('tous');

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
        courseId,
        pendingStudentMails,
        onAttendanceEvent: (attendanceEvent) => {
            setStudents((previousStudents) => previousStudents.map((previousStudent) => {
                if (previousStudent.userMail !== attendanceEvent.studentMail) {
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
                const response = await fetch(`/api/teacher/attendance/status?courseId=${encodeURIComponent(courseId)}`, {
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
    }, [connectionState, courseId, pendingStudentMails]);

    async function handleStudentClick(student: StudentWithStatus) {
        if (pendingStudentMails.has(student.userMail)) {
            return;
        }

        const previousStudentStatus = student.statut;
        const optimisticStudentStatus = previousStudentStatus === StatutEtudiant.PRESENT
            ? StatutEtudiant["NON-SCANNE"]
            : StatutEtudiant.PRESENT;

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
                    courseId,
                    studentMail: student.userMail
                })
            });

            if (!response.ok) {
                throw new Error("Impossible de mettre à jour la présence de l'étudiant.");
            }

            const responseData = await response.json() as ToggleAttendanceResponse;

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
            <BarreActions
                recherche={recherche}
                onRechercheChange={setRecherche}
                filtreActif={filtreActif}
                onFiltreChange={setFiltreActif}
            />

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
        </div>
    );
}
