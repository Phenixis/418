import { sessionGroupQueries } from './session-group'
import * as lib from './lib'
import { QueryModel, QueryResult, SuccessQueryResult } from './model'

const groupeTable = lib.Schema.GroupTable.table

type NewGroup = lib.Schema.GroupTable.Insert
type Group = lib.Schema.GroupTable.Select

export class GroupQueries extends QueryModel<NewGroup, Group> {
    constructor() {
        super(groupeTable)
    }

    async getByPromoTdTp(promo: string, td: string, tp: string): Promise<QueryResult<Group>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(
                lib.and(
                    lib.eq(this.table.promo, promo),
                    lib.eq(this.table.td, td),
                    lib.eq(this.table.tp, tp),
                    lib.isNull(this.table.deletedAt)
                )
            )

        if (lib.resultEmpty(result)) {
            return { error: "Groupe introuvable avec cette promotion/TD/TP." }
        }

        return { success: "Groupe trouvé.", entity: result[0] as Group }
    }

    async getById(id: number): Promise<QueryResult<Group>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(
                lib.and(
                    lib.eq(this.table.groupId, id),
                    lib.isNull(this.table.deletedAt)
                )
            )

        if (lib.resultEmpty(result)) {
            return { error: "Groupe introuvable avec cet ID." }
        }

        return { success: "Groupe trouvé.", entity: result[0] as Group }
    }

    async getByIds(ids: number[]): Promise<SuccessQueryResult<Group[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(
                lib.and(
                    lib.inArray(this.table.groupId, ids),
                    lib.isNull(this.table.deletedAt)
                )
            )

        return { success: "Groupes trouvés pour ces IDs.", entity: result as Group[] }
    }

    async getAll(): Promise<QueryResult<Group[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.isNull(this.table.deletedAt))

        if (lib.resultEmpty(result)) {
            return { error: "Aucun groupe trouvé." }
        }

        return { success: "Groupes trouvés.", entity: result as Group[] }
    }

    async getBySessionId(sessionId: string): Promise<QueryResult<Group[]>> {
        const groupsIds = await sessionGroupQueries.getBySessionId(sessionId)

        if ('error' in groupsIds) {
            return { error: "Aucun groupe trouve pour cette seance." }
        }

        const groupIdsArray = groupsIds.entity.map((cg) => cg.groupId)

        const result = await lib.db
            .select()
            .from(this.table)
            .where(
                lib.and(
                    lib.inArray(this.table.groupId, groupIdsArray),
                    lib.isNull(this.table.deletedAt)
                )
            )

        if (lib.resultEmpty(result)) {
            return { error: "Aucun groupe trouve pour cette seance." }
        }

        return { success: "Groupes trouves pour cette seance.", entity: result as Group[] }
    }

    async deleteByGroupId(groupId: number): Promise<QueryResult<Group>> {
        const result = await lib.db
            .update(this.table)
            .set({
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                lib.and(
                    lib.eq(this.table.groupId, groupId),
                    lib.isNull(this.table.deletedAt)
                )
            )
            .returning()

        if (lib.resultEmpty(result)) {
            return { error: "Groupe introuvable ou déjà supprimé." }
        }

        return { success: "Groupe supprimé.", entity: result[0] as Group }
    }

    async deleteByPromo(promo: string): Promise<QueryResult<Group[]>> {
        const result = await lib.db
            .update(this.table)
            .set({
                deletedAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                lib.and(
                    lib.eq(this.table.promo, promo),
                    lib.isNull(this.table.deletedAt)
                )
            )
            .returning()

        if (lib.resultEmpty(result)) {
            return { error: "Aucun groupe trouvé pour cette année." }
        }

        return { success: "Groupes de l'année supprimés.", entity: result as Group[] }
    }
}

export const groupQueries = new GroupQueries()
