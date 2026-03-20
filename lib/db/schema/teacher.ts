import * as lib from './lib'
import * as CourseTable from './course';

export const table = lib.pgTable('teacher', {
    ...lib.userAttributes
})

export const relations = lib.relations(table, ({many}) => ({
    courses: many(CourseTable.table)
}))

export type Select = typeof table.$inferSelect
export type Insert = typeof table.$inferInsert
