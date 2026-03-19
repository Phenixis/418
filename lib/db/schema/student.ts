import * as lib from './lib'

export const table = lib.pgTable('student', {
    ...lib.userAttributes,
    picture: lib.text("picture")
})

export const relations = lib.relations(table, () => ({}))

export type Select = typeof table.$inferSelect
export type Insert = typeof table.$inferInsert
