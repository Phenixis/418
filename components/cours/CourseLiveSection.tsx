"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import CourseInfo from "@/components/cours/CourseInfo";
import ListeEtudiants from "@/components/cours/ListeEtudiants";
import QRCode from "@/components/cours/QrCode";
import { CourseStatus } from "@/components/cours/course.types";
import { isEtudiantPresent } from "@/components/cours/course-utils";
import { StudentWithStatus } from "@/lib/actions/cours-actuel";

interface CourseLiveSectionProps {
    sessionId: string;
    date: Date;
    heureDebut: string;
    heureFin: string;
    classe: string;
    status: CourseStatus;
    etudiants: StudentWithStatus[];
}

export default function CourseLiveSection({
    sessionId,
    date,
    heureDebut,
    heureFin,
    classe,
    status,
    etudiants
}: Readonly<CourseLiveSectionProps>) {
    const [students, setStudents] = useState<StudentWithStatus[]>(etudiants);
    const stickySentinelRef = useRef<HTMLDivElement | null>(null);

    // Un étudiant en retard est considéré comme présent dans le décompte
    const presentsCount = useMemo(() => (
        students.filter((student) => isEtudiantPresent(student.statut)).length
    ), [students]);

    const totalStudents = students.length;
    const entPageUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? '') + '/etudiant?cours_id=' + sessionId;

    return (
        <>
            <div className={`py-2 flex flex-col md:flex-row items-center justify-between gap-4`}>
                <CourseInfo
                    date={date}
                    heureDebut={heureDebut}
                    heureFin={heureFin}
                    classe={classe}
                    total={totalStudents}
                    presents={presentsCount}
                    nonScannes={totalStudents - presentsCount}
                />
                {status === CourseStatus.EN_COURS && (
                    <QRCode codePin={entPageUrl} />
                )}
            </div>


            <ListeEtudiants
                sessionId={sessionId}
                etudiants={etudiants}
                onStudentsChange={setStudents}
            />
        </>
    );
}
