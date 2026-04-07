import CourseActionsClient from '@/components/cours/CourseActionsClient';
import CourseLiveSection from '@/components/cours/CourseLiveSection';
import { CourseStatus } from '@/components/cours/course.types';
import { fetchCoursActuel } from '@/lib/actions/cours-actuel';

// Détermine le statut du cours selon les dates de début et de fin
function resolveCourseStatus(dateDebut: Date, dateFin: Date): CourseStatus {
    const now = new Date();
    if (now < dateDebut) return CourseStatus.A_VENIR;
    if (now > dateFin) return CourseStatus.TERMINE;
    return CourseStatus.EN_COURS;
}

// Formate un objet Date en "08h00"
function formatHeure(date: Date): string {
    const heures = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${heures}h${minutes}`;
}

export default async function AppelPage({ params }: Readonly<{ params: Promise<{ cours_id: string }> }>) {
    const { cours_id } = await params;

    const result = await fetchCoursActuel(cours_id);

    // Affichage d'une erreur si les données sont inaccessibles
    if (!result.success) {
        return (
            <section className="container mx-auto flex flex-col py-10 gap-6">
                <p className="text-red">Impossible de charger le cours : {result.error}</p>
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
            {/* En-tête : matière, statut et actions */}
            <CourseActionsClient cours={cours} groups={groups} status={status} />

            <CourseLiveSection
                courseId={cours_id}
                date={dateDebut}
                heureDebut={formatHeure(dateDebut)}
                heureFin={formatHeure(dateFin)}
                classe={classe}
                etudiants={students}
                calledStartAt={cours.calledStartAt}
                calledEndAt={cours.calledEndAt}
            />
        </section>
    );
}
