import * as lib from './lib'
import * as index from './index';

const groupTable = index.GroupTable.table;

export const table = lib.pgTable('student', {
    ...lib.userAttributes,
    picture: lib.text("picture"),
    groupId: lib.integer("group_id").references(() => groupTable.groupId)
})

export const relations = lib.relations(table, ({one}) => ({
    group: one(groupTable, {
        fields: [table.groupId],
        references: [groupTable.groupId]
    })
}))

export type Select = typeof table.$inferSelect
export type Insert = typeof table.$inferInsert
