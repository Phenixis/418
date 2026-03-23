import { QueryModel, QueryResult } from './model'
import * as lib from './lib'

const groupeTable = lib.Schema.GroupTable.table

type NewGroup = lib.Schema.GroupTable.Insert
type Group = lib.Schema.GroupTable.Select

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

    async getAll(): Promise<QueryResult> {
        const result = await lib.db
            .select()
            .from(this.table)

        if (lib.resultEmpty(result)) {
            return { error: "Aucun groupe trouvé." }
        }

        return { success: "Groupes trouvés.", entity: result as Group[] }
    }
}

export const groupQueries = new GroupQueries()
