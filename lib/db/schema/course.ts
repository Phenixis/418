import * as lib from './lib';
import * as index from './index';

const groupTable = index.GroupTable.table;
const teacherTable = index.TeacherTable.table
const attendanceTable = index.AttendanceTable.table

export const table = lib.pgTable('course', {
    ...lib.baseAttributes,
    courseId: lib.varchar("course_id", { length: 10 }).primaryKey(),
    hours: lib.time("hours").notNull(),
    startAt: lib.timestamp("start_at").notNull(),
    endAt: lib.timestamp("end_at").notNull(),
    subject: lib.varchar("subject", { length: 50 }).notNull()
});

export const relations = lib.relations(table, ({many}) => ({
    groups: many(groupTable),
    teachers: many(teacherTable),
    attendances: many(attendanceTable)
}))

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
