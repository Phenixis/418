import * as lib from './lib';
import * as ResourceTeacherTable from './resource-teacher';
import * as SessionTable from './session';

export const table = lib.pgTable('resource', {
    ...lib.baseAttributes,
    resourceId: lib.varchar('resource_id', { length: 36 }).primaryKey(),
    subject: lib.varchar('subject', { length: 50 }).notNull(),
    source: lib.varchar('source', { length: 10 }),
});

export const relations = lib.relations(table, ({ many }) => ({
    sessions: many(SessionTable.table),
    resourceTeachers: many(ResourceTeacherTable.table),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
