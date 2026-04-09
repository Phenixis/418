'use server';

import { StatutEtudiant } from '@/components/cours/course.types';
import { attendanceQueries } from '@/lib/db/queries/attendance';
import { sessionQueries } from '@/lib/db/queries/session';
import { sessionGroupQueries } from '@/lib/db/queries/session-group';
import { sessionTagQueries } from '@/lib/db/queries/session-tag';
import { studentTagQueries } from '@/lib/db/queries/student-tag';
import { tagQueries } from '@/lib/db/queries/tag';
import { groupQueries } from '@/lib/db/queries/group';
import { studentQueries } from '@/lib/db/queries/student';
import * as Schema from '@/lib/db/schema';

type Course = Schema.SessionTable.Select;
type Student = Schema.StudentTable.Select;
export type StudentWithStatus = Student & { groupName: string, statut: StatutEtudiant };
type Attendance = Schema.AttendanceTable.Select;
type CourseGroup = Schema.SessionGroupTable.Select;
type Group = Schema.GroupTable.Select;
type Tag = Schema.TagTable.Select;

export interface CoursActuelData {
    cours: Course;
    groups: Group[];
    tags: Tag[];
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

    // --- 2. Récupération des groupes (optionnel) ---
    const courseGroupResult = await sessionGroupQueries.getBySessionId(sessionId);
    const groupIds = 'error' in courseGroupResult
        ? []
        : courseGroupResult.entity.map((coursGroup: CourseGroup) => coursGroup.groupId);

    // --- 3. Récupération des groupes et de leurs étudiants ---
    const groupes: Group[] = groupIds.length > 0 ? (await groupQueries.getByIds(groupIds)).entity : [];

    const groupStudentsResult = groupIds.length > 0
        ? await studentQueries.getByGroupIds(groupIds)
        : null;
    const studentsFromGroups: Student[] = groupStudentsResult && !('error' in groupStudentsResult)
        ? groupStudentsResult.entity
        : [];

    // --- 4. Récupération des tags et des étudiants via tags ---
    const sessionTagsResult = await sessionTagQueries.getBySessionId(sessionId);
    const tagIds = sessionTagsResult.entity.map((st) => st.tagId);

    const [tagsData, studentsFromTagsArrays] = await Promise.all([
        tagIds.length > 0
            ? Promise.all(tagIds.map((tagId) => tagQueries.getById(tagId)))
            : Promise.resolve([]),
        Promise.all(tagIds.map((tagId) => studentTagQueries.getStudentsByTag(tagId))),
    ]);

    const tags: Tag[] = tagsData.flatMap((r) => ('error' in r ? [] : [r.entity]));
    const studentsFromTags: Student[] = studentsFromTagsArrays.flatMap((r) => r.entity);

    // --- 5. Fusion et déduplication des étudiants ---
    const studentsByMail = new Map<string, Student>();
    for (const student of [...studentsFromGroups, ...studentsFromTags]) {
        studentsByMail.set(student.userMail, student);
    }
    const students = Array.from(studentsByMail.values());

    // --- 6. Récupération des présences pour ce cours ---
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
            tags,
            students: etudiants
        }
    };
}

