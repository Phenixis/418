"use client";

import { useEffect, useState } from 'react';
import EtudiantCard from '@/components/cours/EtudiantCard';
import { StatutEtudiant } from '@/components/cours/course.types';
import { StudentWithStatus } from '@/lib/actions/cours-actuel';

interface ListeEtudiantsProps {
    courseId: string;
    etudiants: StudentWithStatus[];
}

type ToggleAttendanceResponse = {
    status: StatutEtudiant;
};

export default function ListeEtudiants({ courseId, etudiants }: Readonly<ListeEtudiantsProps>) {
    const [students, setStudents] = useState<StudentWithStatus[]>(etudiants);
    const [pendingStudentMails, setPendingStudentMails] = useState<Set<string>>(new Set());

    useEffect(() => {
        setStudents(etudiants);
    }, [etudiants]);

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
                throw new Error('Impossible de mettre a jour la presence de l\'etudiant.');
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {students.slice()
            .sort((a, b) => {
                const groupComparison = a.groupName.localeCompare(b.groupName);
                if (groupComparison !== 0) return groupComparison;
                const lastNameComparison = a.lastName.localeCompare(b.lastName);
                if (lastNameComparison !== 0) return lastNameComparison;
                return a.firstName.localeCompare(b.firstName);
            })
            .map(etudiant => (
                <EtudiantCard
                    key={etudiant.userMail}
                    etudiant={etudiant}
                    isDisabled={pendingStudentMails.has(etudiant.userMail)}
                    onClick={handleStudentClick}
                />
            ))}
        </div>
    );
}
