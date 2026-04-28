export {
    pgTable,
    pgView,
    serial,
    char,
    varchar,
    text,
    timestamp,
    date,
    time,
    integer,
    boolean,
    real,
    index,
    jsonb,
} from 'drizzle-orm/pg-core';
export { relations, sql } from 'drizzle-orm';
import { timestamp, varchar, boolean } from 'drizzle-orm/pg-core';

/**
 * Shared timestamp columns included on every table.
 *
 * `deletedAt` is used for soft deletes — a non-null value means the row is
 * logically deleted and should be excluded from normal queries.
 */
export const baseAttributes = {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
}

/**
 * Shared columns for user tables (teacher and student).
 *
 * Extends {@link baseAttributes} with identity, credential, and role fields.
 * The `userMail` column is the primary key for all user records.
 */
export const userAttributes = {
    userMail: varchar("user_mail", { length: 60 }).primaryKey(),
    lastName: varchar("last_name", { length: 30 }).notNull(),
    firstName: varchar("first_name", { length: 30 }).notNull(),
    password: varchar("password", { length: 100 }),
    isTeacher: boolean("is_teacher").default(false).notNull(),
    ...baseAttributes
}
