'use server';

import { StatutEtudiant } from '@/components/cours/course.types';
import { attendanceQueries } from '@/lib/db/queries/attendance';
import { courseQueries } from '@/lib/db/queries/course';
import { courseGroupQueries } from '@/lib/db/queries/course-group';
import { groupQueries } from '@/lib/db/queries/group';
import { studentQueries } from '@/lib/db/queries/student';
import * as Schema from '@/lib/db/schema';

type Student = Schema.StudentTable.Select;
export type StudentWithStatus = Student & { groupName: string, statut: StatutEtudiant };
type Attendance = Schema.AttendanceTable.Select;
type CourseGroup = Schema.CourseGroupTable.Select;
type Group = Schema.GroupTable.Select;

export interface CoursActuelData {
    // Infos du cours
    code: string;
    matiere: string;
    dateDebut: Date;
    dateFin: Date;
    // Infos du groupe
    classe: string;
    // Statistiques de présence
    total: number;
    presents: number;
    nonScannes: number;
    // Liste des étudiants avec leur statut
    etudiants: StudentWithStatus[];
}

export async function fetchCoursActuel(
    courseId: string
): Promise<{ success: true; data: CoursActuelData } | { success: false; error: string }> {
    // --- 1. Récupération du cours ---
    const courseResult = await courseQueries.getByStringId(courseId);
    if ('error' in courseResult) {
        return { success: false, error: courseResult.error as string };
    }
    const cours = courseResult.entity;

    // --- 2. Récupération du lien cours-groupe ---
    const courseGroupResult = await courseGroupQueries.getByCourseId(courseId);
    if ('error' in courseGroupResult) {
        return { success: false, error: courseGroupResult.error as string };
    }
    const groupIds = courseGroupResult.entity.map((coursGroup: CourseGroup) => coursGroup.groupId);

    // --- 3. Récupération du groupe (pour la promo/classe) ---
    const groupResult = await groupQueries.getByIds(groupIds);
    if ('error' in groupResult) {
        return { success: false, error: groupResult.error };
    }
    const groupes = groupResult.entity as Group[];

    // --- 4. Récupération des étudiants du groupe ---
    const studentsResult = await studentQueries.getByGroupIds(groupIds);
    if ('error' in studentsResult) {
        return { success: false, error: studentsResult.error };
    }
    const students = studentsResult.entity;

    // --- 5. Récupération des présences pour ce cours ---
    const attendanceResult = await attendanceQueries.getByCourseId(courseId);
    // getByCourseId ne retourne jamais d'erreur, tableau vide = aucune présence
    const presentMails = new Set(attendanceResult.entity.map((a: Attendance) => a.studentMail));

    // --- Assemblage des étudiants avec leur statut ---
    const etudiants: StudentWithStatus[] = students.map((student: Student) => {
        const group = groupes.find(g => g.groupId === student.groupId);

        return {
            ...student,
            groupName: (group?.promo  || '') + (group?.td || '') + (group?.tp || ''),
            statut: presentMails.has(student.userMail) ? StatutEtudiant.PRESENT : StatutEtudiant.ABSENT
        }
    });

    const nombrePresents = etudiants.filter(e => e.statut === StatutEtudiant.PRESENT).length;

    return {
        success: true,
        data: {
            code: cours.courseId,
            matiere: cours.subject,
            dateDebut: new Date(cours.startAt),
            dateFin: new Date(cours.endAt),
            classe: groupes.map(g => g.promo + g.td + g.tp).join(', '),
            total: etudiants.length,
            presents: nombrePresents,
            nonScannes: etudiants.length - nombrePresents,
            etudiants
        }
    };
}
