import * as lib from './lib';
import * as TagTable from './tag';
import * as SessionTable from './session';

export const table = lib.pgTable('session_tag', {
    sessionTagId: lib.serial("session_tag_id").primaryKey(),
    sessionId: lib.varchar("session_id", { length: 36 }).notNull()
        .references(() => SessionTable.table.sessionId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    tagId: lib.integer("tag_id").notNull()
        .references(() => TagTable.table.tagId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    ...lib.baseAttributes
});

export const relations = lib.relations(table, ({ one }) => ({
    session: one(SessionTable.table, {
        fields: [table.sessionId],
        references: [SessionTable.table.sessionId],
    }),
    tag: one(TagTable.table, {
        fields: [table.tagId],
        references: [TagTable.table.tagId],
    }),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
