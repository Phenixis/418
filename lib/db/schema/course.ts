import * as lib from './lib';
import * as AttendanceTable from './attendance';

export const table = lib.pgTable('course', {
    ...lib.baseAttributes,
    courseId: lib.varchar("course_id", { length: 36 }).primaryKey(),     // courseId est un UUID
    startAt: lib.timestamp("start_at").notNull(),
    endAt: lib.timestamp("end_at").notNull(),
    subject: lib.varchar("subject", { length: 50 }).notNull()
});

export const relations = lib.relations(table, ({many}) => ({
    attendances: many(AttendanceTable.table)
}))

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
