import { QueryModel, QueryResult } from './model'
import * as lib from './lib'
import { courseGroupQueries } from './course-group'
import { Select as CourseGroup } from '../schema/course-group'

const groupeTable = lib.Schema.GroupTable.table

type NewGroup = lib.Schema.GroupTable.Insert
type Group = lib.Schema.GroupTable.Select

class GroupQueries extends QueryModel<NewGroup, Group> {
    constructor() {
        super(groupeTable)
    }

    async getByPromoTdTp(promo: string, td: string, tp: string) {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(
                lib.and(
                    lib.eq(this.table.promo, promo),
                    lib.eq(this.table.td, td),
                    lib.eq(this.table.tp, tp)
                )
            )

        if (lib.resultEmpty(result)) {
            return { error: "Groupe introuvable avec cette promotion/TD/TP." }
        }

        return { success: "Groupe trouvé.", entity: result[0] as Group }
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

    async getByIds(ids: number[]): Promise<QueryResult> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.inArray(this.table.groupId, ids))

        return { success: "Groupes trouvés pour ces IDs.", entity: result as Group[] }
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

    async getByCourseId(courseId: string): Promise<QueryResult> {
        const groupsIds = await courseGroupQueries.getByCourseId(courseId)

        if ('error' in groupsIds) {
            return { error: "Aucun groupe trouvé pour ce cours." }
        }

        const groupIdsArray = groupsIds.entity.map((cg) => cg.groupId)

        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.inArray(this.table.groupId, groupIdsArray))

        if (lib.resultEmpty(result)) {
            return { error: "Aucun groupe trouvé pour ce cours." }
        }

        return { success: "Groupes trouvés pour ce cours.", entity: result as Group[] }
    }
}

export const groupQueries = new GroupQueries()
