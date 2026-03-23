"use server"

import { courseQueries } from "@/lib/db/queries/course"
import { courseGroupQueries } from "@/lib/db/queries/course-group"
import { groupQueries } from "@/lib/db/queries/group"
import { studentQueries } from "@/lib/db/queries/student"
import { attendanceQueries } from "@/lib/db/queries/attendance"
import { StatutEtudiant } from "@/components/cours/course.types"
import { Etudiant } from "@/components/cours/EtudiantCard"
import * as Schema from "@/lib/db/schema"

type Student = Schema.StudentTable.Select
type Attendance = Schema.AttendanceTable.Select

export interface CoursActuelData {
    // Infos du cours
    code: string
    matiere: string
    dateDebut: Date
    dateFin: Date
    // Infos du groupe
    classe: string
    // Statistiques de présence
    total: number
    presents: number
    nonScannes: number
    // Liste des étudiants avec leur statut
    etudiants: Etudiant[]
}

export async function fetchCoursActuel(courseId: string): Promise<
    { success: true; data: CoursActuelData } |
    { success: false; error: string }
> {
    // --- 1. Récupération du cours ---
    const courseResult = await courseQueries.getByStringId(courseId)
    if ("error" in courseResult) {
        return { success: false, error: courseResult.error as string }
    }
    const cours = courseResult.entity

    // --- 2. Récupération du lien cours-groupe ---
    const courseGroupResult = await courseGroupQueries.getByCourseId(courseId)
    if ("error" in courseGroupResult) {
        return { success: false, error: courseGroupResult.error as string }
    }
    const groupId = courseGroupResult.entity.groupId

    // --- 3. Récupération du groupe (pour la promo/classe) ---
    const groupResult = await groupQueries.getById(groupId)
    if ("error" in groupResult) {
        return { success: false, error: groupResult.error as string }
    }
    const groupe = groupResult.entity

    // --- 4. Récupération des étudiants du groupe ---
    const studentsResult = await studentQueries.getByGroup(groupId)
    if ("error" in studentsResult) {
        return { success: false, error: studentsResult.error as string }
    }
    const students = studentsResult.entity

    // --- 5. Récupération des présences pour ce cours ---
    const attendanceResult = await attendanceQueries.getByCourseId(courseId)
    // getByCourseId ne retourne jamais d'erreur, tableau vide = aucune présence
    const presentMails = new Set(
        attendanceResult.entity.map((a: Attendance) => a.studentMail)
    )

    // --- Assemblage des étudiants avec leur statut ---
    const etudiants: Etudiant[] = students.map((student: Student) => ({
        id: student.userMail,
        prenom: student.firstName ?? "",
        nom: student.lastName ?? "",
        photoUrl: student.picture ?? null,
        statut: presentMails.has(student.userMail)
            ? StatutEtudiant.PRESENT
            : StatutEtudiant.ABSENT,
    }))

    const nombrePresents = etudiants.filter(e => e.statut === StatutEtudiant.PRESENT).length

    return {
        success: true,
        data: {
            code: cours.courseId,
            matiere: cours.subject,
            dateDebut: new Date(cours.startAt),
            dateFin: new Date(cours.endAt),
            classe: `${groupe.promo}${groupe.td}`,
            total: etudiants.length,
            presents: nombrePresents,
            nonScannes: etudiants.length - nombrePresents,
            etudiants,
        }
    }
}
