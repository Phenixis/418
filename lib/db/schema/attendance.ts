import * as lib from './lib';
import { CourseTable, StudentTable } from './index';

const studentTable = StudentTable.table
const courseTable = CourseTable.table

// Classe association entre un étudiant et un cours
export const table = lib.pgTable('attendance', {
    attendanceId: lib.serial("attendance_id").primaryKey(),
    hourDate: lib.timestamp("hour_date"),
    courseId: lib.varchar("course_id", { length: 10 })
        .references(() => courseTable.courseId).notNull(),
    studentMail: lib.varchar("student_mail", { length: 60 }).notNull()
        .references(() => studentTable.userMail),
});

export const relations = lib.relations(table, ({many}) => ({
    students: many(studentTable),
    courses: many(studentTable)
}))

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
