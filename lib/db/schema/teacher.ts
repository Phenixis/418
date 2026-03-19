import * as lib from './lib'

export const teacher = lib.pgTable('teacher', {
    ...lib.userAttributes
})

export const relations = lib.relations(teacher, () => ({}))

export type Select = typeof teacher.$inferSelect
export type Insert = typeof teacher.$inferInsert
