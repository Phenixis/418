"use client";

import { useMemo, useState } from "react";
import CourseInfo from "@/components/cours/CourseInfo";
import ListeEtudiants from "@/components/cours/ListeEtudiants";
import { CourseStatus, StatutEtudiant } from "@/components/cours/course.types";
import { StudentWithStatus } from "@/lib/actions/cours-actuel";

interface CourseLiveSectionProps {
    courseId: string;
    date: Date;
    heureDebut: string;
    heureFin: string;
    classe: string;
    status: CourseStatus;
    etudiants: StudentWithStatus[];
}

export default function CourseLiveSection({
    courseId,
    date,
    heureDebut,
    heureFin,
    classe,
    status,
    etudiants
}: Readonly<CourseLiveSectionProps>) {
    const [students, setStudents] = useState<StudentWithStatus[]>(etudiants);

    const presentsCount = useMemo(() => (
        students.filter((student) => student.statut === StatutEtudiant.PRESENT).length
    ), [students]);

    const totalStudents = students.length;

    return (
        <>
            <CourseInfo
                idCours={courseId}
                date={date}
                heureDebut={heureDebut}
                heureFin={heureFin}
                classe={classe}
                total={totalStudents}
                presents={presentsCount}
                nonScannes={totalStudents - presentsCount}
                status={status}
            />

            <ListeEtudiants
                courseId={courseId}
                etudiants={etudiants}
                onStudentsChange={setStudents}
            />
        </>
    );
}
