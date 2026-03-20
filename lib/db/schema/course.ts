import * as lib from './lib';
import * as GroupTable from './group';
import * as TeacherTable from './teacher';
import * as AttendanceTable from './attendance';

export const table = lib.pgTable('course', {
    ...lib.baseAttributes,
    courseId: lib.varchar("course_id", { length: 10 }).primaryKey(),
    hours: lib.time("hours").notNull(),
    startAt: lib.timestamp("start_at").notNull(),
    endAt: lib.timestamp("end_at").notNull(),
    subject: lib.varchar("subject", { length: 50 }).notNull()
});

export const relations = lib.relations(table, ({many}) => ({
    groups: many(GroupTable.table),
    teachers: many(TeacherTable.table),
    attendances: many(AttendanceTable.table)
}))

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
