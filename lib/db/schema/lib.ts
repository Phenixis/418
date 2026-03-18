export {
    pgTable,
    serial,
    char,
    varchar,
    text,
    timestamp,
    integer,
    boolean,
    real,
    index,
    jsonb,
} from 'drizzle-orm/pg-core';
export { relations, sql } from 'drizzle-orm';
import { timestamp } from 'drizzle-orm/pg-core';

export const baseAttributes = {
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
    deleted_at: timestamp("deleted_at"),
}