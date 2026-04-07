import CourseHeader from '@/components/cours/CourseHeader';
import CourseLiveSection from '@/components/cours/CourseLiveSection';
import { CourseStatus } from '@/components/cours/course.types';
import { fetchCoursActuel } from '@/lib/actions/cours-actuel';

function resolveCourseStatus(dateDebut: Date, dateFin: Date): CourseStatus {
    const now = new Date();
    if (now < dateDebut) return CourseStatus.A_VENIR;
    if (now > dateFin) return CourseStatus.TERMINE;
    return CourseStatus.EN_COURS;
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

    const { cours, groups, students } = result.data;
    const dateDebut = new Date(cours.startAt);
    const dateFin = new Date(cours.endAt);
    const classe = groups.map((group) => (group.promo || '') + (group.td || '') + (group.tp || '')).join(', ');
    const status = resolveCourseStatus(dateDebut, dateFin);

    return (
        <section className="flex flex-col py-10 gap-6">
            <CourseHeader cours={cours} groups={groups} status={status} />

            <CourseLiveSection
                sessionId={session_id}
                date={dateDebut}
                heureDebut={formatHeure(dateDebut)}
                heureFin={formatHeure(dateFin)}
                classe={classe}
                status={status}
                etudiants={students}
            />
        </section>
    );
}
