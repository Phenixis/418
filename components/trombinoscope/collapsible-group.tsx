"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Select as Group } from "@/lib/db/schema/group";
import type { Select as Student } from "@/lib/db/schema/student";
import { useEffect, useState } from "react";
import EtudiantCard from "../etudiant/etudiant-card";
import EtudiantCardSkeleton from '../etudiant/etudiant-card-skeleton';
import Link from 'next/link';

export default function CollapsibleGroup({
    group,
}: Readonly<{
    group: Group;
}>) {
    const [open, setOpen] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(false);
    const [studentsError, setStudentsError] = useState<string | null>(null);
    const [hasFetchedStudents, setHasFetchedStudents] = useState<boolean>(false);

    useEffect(() => {
        const shouldFetchStudents = open && !hasFetchedStudents && !isLoadingStudents;

        if (!shouldFetchStudents) {
            return;
        }

        const loadStudents = async () => {
            setIsLoadingStudents(true);
            setStudentsError(null);

            try {
                const response = await fetch(`/api/teacher/students?groupId=${group.groupId}`);
                if (!response.ok) {
                    throw new Error(`Impossible de charger les étudiants du groupe ${group.td}${group.tp}.`);
                }

                const studentsData = (await response.json()) as Student[];
                setStudents(studentsData);
                setHasFetchedStudents(true);
            } catch (error) {
                const errorMessage = error instanceof Error
                    ? error.message
                    : "Une erreur inattendue est survenue pendant le chargement des étudiants.";

                setStudentsError(errorMessage);
            } finally {
                setIsLoadingStudents(false);
            }
        };

        void loadStudents();
    }, [group.groupId, group.td, group.tp, hasFetchedStudents, isLoadingStudents, open]);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="cursor-pointer flex w-full items-center gap-2 h3">
                {group.td}{group.tp}
            </CollapsibleTrigger>
            <CollapsibleContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2 md:gap-4">
                    {isLoadingStudents && (
                        <>
                            {Array.from({ length: 12 }, (_, index) => `skeleton-${index + 1}`).map((skeletonKey) => (
                                <EtudiantCardSkeleton key={skeletonKey} />
                            ))}
                        </>
                    )}
                    {studentsError && <p>{studentsError}</p>}
                    {students.slice().sort((a, b) => a.lastName.localeCompare(b.lastName)).map((student) => (
                        <Link key={student.userMail} href={`/professeur/etudiant/${student.userMail.split('@')[0]}`} className="no-underline">
                            <EtudiantCard key={student.userMail} etudiant={student} />
                        </Link>
                    ))}
                </div>
            </CollapsibleContent>
        </Collapsible>
    )
}