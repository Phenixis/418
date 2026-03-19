import * as lib from './lib'
import * as index from './index'

const courseTable = index.CourseTable.table

export const table = lib.pgTable('teacher', {
    ...lib.userAttributes
})

export const relations = lib.relations(table, ({many}) => ({
    courses: many(courseTable)
}))

export type Select = typeof table.$inferSelect
export type Insert = typeof table.$inferInsert
