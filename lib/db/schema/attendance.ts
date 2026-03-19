import * as lib from './lib';
import { CourseTable, StudentTable } from './index';

// Classe association entre un étudiant et un cours
export const table = lib.pgTable('attendance', {
    attendanceId: lib.serial("attendance_id").primaryKey(),
    courseId: lib.varchar("course_id", { length: 10 })
        .references(() => CourseTable.table.courseId).notNull(),
    studentMail: lib.varchar("student_mail", { length: 60 }).notNull()
        .references(() => StudentTable.table.user_mail),
});

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;