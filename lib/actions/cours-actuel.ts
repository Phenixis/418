'use server';

import { StatutEtudiant } from '@/components/cours/course.types';
import { attendanceQueries } from '@/lib/db/queries/attendance';
import { sessionQueries } from '@/lib/db/queries/session';
import { sessionGroupQueries } from '@/lib/db/queries/session-group';
import { groupQueries } from '@/lib/db/queries/group';
import { studentQueries } from '@/lib/db/queries/student';
import * as Schema from '@/lib/db/schema';

type Course = Schema.SessionTable.Select;
type Student = Schema.StudentTable.Select;
export type StudentWithStatus = Student & { groupName: string, statut: StatutEtudiant };
type Attendance = Schema.AttendanceTable.Select;
type CourseGroup = Schema.SessionGroupTable.Select;
type Group = Schema.GroupTable.Select;

export interface CoursActuelData {
    cours: Course;
    groups: Group[];
    students: StudentWithStatus[];
}

export async function fetchCoursActuel(
    sessionId: string
): Promise<{ success: true; data: CoursActuelData } | { success: false; error: string }> {
    // --- 1. Récupération du cours ---
    const courseResult = await sessionQueries.getByStringId(sessionId);
    if ('error' in courseResult) {
        return { success: false, error: courseResult.error };
    }
    const cours = courseResult.entity;

    // --- 2. Récupération du lien cours-groupe ---
    const courseGroupResult = await sessionGroupQueries.getBySessionId(sessionId);
    if ('error' in courseGroupResult) {
        return { success: false, error: courseGroupResult.error };
    }
    const groupIds = courseGroupResult.entity.map((coursGroup: CourseGroup) => coursGroup.groupId);

    // --- 3. Récupération du groupe (pour la promo/classe) ---
    const groupResult = await groupQueries.getByIds(groupIds);
    const groupes = groupResult.entity;

    // --- 4. Récupération des étudiants du groupe ---
    const studentsResult = await studentQueries.getByGroupIds(groupIds);
    if ('error' in studentsResult) {
        return { success: false, error: studentsResult.error };
    }
    const students = studentsResult.entity;

    // --- 5. Récupération des présences pour ce cours ---
    const attendanceResult = await attendanceQueries.getBySessionId(sessionId);
    const presentMails = new Set(attendanceResult.entity.map((a: Attendance) => a.studentMail));

    // --- Assemblage des étudiants avec leur statut ---
    const etudiants: StudentWithStatus[] = students.map((student: Student) => {
        const group = groupes.find(g => g.groupId === student.groupId);

        return {
            ...student,
            groupName: (group?.promo || '') + (group?.td || '') + (group?.tp || ''),
            statut: presentMails.has(student.userMail) ? StatutEtudiant.PRESENT : StatutEtudiant['NON-SCANNE']
        }
    });

    return {
        success: true,
        data: {
            cours,
            groups: groupes,
            students: etudiants
        }
    };
}
