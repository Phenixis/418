import { sessionTeacherQueries } from './session-teacher';
import * as lib from './lib';
import { QueryModel, QueryResult } from './model';

const sessionTable = lib.Schema.SessionTable.table;

type NewSession = lib.Schema.SessionTable.Insert;
type Session = lib.Schema.SessionTable.Select;

class SessionQueries extends QueryModel<NewSession, Session> {
    constructor() {
        super(sessionTable);
    }

    async getByStringId(stringId: string): Promise<QueryResult<Session>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(lib.eq(this.table.sessionId, stringId), lib.isNull(this.table.deletedAt)));

        if (lib.resultEmpty(result)) {
            return { error: 'Seance introuvable avec cet ID.' };
        }

        return { success: 'Seance trouvee.', entity: result[0] as Session };
    }

    async getByResourceId(resourceId: string): Promise<QueryResult<Session[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(lib.eq(this.table.resourceId, resourceId), lib.isNull(this.table.deletedAt)));

        if (lib.resultEmpty(result)) {
            return { error: 'Aucune seance trouvee pour cette ressource.' };
        }

        return { success: 'Seances trouvees pour la ressource.', entity: result as Session[] };
    }

    async getByTeacherMail(teacherMail: string): Promise<QueryResult<Session[]>> {
        const sessionTeacherResult = await sessionTeacherQueries.getByTeacherEmail(teacherMail);

        if ('error' in sessionTeacherResult) {
            return sessionTeacherResult;
        }

        const sessionIds = sessionTeacherResult.entity.map((sessionTeacher) => sessionTeacher.sessionId);

        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(lib.inArray(this.table.sessionId, sessionIds), lib.isNull(this.table.deletedAt)));

        return { success: 'Seances trouvees pour le professeur.', entity: result as Session[] };
    }

    async update(stringId: string, data: Partial<NewSession>): Promise<QueryResult<Session>> {
        const result = await lib.db
            .update(this.table)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(lib.eq(this.table.sessionId, stringId))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: 'Echec de la mise a jour de la seance.' };
        }

        return { success: 'Seance mise a jour.', entity: result[0] as Session };
    }

    async deleteBySessionId(sessionId: string): Promise<QueryResult<Session>> {
        const result = await lib.db
            .update(this.table)
            .set({ deletedAt: new Date() })
            .where(lib.and(lib.eq(this.table.sessionId, sessionId), lib.isNull(this.table.deletedAt)))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: 'Seance introuvable ou deja supprimee.' };
        }

        return { success: 'Seance supprimee.', entity: result[0] as Session };
    }
}

export const sessionQueries = new SessionQueries();
