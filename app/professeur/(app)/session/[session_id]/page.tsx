import SessionActionsClient from '@/components/cours/SessionActionsClient';
import CourseLiveSection from '@/components/cours/CourseLiveSection';
import { CourseStatus } from '@/components/cours/course.types';
import { fetchCoursActuel } from '@/lib/actions/cours-actuel';
import { demarrerAppel, terminerAppel } from '@/lib/actions/appel';

function resolveCourseStatus(dateDebut: Date, dateFin: Date): CourseStatus {
    const now = new Date();
    if (now < dateDebut) return CourseStatus.A_VENIR;
    if (now > dateFin) return CourseStatus.TERMINE;
    return CourseStatus.EN_COURS;
}

function resolveIsCallActive(
    manualCallStartAt: Date | null,
    manualCallEndAt: Date | null,
    startAt: Date,
    endAt: Date
): boolean {
    const now = new Date();
    const hasStarted = manualCallStartAt !== null || now >= startAt;
    const hasEnded = manualCallEndAt !== null || now > endAt;
    return hasStarted && !hasEnded;
}

function formatHeure(date: Date): string {
    const heures = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${heures}h${minutes}`;
}

export default async function SessionPage({ params }: Readonly<{ params: Promise<{ session_id: string }> }>) {
    const { session_id } = await params;

    const result = await fetchCoursActuel(session_id);

    if (!result.success) {
        return (
            <section className="container mx-auto flex flex-col py-10 gap-6">
                <p className="text-red">Impossible de charger la seance : {result.error}</p>
            </section>
        );
    }

    const { cours, groups, tags, students } = result.data;
    const dateDebut = new Date(cours.startAt);
    const dateFin = new Date(cours.endAt);

    const groupLabels = groups.map((group) => (group.promo || '') + (group.td || '') + (group.tp || ''));
    const tagLabels = tags.map((tag) => tag.name);
    const classe = [...groupLabels, ...tagLabels].join(', ');
    const status = resolveCourseStatus(dateDebut, dateFin);

    const isCallActive = resolveIsCallActive(
        cours.manualCallStartAt,
        cours.manualCallEndAt,
        dateDebut,
        dateFin
    );

    const showDemarrerButton = !isCallActive && status !== CourseStatus.TERMINE;
    const showTerminerButton = isCallActive;

    const demarrer = showDemarrerButton ? demarrerAppel.bind(null, session_id) : undefined;
    const terminer = showTerminerButton ? terminerAppel.bind(null, session_id) : undefined;

    return (
        <section className="flex flex-col gap-6">
            <SessionActionsClient
                cours={cours}
                groups={groups}
                status={status}
                onDemarrerAppel={demarrer}
                onTerminerAppel={terminer}
            />

            <CourseLiveSection
                sessionId={session_id}
                date={dateDebut}
                heureDebut={formatHeure(dateDebut)}
                heureFin={formatHeure(dateFin)}
                classe={classe}
                isCallActive={isCallActive}
                etudiants={students}
            />
        </section>
    );
}
