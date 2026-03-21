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

export const baseAttributes = {
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
}

export const userAttributes = {
    userMail: varchar("user_mail", { length: 60 }).primaryKey(),
    lastName: varchar("last_name", { length: 30 }).notNull(),
    firstName: varchar("first_name", { length: 30 }).notNull(),
    password: varchar("password", { length: 100 }).notNull(),
    isTeacher: boolean("is_teacher").default(false).notNull(),
    ...baseAttributes
}
