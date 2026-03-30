import { QueryModel, QueryResult } from './model'
import * as lib from './lib'

const courseTeacherTable = lib.Schema.CourseTeacherTable.table

type NewCourseTeacher = lib.Schema.CourseTeacherTable.Insert
type CourseTeacher = lib.Schema.CourseTeacherTable.Select

class CourseTeacherQueries extends QueryModel<NewCourseTeacher, CourseTeacher> {
    constructor() {
        super(courseTeacherTable)
    }

    async getById(id: number): Promise<QueryResult<CourseTeacher>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.courseTeacherId, id))

        if (lib.resultEmpty(result)) {
            return { error: "Lien Cours-Professeur introuvable avec cet ID." }
        }

        return { success: "Lien Cours-Professeur trouvé.", entity: result[0] as CourseTeacher }
    }

    async getByTeacherEmail(teacherEmail: string): Promise<QueryResult<CourseTeacher[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.teacherMail, teacherEmail))

        if (lib.resultEmpty(result)) {
            return { error: "Aucun cours trouvé." }
        }

        return { success: "Liens Cours-Professeur trouvés.", entity: result as CourseTeacher[] }
    }

    async getByCourseId(courseId: string): Promise<QueryResult<CourseTeacher[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.courseId, courseId))

        if (lib.resultEmpty(result)) {
            return { error: "Aucun lien Cours-Professeur trouvé pour cet ID de cours." }
        }

        return { success: "Liens Cours-Professeur trouvés.", entity: result as CourseTeacher[] }
    }
}

export const courseTeacherQueries = new CourseTeacherQueries()
