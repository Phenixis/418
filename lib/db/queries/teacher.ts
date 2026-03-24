import { QueryModel } from './model'
import * as lib from './lib'
import { getClientSession } from '@/lib/actions/authentication'

const teacherTable = lib.Schema.TeacherTable.table

type NewTeacher = lib.Schema.TeacherTable.Insert
type Teacher = lib.Schema.TeacherTable.Select

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

    async getTeacherEmailFromSession(): Promise<string | null> {
        const session = await getClientSession();

        if (!session) {
            return null;
        }

        if (new Date(session.expires) < new Date()) {
            return null;
        }

        return session.teacherEmail;
    }

    async getTeacher(id?: string): Promise<Teacher | null> {
        const teacherEmail = id || await this.getTeacherEmailFromSession();

        if (!teacherEmail) {
            return null
        }

        const user = await this.getByEmail(teacherEmail)

        if ("error" in user) {
            throw new Error(user.error)
        }

        return user.entity
    }
}

export const teacherQueries = new TeacherQueries()
