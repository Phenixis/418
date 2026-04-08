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
    const [isInfoBlockSticky, setIsInfoBlockSticky] = useState(false);
    const stickySentinelRef = useRef<HTMLDivElement | null>(null);

    // Un étudiant en retard est considéré comme présent dans le décompte
    const presentsCount = useMemo(() => (
        students.filter((student) => isEtudiantPresent(student.statut)).length
    ), [students]);

    const totalStudents = students.length;
    const entPageUrl = (process.env.NEXT_PUBLIC_BASE_URL ?? '') + '/etudiant?cours_id=' + sessionId;

    useEffect(() => {
        let animationFrameId = 0;

        const updateStickyState = () => {
            const stickySentinelElement = stickySentinelRef.current;

            if (!stickySentinelElement) {
                return;
            }

            const isStickyActive = stickySentinelElement.getBoundingClientRect().top <= 0;

            setIsInfoBlockSticky((previousIsStickyActive) => (
                previousIsStickyActive === isStickyActive ? previousIsStickyActive : isStickyActive
            ));
        };

        const handleScroll = () => {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = requestAnimationFrame(updateStickyState);
        };

        updateStickyState();
        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    return (
        <>
            <div ref={stickySentinelRef} className="h-px" aria-hidden="true" />

            <div className={`sticky top-0 z-10 bg-background ${isInfoBlockSticky ? 'py-1' : 'py-2'} transition-[padding] duration-150`}>
                <CourseInfo
                    idCours={sessionId}
                    date={date}
                    heureDebut={heureDebut}
                    heureFin={heureFin}
                    classe={classe}
                    total={totalStudents}
                    presents={presentsCount}
                    nonScannes={totalStudents - presentsCount}
                    status={status}
                    showQrCode={false}
                    shouldHideScheduleFields={isInfoBlockSticky}
                />
            </div>

            {status === CourseStatus.EN_COURS && (
                <div className="mb-4 flex justify-center">
                    <QRCode codePin={entPageUrl} />
                </div>
            )}

            <ListeEtudiants
                sessionId={sessionId}
                etudiants={etudiants}
                onStudentsChange={setStudents}
            />
        </>
    );
}
