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
            .set({ password: newPassword })
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

        if (lib.resultEmpty(result)) {
            return { error: "Aucun étudiant trouvé." }
        }

        return { success: "Étudiants trouvés.", entity: result as Student[] }
    }

    async getByGroupId(group: number): Promise<QueryResult<Student[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.groupId, group))

        if (lib.resultEmpty(result)) {
            return { error: "Aucun étudiant trouvé pour ce groupe." }
        }

        return { success: "Étudiants trouvés pour le groupe.", entity: result as Student[] }
    }

    async getByGroupIds(groups: number[]): Promise<QueryResult<Student[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.inArray(this.table.groupId, groups))

        if (lib.resultEmpty(result)) {
            return { error: "Aucun étudiant trouvé pour ces groupes." }
        }

        return { success: "Étudiants trouvés pour les groupes.", entity: result as Student[] }
    }
}

export const studentQueries = new StudentQueries()
