import * as lib from './lib';
import * as AttendanceTable from './attendance';
import * as ResourceTable from './resource';
import * as SessionGroupTable from './session-group';
import * as SessionTeacherTable from './session-teacher';

export const table = lib.pgTable('session', {
    ...lib.baseAttributes,
    sessionId: lib.varchar('session_id', { length: 36 }).primaryKey(),
    resourceId: lib
        .varchar('resource_id', { length: 36 })
        .references(() => ResourceTable.table.resourceId, { onDelete: 'cascade', onUpdate: 'cascade' })
        .notNull(),
    startAt: lib.timestamp('start_at').notNull(),
    endAt: lib.timestamp('end_at').notNull(),
    subject: lib.varchar('subject', { length: 50 }).notNull(),
    manualCallStartAt: lib.timestamp('manual_call_start_at'),
    manualCallEndAt: lib.timestamp('manual_call_end_at'),
    source: lib.varchar('source', { length: 10 }),
    adeUid: lib.varchar('ade_uid', { length: 255 }),
});

export const relations = lib.relations(table, ({ many, one }) => ({
    resource: one(ResourceTable.table, {
        fields: [table.resourceId],
        references: [ResourceTable.table.resourceId],
    }),
    attendances: many(AttendanceTable.table),
    sessionGroups: many(SessionGroupTable.table),
    sessionTeachers: many(SessionTeacherTable.table),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
