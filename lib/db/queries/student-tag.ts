import { QueryModel, QueryResult, SuccessQueryResult } from './model';
import * as lib from './lib';

const studentTagTable = lib.Schema.StudentTagTable.table;
const tagTable = lib.Schema.TagTable.table;
const studentTable = lib.Schema.StudentTable.table;

type NewStudentTag = lib.Schema.StudentTagTable.Insert;
type StudentTag = lib.Schema.StudentTagTable.Select;
type Tag = lib.Schema.TagTable.Select;
type Student = lib.Schema.StudentTable.Select;

class StudentTagQueries extends QueryModel<NewStudentTag, StudentTag> {
    constructor() {
        super(studentTagTable);
    }

    async getByTagId(tagId: number): Promise<SuccessQueryResult<StudentTag[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(lib.eq(this.table.tagId, tagId), lib.isNull(this.table.deletedAt)));

        return { success: 'Liaisons étudiant-tag récupérées.', entity: result as StudentTag[] };
    }

    async getStudentsByTag(tagId: number): Promise<SuccessQueryResult<Student[]>> {
        const result = await lib.db
            .select({ student: studentTable })
            .from(this.table)
            .innerJoin(studentTable, lib.eq(this.table.studentMail, studentTable.userMail))
            .where(lib.and(
                lib.eq(this.table.tagId, tagId),
                lib.isNull(this.table.deletedAt),
                lib.isNull(studentTable.deletedAt)
            ));

        return { success: 'Étudiants du tag récupérés.', entity: result.map((r) => r.student) as Student[] };
    }

    async getTagsByStudent(studentMail: string, teacherMail: string): Promise<SuccessQueryResult<Tag[]>> {
        const result = await lib.db
            .select({ tag: tagTable })
            .from(this.table)
            .innerJoin(tagTable, lib.eq(this.table.tagId, tagTable.tagId))
            .where(lib.and(
                lib.eq(this.table.studentMail, studentMail),
                lib.eq(tagTable.teacherMail, teacherMail),
                lib.isNull(this.table.deletedAt),
                lib.isNull(tagTable.deletedAt)
            ));

        return { success: 'Tags de l\'étudiant récupérés.', entity: result.map((r) => r.tag) as Tag[] };
    }

    async getTagsWithStudents(teacherMail: string): Promise<SuccessQueryResult<Array<{ tag: Tag; students: Student[] }>>> {
        const rows = await lib.db
            .select({ tag: tagTable, student: studentTable })
            .from(tagTable)
            .leftJoin(this.table, lib.and(
                lib.eq(this.table.tagId, tagTable.tagId),
                lib.isNull(this.table.deletedAt)
            ))
            .leftJoin(studentTable, lib.and(
                lib.eq(this.table.studentMail, studentTable.userMail),
                lib.isNull(studentTable.deletedAt)
            ))
            .where(lib.and(
                lib.eq(tagTable.teacherMail, teacherMail),
                lib.isNull(tagTable.deletedAt)
            ));

        const tagMap = new Map<number, { tag: Tag; students: Student[] }>();

        for (const row of rows) {
            const tagId = row.tag.tagId;
            if (!tagMap.has(tagId)) {
                tagMap.set(tagId, { tag: row.tag, students: [] });
            }
            if (row.student) {
                tagMap.get(tagId)!.students.push(row.student as Student);
            }
        }

        return { success: 'Tags avec étudiants récupérés.', entity: Array.from(tagMap.values()) };
    }

    async deleteByTagAndStudent(tagId: number, studentMail: string): Promise<QueryResult<StudentTag>> {
        const result = await lib.db
            .update(this.table)
            .set({ deletedAt: new Date() })
            .where(lib.and(
                lib.eq(this.table.tagId, tagId),
                lib.eq(this.table.studentMail, studentMail),
                lib.isNull(this.table.deletedAt)
            ))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: 'Liaison étudiant-tag introuvable.' };
        }

        return { success: 'Liaison étudiant-tag supprimée.', entity: result[0] as StudentTag };
    }

    async deleteByTagId(tagId: number): Promise<SuccessQueryResult<StudentTag[]>> {
        const result = await lib.db
            .update(this.table)
            .set({ deletedAt: new Date() })
            .where(lib.and(lib.eq(this.table.tagId, tagId), lib.isNull(this.table.deletedAt)))
            .returning();

        return { success: 'Liaisons étudiant-tag supprimées.', entity: result as StudentTag[] };
    }
}

export const studentTagQueries = new StudentTagQueries();
