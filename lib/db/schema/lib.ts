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
import { timestamp, varchar } from 'drizzle-orm/pg-core';

export const baseAttributes = {
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
    deleted_at: timestamp("deleted_at"),
}

export const userAttributes = {
    user_mail: varchar("user_mail", { length: 60 }).primaryKey(),
    last_name: varchar("last_name", { length: 30 }).notNull(),
    first_name: varchar("first_name", { length: 30 }).notNull(),
    password: varchar("password", { length: 100 }).notNull(),
    ...baseAttributes
}
