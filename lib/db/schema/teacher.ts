import * as lib from './lib'
import * as ResourceTeacherTable from './resource-teacher';
import * as SessionTeacherTable from './session-teacher';

export const table = lib.pgTable('teacher', {
    ...lib.userAttributes,
    isAdmin: lib.boolean('is_admin').notNull().default(false),
    isValidated: lib.boolean('is_validated').notNull().default(false),
    isFirstConnection: lib.boolean('is_first_connection').notNull().default(false),
    icalUrl: lib.varchar('ical_url', { length: 500 }),
})

export const relations = lib.relations(table, ({ many }) => ({
    resourceTeachers: many(ResourceTeacherTable.table),
    sessionTeachers: many(SessionTeacherTable.table),
}));

export type Select = typeof table.$inferSelect
export type Insert = typeof table.$inferInsert
