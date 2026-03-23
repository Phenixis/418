import CourseHeader from "@/components/cours/CourseHeader"
import CourseInfo from "@/components/cours/CourseInfo"
import ListeEtudiants from "@/components/cours/ListeEtudiants"
import { CourseStatus } from "@/components/cours/course.types"
import { fetchCoursActuel } from "@/lib/actions/cours-actuel"

// TODO : remplacer par le vrai courseId une fois la sélection de cours implémentée
const COURSE_ID_PLACEHOLDER = "123456789"

// Détermine le statut du cours selon les dates de début et de fin
function resolveCourseStatus(dateDebut: Date, dateFin: Date): CourseStatus {
    const now = new Date()
    if (now < dateDebut) return CourseStatus.A_VENIR
    if (now > dateFin)   return CourseStatus.TERMINE
    return CourseStatus.EN_COURS
}

// Formate un objet Date en "08h00"
function formatHeure(date: Date): string {
    const heures = date.getHours().toString().padStart(2, "0")
    const minutes = date.getMinutes().toString().padStart(2, "0")
    return `${heures}h${minutes}`
}

export default async function AppelPage() {
    const result = await fetchCoursActuel(COURSE_ID_PLACEHOLDER)

    // Affichage d'une erreur si les données sont inaccessibles
    if (!result.success) {
        return (
            <section className="container mx-auto flex flex-col py-10 gap-6">
                <p className="font-faded text-red">
                    Impossible de charger le cours : {result.error}
                </p>
            </section>
        )
    }

    const { data } = result
    const status = resolveCourseStatus(data.dateDebut, data.dateFin)

    return (
        <section className="container mx-auto flex flex-col py-10 gap-6">

            {/* En-tête : matière, statut et actions */}
            <CourseHeader
                code={data.code}
                matiere={data.matiere}
                status={status}
            />

            {/* Rectangle d'informations du cours */}
            <CourseInfo
                date={data.dateDebut}
                heureDebut={formatHeure(data.dateDebut)}
                heureFin={formatHeure(data.dateFin)}
                classe={data.classe}
                total={data.total}
                presents={data.presents}
                nonScannes={data.nonScannes}
            />

            {/* Liste des étudiants du cours */}
            <ListeEtudiants etudiants={data.etudiants} />

        </section>
    )
}
