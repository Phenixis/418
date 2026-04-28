import { QueryModel, QueryResult } from './model';
import * as lib from './lib';

const sessionTeacherTable = lib.Schema.SessionTeacherTable.table;

type NewSessionTeacher = lib.Schema.SessionTeacherTable.Insert;
type SessionTeacher = lib.Schema.SessionTeacherTable.Select;

export class SessionTeacherQueries extends QueryModel<NewSessionTeacher, SessionTeacher> {
    constructor() {
        super(sessionTeacherTable);
    }

    async getById(id: number): Promise<QueryResult<SessionTeacher>> {
        const result = await lib.db.select().from(this.table).where(lib.eq(this.table.sessionTeacherId, id));

        if (lib.resultEmpty(result)) {
            return { error: 'Lien Seance-Professeur introuvable avec cet ID.' };
        }

        return { success: 'Lien Seance-Professeur trouve.', entity: result[0] as SessionTeacher };
    }

    async getByTeacherEmail(teacherEmail: string): Promise<QueryResult<SessionTeacher[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(lib.eq(this.table.teacherMail, teacherEmail), lib.isNull(this.table.deletedAt)));

        if (lib.resultEmpty(result)) {
            return { error: 'Aucune seance trouvee.' };
        }

        return { success: 'Liens Seance-Professeur trouves.', entity: result as SessionTeacher[] };
    }

    async getBySessionId(sessionId: string): Promise<QueryResult<SessionTeacher[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(lib.eq(this.table.sessionId, sessionId), lib.isNull(this.table.deletedAt)));

        if (lib.resultEmpty(result)) {
            return { error: 'Aucun lien Seance-Professeur trouve pour cet ID de seance.' };
        }

        return { success: 'Liens Seance-Professeur trouves.', entity: result as SessionTeacher[] };
    }

    async deleteBySessionId(sessionId: string): Promise<QueryResult<SessionTeacher[]>> {
        const result = await lib.db
            .update(this.table)
            .set({ deletedAt: new Date() })
            .where(lib.eq(this.table.sessionId, sessionId))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: 'Aucun lien Seance-Professeur trouve pour cette seance.' };
        }

        return { success: 'Liens Seance-Professeur supprimes avec succes.', entity: result as SessionTeacher[] };
    }
}

export const sessionTeacherQueries = new SessionTeacherQueries();
