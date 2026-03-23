import { QueryModel } from './model'
import * as lib from './lib'

const courseTeacherTable = lib.Schema.CourseTeacherTable.table

type NewCourseTeacher = lib.Schema.CourseTeacherTable.Insert
type CourseTeacher = lib.Schema.CourseTeacherTable.Select

class CourseTeacherQueries extends QueryModel<NewCourseTeacher, CourseTeacher> {
    constructor() {
        super(courseTeacherTable)
    }

    async getById(id: number) {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.courseTeacherId, id))

        if (lib.resultEmpty(result)) {
            return { error: "Lien Cours-Professeur introuvable avec cet ID." }
        }

        return { success: "Lien Cours-Professeur trouvé.", entity: result[0] as CourseTeacher }
    }
}

export const courseTeacherQueries = new CourseTeacherQueries()
