import * as lib from './lib'
import * as CourseTable from './course';

export const table = lib.pgTable('teacher', {
    ...lib.userAttributes,
    isAdmin: lib.boolean('is_admin').notNull().default(false),
    isValidated: lib.boolean('is_validated').notNull().default(false)
})

export const relations = lib.relations(table, ({many}) => ({
    courses: many(CourseTable.table)
}))

export type Select = typeof table.$inferSelect
export type Insert = typeof table.$inferInsert
