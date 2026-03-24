import { QueryModel } from './model'
import * as lib from './lib'

const courseGroupTable = lib.Schema.CourseGroupTable.table

type NewCourseGroup = lib.Schema.CourseGroupTable.Insert
type CourseGroup = lib.Schema.CourseGroupTable.Select

class CourseGroupQueries extends QueryModel<NewCourseGroup, CourseGroup> {
    constructor() {
        super(courseGroupTable)
    }

    async getById(id: number) {
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
    async getByCourseId(courseId: string) {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.courseId, courseId))

        if (lib.resultEmpty(result)) {
            return { error: "Aucun groupe trouvé pour ce cours." }
        }

        return { success: "Lien Cours-Groupe trouvé.", entity: result as CourseGroup[] }
    }

    async getByCourseIds(courseIds: string[]) {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.inArray(this.table.courseId, courseIds))

        if (lib.resultEmpty(result)) {
            return { error: "Aucun groupe trouvé pour ces cours." }
        }

        return { success: "Liens Cours-Groupe trouvés.", entity: result as CourseGroup[] }
    }
}

export const courseGroupQueries = new CourseGroupQueries()
