import * as lib from './lib';
import * as GroupTable from './group';
import * as SessionTable from './session';

export const table = lib.pgTable('session_group', {
    sessionGroupId: lib.serial('session_group_id').primaryKey(),
    sessionId: lib
        .varchar('session_id', { length: 36 })
        .references(() => SessionTable.table.sessionId, { onDelete: 'cascade', onUpdate: 'cascade' })
        .notNull(),
    groupId: lib
        .integer('group_id')
        .notNull()
        .references(() => GroupTable.table.groupId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    ...lib.baseAttributes,
});

export const relations = lib.relations(table, ({ one }) => ({
    session: one(SessionTable.table, {
        fields: [table.sessionId],
        references: [SessionTable.table.sessionId],
    }),
    group: one(GroupTable.table, {
        fields: [table.groupId],
        references: [GroupTable.table.groupId],
    }),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
