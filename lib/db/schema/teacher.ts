import * as lib from './lib'

export const table = lib.pgTable('teacher', {
    ...lib.userAttributes
})

export const relations = lib.relations(table, () => ({}))

export type Select = typeof table.$inferSelect
export type Insert = typeof table.$inferInsert
