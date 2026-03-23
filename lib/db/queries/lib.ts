export { db } from "@/lib/db/drizzle"
export * as Schema from "@/lib/db/schema"
export { eq, and, asc, desc, isNull, isNotNull, gte, lte, sql, between, inArray, notInArray, not, or, count, max, min } from "drizzle-orm"
export { revalidatePath, revalidateTag } from "next/cache";
export { alias } from "drizzle-orm/pg-core"

export function resultEmpty(result: any): boolean {
    return !result || result.length === 0;
}