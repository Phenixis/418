import { courseTeacherQueries } from './course-teacher'
import * as lib from './lib'
import { QueryModel, QueryResult } from './model'

const courseTable = lib.Schema.CourseTable.table

type NewCourse = lib.Schema.CourseTable.Insert
type Course = lib.Schema.CourseTable.Select

class CourseQueries extends QueryModel<NewCourse, Course> {
    constructor() {
        super(courseTable)
    }

    async getByStringId(stringId: string): Promise<QueryResult<Course>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.courseId, stringId))

        if (lib.resultEmpty(result)) {
            return { error: "Cours introuvable avec cet ID." }
        }
        return { success: "Cours trouvé.", entity: result[0] as Course }
    }

    async getByTeacherMail(teacherMail: string): Promise<QueryResult<Course[]>> {
        const courseTeacherResult = await courseTeacherQueries.getByTeacherEmail(teacherMail)

        if ('error' in courseTeacherResult) {
            return courseTeacherResult
        }

        const courseIds = courseTeacherResult.entity.map(ct => ct.courseId)

        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.inArray(this.table.courseId, courseIds))

        if (lib.resultEmpty(result)) {
            return { error: "Aucun cours trouvé." }
        }

        return { success: "Cours trouvés pour le professeur.", entity: result as Course[] }
    }
}

export const courseQueries = new CourseQueries()
