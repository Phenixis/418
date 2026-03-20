import * as lib from './lib'
import * as GroupTable from './group';
import * as AttendanceTable from './attendance';

export const table = lib.pgTable('student', {
    ...lib.userAttributes,
    picture: lib.text("picture"),
    groupId: lib.integer("group_id").references(() => GroupTable.table.groupId)
})

export const relations = lib.relations(table, ({one, many}) => ({
    group: one(GroupTable.table, {
        fields: [table.groupId],
        references: [GroupTable.table.groupId]
    }),
    attendances: many(AttendanceTable.table)
}))

export type Select = typeof table.$inferSelect
export type Insert = typeof table.$inferInsert
