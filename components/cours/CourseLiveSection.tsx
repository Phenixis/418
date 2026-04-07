"use client";

import { useMemo, useState } from "react";
import CourseInfo from "@/components/cours/CourseInfo";
import ListeEtudiants from "@/components/cours/ListeEtudiants";
import { isEtudiantPresent } from "@/components/cours/course-utils";
import { StudentWithStatus } from "@/lib/actions/cours-actuel";

interface CourseLiveSectionProps {
    courseId: string;
    date: Date;
    heureDebut: string;
    heureFin: string;
    classe: string;
    etudiants: StudentWithStatus[];
    calledStartAt: Date | null;
    calledEndAt: Date | null;
}

export default function CourseLiveSection({
    courseId,
    date,
    heureDebut,
    heureFin,
    classe,
    etudiants,
    calledStartAt,
    calledEndAt,
}: Readonly<CourseLiveSectionProps>) {
    const [students, setStudents] = useState<StudentWithStatus[]>(etudiants);

    // Un étudiant en retard est considéré comme présent dans le décompte
    const presentsCount = useMemo(() => (
        students.filter((student) => isEtudiantPresent(student.statut)).length
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
                calledStartAt={calledStartAt}
                calledEndAt={calledEndAt}
            />

            <ListeEtudiants
                courseId={courseId}
                etudiants={etudiants}
                onStudentsChange={setStudents}
            />
        </>
    );
}
