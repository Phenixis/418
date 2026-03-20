import { QueryModel } from './model'
import * as lib from './lib'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'

const teacherTable = lib.Schema.TeacherTable.table

type NewTeacher = InferInsertModel<typeof teacherTable>
type Teacher = InferSelectModel<typeof teacherTable>

class TeacherQueries extends QueryModel<NewTeacher, Teacher> {
    constructor() {
        super(teacherTable)
    }

    async getByEmail(email: string) {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.userMail, email))

        if (lib.resultEmpty(result)) {
            return { error: "Enseignant introuvable avec cet email." }
        }

        return { success: "Enseignant trouvé.", entity: result[0] as Teacher }
    }
}

export const teacherQueries = new TeacherQueries()
