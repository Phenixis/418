import { getClientSession } from '@/lib/actions/authentication'
import { redirect } from 'next/navigation'
import * as lib from './lib'
import { QueryModel, QueryResult } from './model'

const teacherTable = lib.Schema.TeacherTable.table

type NewTeacher = lib.Schema.TeacherTable.Insert
type Teacher = lib.Schema.TeacherTable.Select

class TeacherQueries extends QueryModel<NewTeacher, Teacher> {
    constructor() {
        super(teacherTable)
    }

    async updatePassword(userMail: string, newPassword: string): Promise<QueryResult<string>> {
        const result = await lib.db
            .update(this.table)
            .set({ password: newPassword })
            .where(lib.eq(this.table.userMail, userMail))
            .returning()

        if (lib.resultEmpty(result)) {
            return { error: "Enseignant introuvable avec cet email." }
        }

        return { success: "Mot de passe mis à jour.", entity: result[0].userMail }
    }

    async getByEmail(email: string): Promise<QueryResult<Teacher>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.userMail, email))

        if (lib.resultEmpty(result)) {
            return { error: "Enseignant introuvable avec cet email." }
        }

        return { success: "Enseignant trouvé.", entity: result[0] as Teacher }
    }

    async validateTeacherByEmail(teacherEmail: string): Promise<QueryResult<Teacher>> {
        const result = await lib.db
            .update(this.table)
            .set({ isValidated: true })
            .where(lib.eq(this.table.userMail, teacherEmail))
            .returning()

        if (lib.resultEmpty(result)) {
            return { error: "Enseignant introuvable avec cet email." }
        }

        /* Email notification can be added here later. */

        return { success: "Enseignant validé.", entity: result[0] as Teacher }
    }

    async refuseTeacherByEmail(teacherEmail: string): Promise<QueryResult<Teacher>> {
        const result = await lib.db
            .delete(this.table)
            .where(lib.eq(this.table.userMail, teacherEmail))
            .returning()

        if (lib.resultEmpty(result)) {
            return { error: "Enseignant introuvable avec cet email." }
        }

        /* Email notification can be added here later. */

        return { success: "Enseignant refusé.", entity: result[0] as Teacher }
    }

    async saveIcalUrl(teacherMail: string, icalUrl: string): Promise<QueryResult<Teacher>> {
        const result = await lib.db
            .update(this.table)
            .set({ icalUrl, updatedAt: new Date() })
            .where(lib.eq(this.table.userMail, teacherMail))
            .returning()

        if (lib.resultEmpty(result)) {
            return { error: 'Enseignant introuvable avec cet email.' }
        }

        return { success: 'URL iCal enregistrée.', entity: result[0] as Teacher }
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

    async getTeacher(email?: string): Promise<Teacher> {
        const teacherEmail = email || await this.getTeacherEmailFromSession();

        if (!teacherEmail) {
            redirect('/professeur/connexion?clearSession=1')
        }

        const user = await this.getByEmail(teacherEmail)

        if ("error" in user) {
            redirect('/professeur/connexion?clearSession=1')
        }

        if (!user.entity.isValidated) {
            redirect('/professeur/en-attente')
        }

        return user.entity
    }

    async getAdmin(email?: string): Promise<Teacher> {
        const teacher = await this.getTeacher(email)

        if (!teacher.isAdmin) {
            redirect('/professeur/dashboard')
        }

        return teacher
    }
}

export const teacherQueries = new TeacherQueries()
