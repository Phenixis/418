import * as lib from './lib';

export const table = lib.pgTable('group', {
    ...lib.baseAttributes,
    groupId: lib.serial("groupId").primaryKey(),
    promo: lib.char("promo", { length: 1 }).notNull(),
    td: lib.char("td", { length: 1 }).notNull(),
    tp: lib.char("tp", { length: 1 }).notNull(),
    department: lib.varchar("department", { length: 10 }).notNull(),
    codePath: lib.varchar("code_path", { length: 10 }).notNull(),
    descriptionPath: lib.varchar("description_path", { length: 50 }).notNull()
});

export const relations = lib.relations(table, () => ({}))

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
