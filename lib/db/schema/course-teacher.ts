import * as lib from './lib';
import * as CourseTable from './course';
import * as TeacherTable from './teacher'

// Classe association entre un étudiant et un cours
export const table = lib.pgTable('course_teacher', {
    courseTeacherId: lib.serial("course_teacher_id").primaryKey(),
    courseId: lib.varchar("course_id", { length: 10 })
        .references(() => CourseTable.table.courseId).notNull(),
    teacherMail: lib.varchar("teacher_mail", { length: 60 }).notNull()
        .references(() => TeacherTable.table.userMail),
});

export const relations = lib.relations(table, ({many}) => ({
    teachers: many(TeacherTable.table),
    courses: many(TeacherTable.table)
}))

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
