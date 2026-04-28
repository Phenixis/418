export { db } from "@/lib/db/drizzle"
export * as Schema from "@/lib/db/schema"
export { eq, and, asc, desc, isNull, isNotNull, gte, lte, sql, between, inArray, notInArray, not, or, count, max, min } from "drizzle-orm"
export { revalidatePath, revalidateTag } from "next/cache";
export { alias } from "drizzle-orm/pg-core"

/**
 * Returns `true` when a Drizzle query result is empty (null, undefined, or zero-length array).
 *
 * @param result - The raw result from a Drizzle ORM query.
 * @returns `true` when the result contains no rows.
 */
export function resultEmpty(result: any): boolean {
    return !result || result.length === 0;
}