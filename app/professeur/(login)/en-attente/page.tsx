import { teacherQueries } from "@/lib/db/queries/teacher"
import { redirect } from "next/navigation"


export default async function EnAttentePage() {
    const teacher = await teacherQueries.getTeacher()

    if (teacher.isValidated) {
        redirect("/professeur/dashboard")
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4">
            <h1 className="h1">Compte en attente de validation</h1>
            <p>Votre compte est actuellement en attente de validation par un administrateur. Vous recevrez une notification par email une fois que votre compte aura été validé ou refusé.</p>
        </div>
    )
}