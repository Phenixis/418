import { QueryModel, QueryResult, SuccessQueryResult } from './model';
import * as lib from './lib';

const tagTable = lib.Schema.TagTable.table;

type NewTag = lib.Schema.TagTable.Insert;
type Tag = lib.Schema.TagTable.Select;

class TagQueries extends QueryModel<NewTag, Tag> {
    constructor() {
        super(tagTable);
    }

    async getById(tagId: number): Promise<QueryResult<Tag>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(lib.eq(this.table.tagId, tagId), lib.isNull(this.table.deletedAt)));

        if (lib.resultEmpty(result)) {
            return { error: 'Tag introuvable avec cet ID.' };
        }

        return { success: 'Tag trouvé.', entity: result[0] as Tag };
    }

    async getByTeacherMail(teacherMail: string): Promise<SuccessQueryResult<Tag[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(lib.eq(this.table.teacherMail, teacherMail), lib.isNull(this.table.deletedAt)));

        return { success: 'Tags récupérés.', entity: result as Tag[] };
    }

    async updateById(tagId: number, data: { name?: string; color?: string | null }): Promise<QueryResult<Tag>> {
        const result = await lib.db
            .update(this.table)
            .set({ ...data, updatedAt: new Date() })
            .where(lib.and(lib.eq(this.table.tagId, tagId), lib.isNull(this.table.deletedAt)))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: 'Tag introuvable.' };
        }

        return { success: 'Tag modifié.', entity: result[0] as Tag };
    }

    async deleteById(tagId: number): Promise<QueryResult<Tag>> {
        const result = await lib.db
            .update(this.table)
            .set({ deletedAt: new Date() })
            .where(lib.and(lib.eq(this.table.tagId, tagId), lib.isNull(this.table.deletedAt)))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: 'Tag introuvable.' };
        }

        return { success: 'Tag supprimé.', entity: result[0] as Tag };
    }
}

export const tagQueries = new TagQueries();
