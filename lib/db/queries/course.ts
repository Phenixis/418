import { QueryModel } from './model'
import * as lib from './lib'

const courseTable = lib.Schema.CourseTable.table

type NewCourse = lib.Schema.CourseTable.Insert
type Course = lib.Schema.CourseTable.Select

class CourseQueries extends QueryModel<NewCourse, Course> {
    constructor() {
        super(courseTable)
    }

    async getByStringId(stringId: string) {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.courseId, stringId))
        if (lib.resultEmpty(result)) {
            return { error: "Cours introuvable avec cet ID." }
        }
        return { success: "Cours trouvé.", entity: result[0] as Course }
    }
}

export const courseQueries = new CourseQueries()
