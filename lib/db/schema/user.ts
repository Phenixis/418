import * as lib from './lib';

export enum UserRoles {
    PROF = 'prof',
    ETUDIANT = 'etudiant'
}

export type UserRole = typeof UserRoles[keyof typeof UserRoles];

export const table = lib.pgTable('users', {
    id: lib.serial("id").primaryKey(),

    role: lib.varchar("role", { length: 50 }).default(UserRoles.ETUDIANT).notNull(),
    email: lib.varchar("email", { length: 100 }).notNull(),

    first_name: lib.varchar("first_name", { length: 100 }).notNull(),
    last_name: lib.varchar("last_name", { length: 100 }).notNull(),
    
    password: lib.varchar("password", { length: 100 }).notNull(),

    ...lib.baseAttributes
});

export const relations = lib.relations(table, () => ({}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;