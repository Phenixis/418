import { QueryModel } from './model'
import * as lib from './lib'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'

const groupeTable = lib.Schema.GroupTable.table

type NewGroup = InferInsertModel<typeof groupeTable>
type Group = InferSelectModel<typeof groupeTable>

class GroupQueries extends QueryModel<NewGroup, Group> {
    constructor() {
        super(groupeTable)
    }

    async getById(id: number) {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.groupId, id))

        if (lib.resultEmpty(result)) {
            return { error: "Groupe introuvable avec cet ID." }
        }

        return { success: "Groupe trouvé.", entity: result[0] as Group }
    }
}

export const groupQueries = new GroupQueries()
