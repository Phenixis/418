import { QueryModel, QueryResult, SuccessQueryResult } from './model'
import * as lib from './lib'

const courseGroupTable = lib.Schema.CourseGroupTable.table

type NewCourseGroup = lib.Schema.CourseGroupTable.Insert
type CourseGroup = lib.Schema.CourseGroupTable.Select

class CourseGroupQueries extends QueryModel<NewCourseGroup, CourseGroup> {
    constructor() {
        super(courseGroupTable)
    }

    async getById(id: number): Promise<QueryResult<CourseGroup>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.courseGroupId, id))

        if (lib.resultEmpty(result)) {
            return { error: "Lien Cours-Groupe introuvable avec cet ID." }
        }

        return { success: "Lien Cours-Groupe trouvé.", entity: result[0] as CourseGroup }
    }

    // Récupère le lien cours-groupe pour un cours donné
    async getByCourseId(courseId: string): Promise<QueryResult<CourseGroup[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(
                lib.eq(this.table.courseId, courseId),
                lib.isNull(this.table.deletedAt)
            ))

        if (lib.resultEmpty(result)) {
            return { error: "Aucun groupe trouvé pour ce cours." }
        }

        return { success: "Lien Cours-Groupe trouvé.", entity: result as CourseGroup[] }
    }

    async getByCourseIds(courseIds: string[]): Promise<SuccessQueryResult<CourseGroup[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.inArray(this.table.courseId, courseIds))

        return { success: "Liens Cours-Groupe trouvés.", entity: result as CourseGroup[] }
    }

    async deleteByCourseId(courseId: string): Promise<QueryResult<CourseGroup[]>> {
        const result = await lib.db
            .update(this.table)
            .set({ deletedAt: new Date() })
            .where(lib.eq(this.table.courseId, courseId))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: "Aucun lien Cours-Groupe trouvé pour ce cours." }
        }

        return { success: "Liens Cours-Groupe supprimés pour le cours.", entity: result as CourseGroup[] }
    }
}

export const courseGroupQueries = new CourseGroupQueries()
