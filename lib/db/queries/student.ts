import { QueryModel, QueryResult } from './model'
import * as lib from './lib'

const studentTable = lib.Schema.StudentTable.table

type NewStudent = lib.Schema.StudentTable.Insert
type Student = lib.Schema.StudentTable.Select

class StudentQueries extends QueryModel<NewStudent, Student> {
    constructor() {
        super(studentTable)
    }

    async updatePassword(userMail: string, newPassword: string): Promise<QueryResult<string>> {
        const result = await lib.db
            .update(this.table)
            .set({ password: newPassword, updatedAt: new Date() })
            .where(lib.eq(this.table.userMail, userMail))
            .returning()

        if (lib.resultEmpty(result)) {
            return { error: "Étudiant introuvable avec cet email." }
        }

        return { success: "Mot de passe mis à jour.", entity: result[0].userMail }
    }

    async getByEmail(email: string): Promise<QueryResult<Student>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(
                lib.and(
                    lib.eq(this.table.userMail, email),
                    lib.isNull(this.table.deletedAt)
                )
            )

        if (lib.resultEmpty(result)) {
            return { error: "Étudiant introuvable avec cet email." }
        }

        return { success: "Étudiant trouvé.", entity: result[0] as Student }
    }

    async getByEmailIncludingDeleted(email: string): Promise<QueryResult<Student>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.userMail, email))

        if (lib.resultEmpty(result)) {
            return { error: "Étudiant introuvable avec cet email." }
        }

        return { success: "Étudiant trouvé.", entity: result[0] as Student }
    }

    async getAll(): Promise<QueryResult<Student[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.isNull(this.table.deletedAt))

        if (lib.resultEmpty(result)) {
            return { error: "Aucun étudiant trouvé." }
        }

        return { success: "Étudiants trouvés.", entity: result as Student[] }
    }

    async getByGroupId(group: number): Promise<QueryResult<Student[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(
                lib.and(
                    lib.eq(this.table.groupId, group),
                    lib.isNull(this.table.deletedAt)
                )
            )

        if (lib.resultEmpty(result)) {
            return { error: "Aucun étudiant trouvé pour ce groupe." }
        }

        return { success: "Étudiants trouvés pour le groupe.", entity: result as Student[] }
    }

    async getByGroupIds(groups: number[]): Promise<QueryResult<Student[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(
                lib.and(
                    lib.inArray(this.table.groupId, groups),
                    lib.isNull(this.table.deletedAt)
                )
            )

        if (lib.resultEmpty(result)) {
            return { error: "Aucun étudiant trouvé pour ces groupes." }
        }

        return { success: "Étudiants trouvés pour les groupes.", entity: result as Student[] }
    }

    async updateByEmail(studentEmail: string, data: Partial<NewStudent>): Promise<QueryResult<Student>> {
        const result = await lib.db
            .update(this.table)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(
                lib.and(
                    lib.eq(this.table.userMail, studentEmail),
                    lib.isNull(this.table.deletedAt)
                )
            )
            .returning()

        if (lib.resultEmpty(result)) {
            return { error: "Étudiant introuvable avec cet email." }
        }

        return { success: "Étudiant mis à jour.", entity: result[0] as Student }
    }

    async deleteByEmail(studentEmail: string): Promise<QueryResult<Student>> {
        const result = await lib.db
            .update(this.table)
            .set({
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                lib.and(
                    lib.eq(this.table.userMail, studentEmail),
                    lib.isNull(this.table.deletedAt)
                )
            )
            .returning()

        if (lib.resultEmpty(result)) {
            return { error: "Étudiant introuvable avec cet email." }
        }

        return { success: "Étudiant supprimé.", entity: result[0] as Student }
    }

    async moveToGroup(studentEmail: string, groupId: number | null): Promise<QueryResult<Student>> {
        const result = await lib.db
            .update(this.table)
            .set({
                groupId,
                updatedAt: new Date(),
            })
            .where(
                lib.and(
                    lib.eq(this.table.userMail, studentEmail),
                    lib.isNull(this.table.deletedAt)
                )
            )
            .returning()

        if (lib.resultEmpty(result)) {
            return { error: "Étudiant introuvable avec cet email." }
        }

        return { success: "Groupe de l'étudiant mis à jour.", entity: result[0] as Student }
    }

    async restoreByEmail(studentEmail: string, data: Partial<NewStudent>): Promise<QueryResult<Student>> {
        const result = await lib.db
            .update(this.table)
            .set({
                ...data,
                deletedAt: null,
                updatedAt: new Date(),
            })
            .where(lib.eq(this.table.userMail, studentEmail))
            .returning()

        if (lib.resultEmpty(result)) {
            return { error: "Étudiant introuvable avec cet email." }
        }

        return { success: "Étudiant restauré.", entity: result[0] as Student }
    }
}

export const studentQueries = new StudentQueries()
