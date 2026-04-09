import { QueryModel, QueryResult, SuccessQueryResult } from './model';
import * as lib from './lib';

const sessionTagTable = lib.Schema.SessionTagTable.table;
const tagTable = lib.Schema.TagTable.table;

type NewSessionTag = lib.Schema.SessionTagTable.Insert;
type SessionTag = lib.Schema.SessionTagTable.Select;
type Tag = lib.Schema.TagTable.Select;

class SessionTagQueries extends QueryModel<NewSessionTag, SessionTag> {
    constructor() {
        super(sessionTagTable);
    }

    async getBySessionId(sessionId: string): Promise<SuccessQueryResult<SessionTag[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(lib.eq(this.table.sessionId, sessionId), lib.isNull(this.table.deletedAt)));

        return { success: 'Liaisons séance-tag récupérées.', entity: result as SessionTag[] };
    }

    async getTagsBySession(sessionId: string): Promise<SuccessQueryResult<Tag[]>> {
        const result = await lib.db
            .select({ tag: tagTable })
            .from(this.table)
            .innerJoin(tagTable, lib.eq(this.table.tagId, tagTable.tagId))
            .where(lib.and(
                lib.eq(this.table.sessionId, sessionId),
                lib.isNull(this.table.deletedAt),
                lib.isNull(tagTable.deletedAt)
            ));

        return { success: 'Tags de la séance récupérés.', entity: result.map((r) => r.tag) as Tag[] };
    }

    async deleteBySessionId(sessionId: string): Promise<QueryResult<SessionTag[]>> {
        const result = await lib.db
            .update(this.table)
            .set({ deletedAt: new Date() })
            .where(lib.and(lib.eq(this.table.sessionId, sessionId), lib.isNull(this.table.deletedAt)))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: 'Aucune liaison séance-tag trouvée pour cette séance.' };
        }

        return { success: 'Liaisons séance-tag supprimées.', entity: result as SessionTag[] };
    }

    async deleteByTagId(tagId: number): Promise<SuccessQueryResult<SessionTag[]>> {
        const result = await lib.db
            .update(this.table)
            .set({ deletedAt: new Date() })
            .where(lib.and(lib.eq(this.table.tagId, tagId), lib.isNull(this.table.deletedAt)))
            .returning();

        return { success: 'Liaisons séance-tag supprimées pour ce tag.', entity: result as SessionTag[] };
    }
}

export const sessionTagQueries = new SessionTagQueries();
