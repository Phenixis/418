import * as lib from './lib';

export const course = lib.pgTable('course', {
    ...lib.baseAttributes,
    courseId: lib.varchar("course_id", { length: 10 }).primaryKey(),
    hours: lib.time("hours").notNull(),
    startAt: lib.timestamp("start_at").notNull(),
    endAt: lib.timestamp("end_at").notNull(),
    subject: lib.varchar("subject", { length: 50 }).notNull()
});

export const relations = lib.relations(course, () => ({}))

export type Select = typeof course.$inferSelect;
export type Insert = typeof course.$inferInsert;