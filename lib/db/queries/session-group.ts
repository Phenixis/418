import { QueryModel, QueryResult, SuccessQueryResult } from './model';
import * as lib from './lib';

const sessionGroupTable = lib.Schema.SessionGroupTable.table;

type NewSessionGroup = lib.Schema.SessionGroupTable.Insert;
type SessionGroup = lib.Schema.SessionGroupTable.Select;

class SessionGroupQueries extends QueryModel<NewSessionGroup, SessionGroup> {
    constructor() {
        super(sessionGroupTable);
    }

    async getById(id: number): Promise<QueryResult<SessionGroup>> {
        const result = await lib.db.select().from(this.table).where(lib.eq(this.table.sessionGroupId, id));

        if (lib.resultEmpty(result)) {
            return { error: 'Lien Seance-Groupe introuvable avec cet ID.' };
        }

        return { success: 'Lien Seance-Groupe trouve.', entity: result[0] as SessionGroup };
    }

    async getBySessionId(sessionId: string): Promise<QueryResult<SessionGroup[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(lib.eq(this.table.sessionId, sessionId), lib.isNull(this.table.deletedAt)));

        if (lib.resultEmpty(result)) {
            return { error: 'Aucun groupe trouve pour cette seance.' };
        }

        return { success: 'Liens Seance-Groupe trouves.', entity: result as SessionGroup[] };
    }

    async getBySessionIds(sessionIds: string[]): Promise<SuccessQueryResult<SessionGroup[]>> {
        const result = await lib.db.select().from(this.table).where(lib.inArray(this.table.sessionId, sessionIds));

        return { success: 'Liens Seance-Groupe trouves.', entity: result as SessionGroup[] };
    }

    async deleteBySessionId(sessionId: string): Promise<QueryResult<SessionGroup[]>> {
        const result = await lib.db
            .update(this.table)
            .set({ deletedAt: new Date() })
            .where(lib.eq(this.table.sessionId, sessionId))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: 'Aucun lien Seance-Groupe trouve pour cette seance.' };
        }

        return { success: 'Liens Seance-Groupe supprimes pour la seance.', entity: result as SessionGroup[] };
    }

}

export const sessionGroupQueries = new SessionGroupQueries();
