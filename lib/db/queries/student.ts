import { QueryModel } from './model'
import * as lib from './lib'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'

const studentTable = lib.Schema.StudentTable.table

type NewStudent = InferInsertModel<typeof studentTable>
type Student = InferSelectModel<typeof studentTable>

class StudentQueries extends QueryModel<NewStudent, Student> {
    constructor() {
        super(studentTable)
    }

    async getByEmail(email: string) {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.userMail, email))

        if (lib.resultEmpty(result)) {
            return { error: "Étudiant introuvable avec cet email." }
        }

        return { success: "Étudiant trouvé.", entity: result[0] as Student }
    }
}

export const studentQueries = new StudentQueries()
