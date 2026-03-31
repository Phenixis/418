import { QueryModel, QueryResult } from './model'
import * as lib from './lib'

type Insert = lib.Schema.ResetPasswordSessionTable.Insert
type Select = lib.Schema.ResetPasswordSessionTable.Select

class ResetPasswordSessionQueries extends QueryModel<Insert, Select> {
    constructor() {
        super(lib.Schema.ResetPasswordSessionTable.table)
    }

    async getBySessionId(sessionId: string): Promise<QueryResult<Select>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.id, sessionId))

        if (lib.resultEmpty(result)) {
            return { error: "Session de réinitialisation introuvable avec cet ID." }
        }

        return { success: "Session de réinitialisation trouvée.", entity: result[0] as Select }
    }

    async getByTeacherMail(userMail: string): Promise<QueryResult<Select>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(
                lib.and(
                    lib.eq(this.table.userMailTeacher, userMail),
                    lib.gte(this.table.expiresAt, new Date())
                )
            )

        if (lib.resultEmpty(result)) {
            return { error: "Session de réinitialisation introuvable avec cet e-mail." }
        }

        return { success: "Session de réinitialisation trouvée.", entity: result[0] as Select }
    }

    async getByStudentMail(userMail: string): Promise<QueryResult<Select>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(
                lib.and(
                    lib.eq(this.table.userMailStudent, userMail),
                    lib.gte(this.table.expiresAt, new Date())
                )
            )

        if (lib.resultEmpty(result)) {
            return { error: "Session de réinitialisation introuvable avec cet e-mail." }
        }

        return { success: "Session de réinitialisation trouvée.", entity: result[0] as Select }
    }

    async markSessionAsUsed(sessionId: string): Promise<QueryResult<string>> {
        const result = await lib.db
            .update(this.table)
            .set({ expiresAt: new Date() })
            .where(lib.eq(this.table.id, sessionId))

        if (result.rowCount === 0) {
            return { error: "Aucune session de réinitialisation trouvée avec cet ID." }
        }

        return { success: "Session de réinitialisation marquée comme utilisée.", entity: sessionId }
    }
}

export const resetPasswordSessionQueries = new ResetPasswordSessionQueries()
