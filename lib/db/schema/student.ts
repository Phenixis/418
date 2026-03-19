import * as lib from './lib'

export const student = lib.pgTable('student', {
    ...lib.userAttributes,
    picture: lib.text("picture")
})

export const relations = lib.relations(student, () => ({}))

export type Select = typeof student.$inferSelect
export type Insert = typeof student.$inferInsert
