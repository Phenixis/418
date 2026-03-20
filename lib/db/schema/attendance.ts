import * as lib from './lib';
import * as CourseTable from './course';
import * as StudentTable from './student'

// Classe association entre un étudiant et un cours
export const table = lib.pgTable('attendance', {
    attendanceId: lib.serial("attendance_id").primaryKey(),
    hourDate: lib.timestamp("hour_date"),
    courseId: lib.varchar("course_id", { length: 10 })
        .references(() => CourseTable.table.courseId).notNull(),
    studentMail: lib.varchar("student_mail", { length: 60 }).notNull()
        .references(() => StudentTable.table.userMail),
});

export const relations = lib.relations(table, ({many}) => ({
    students: many(StudentTable.table),
    courses: many(StudentTable.table)
}))

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
