import StudentCoursesSection from "@/components/cours/StudentCoursesSection";
import EtudiantPhoto from "@/components/etudiant/etudiant-photo";
import { studentQueries } from "@/lib/db/queries/student";
import { redirect } from "next/navigation";


export default async function EtudiantPage({ params }: Readonly<{ params: Promise<{ etudiant_mail: string }> }>) {
    const { etudiant_mail } = await params;

    if (!etudiant_mail) {
        console.log("Mail de l'étudiant non spécifié");
        redirect("/professeur/dashboard");
    }

    const etudiantResultQuery = await studentQueries.getByEmail(etudiant_mail + "@etudiant.univ-rennes.fr");

    if ("error" in etudiantResultQuery) {
        console.error(`Erreur lors de la récupération de l'étudiant avec le mail ${etudiant_mail}:`, etudiantResultQuery.error);
        redirect("/professeur/dashboard");
    }
    const etudiant = etudiantResultQuery.entity;

    return (
        <div className="space-y-4">
            <header className="flex items-center justify-start gap-2">
                <h1 className="h1">{etudiant.firstName} {etudiant.lastName}</h1>
                <h3 className="font-faded">{etudiant.userMail}</h3>
            </header>
            <div className="flex items-start justify-start gap-4">
                <EtudiantPhoto photoUrl={etudiant.picture} prenom={etudiant.firstName} nom={etudiant.lastName} className="max-w-1/5" />
            </div>
            <StudentCoursesSection studentMail={etudiant.userMail} />
        </div>
    );
}