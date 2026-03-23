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
}

export const courseGroupQueries = new CourseGroupQueries()
