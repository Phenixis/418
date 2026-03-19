import * as lib from './lib';

export const group = lib.pgTable('group', {
    ...lib.baseAttributes,
    promo: lib.char("promo", { length: 1 }).primaryKey(),
    td: lib.char("td", { length: 1 }).primaryKey(),
    tp: lib.char("tp", { length: 1 }).primaryKey(),
    department: lib.varchar("department", { length: 10 }).primaryKey(),
    codePath: lib.varchar("code_path", { length: 10 }).notNull(),
    descriptionPath: lib.varchar("description_path", { length: 50 }).notNull()
});

export const relations = lib.relations(group, () => ({}))

export type Select = typeof group.$inferSelect;
export type Insert = typeof group.$inferInsert;