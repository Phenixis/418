import { PgTableWithColumns } from "drizzle-orm/pg-core";
import * as lib from "./lib";

/**
 * Discriminated union returned by all database query helpers.
 *
 * Narrow on the `success` or `error` discriminant before accessing `entity`.
 *
 * @typeParam T - Type of the `entity` payload on success.
 */
export type QueryResult<T> = SuccessQueryResult<T> | ErrorQueryResult;

/**
 * Successful query result wrapping the returned entity or entities.
 *
 * @typeParam T - Shape of the returned value.
 */
export type SuccessQueryResult<T> = { success: string; entity: T };

/** Failed query result carrying a human-readable error message. */
export type ErrorQueryResult = { error: string };

/**
 * Generic base class providing common CRUD operations backed by Drizzle ORM.
 *
 * Concrete query modules extend this class with table-specific methods while
 * inheriting generic create/read/delete helpers. All mutations use soft deletes
 * (setting `deletedAt`) unless explicitly calling {@link hardDelete}.
 *
 * @typeParam NewEntityModel - Shape of the data object required for insertion.
 * @typeParam ExistingEntityModel - Shape of the entity as stored in the database.
 */
export class QueryModel<NewEntityModel extends { [x: string]: any; }, ExistingEntityModel extends { [x: string]: any; }> {
    table: PgTableWithColumns<any>;

    constructor(table: PgTableWithColumns<any>) {
        this.table = table;
    }

    /**
     * Inserts a new entity row and returns the created record.
     *
     * @param data - The data object to insert.
     * @returns The created entity, or an error result when the insert returns nothing.
     */
    async create(data: NewEntityModel): Promise<QueryResult<ExistingEntityModel>> {
        const result = await lib.db
            .insert(this.table)
            .values(data)
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: "Failed to create." };
        }

        return { success: "Created successfully.", entity: result[0] as ExistingEntityModel };
    }

    /**
     * Fetches all rows from the table, including soft-deleted ones.
     *
     * @returns All entity records in an array.
     */
    async getAll(): Promise<QueryResult<ExistingEntityModel[]>> {
        const result = await lib.db
            .select()
            .from(this.table)

        return { success: "Data trouvées.", entity: result as ExistingEntityModel[] }
    }

    /**
     * Soft-deletes a single entity by numeric primary key.
     *
     * Sets `deletedAt` to the current timestamp; the row is not physically removed.
     *
     * @param id - Numeric primary key of the entity to soft-delete.
     * @returns The updated entity, or an error result when no row is found.
     */
    async delete(id: number): Promise<QueryResult<ExistingEntityModel>> {
        const result = await lib.db
            .update(this.table)
            .set({ deletedAt: new Date() })
            .where(lib.eq(this.table.id, id))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: "Failed to delete." };
        }

        return { success: "Deleted successfully.", entity: result[0] as ExistingEntityModel };
    }

    /**
     * Soft-deletes all rows in the table.
     *
     * Requires passing `true` as `confirm` to prevent accidental bulk deletion.
     *
     * @param confirm - Must be `true` to proceed; returns an error result otherwise.
     * @returns All updated entity records, or an error result when not confirmed.
     */
    async deleteAll(confirm?: boolean): Promise<QueryResult<ExistingEntityModel[]>> {
        if (!confirm) {
            return { error: "Are you really sure you want to delete all entities? Pass 'true' as the confirm parameter to proceed." };
        }

        const result = await lib.db
            .update(this.table)
            .set({ deletedAt: new Date() })
            .returning();

        return { success: "All entities deleted successfully.", entity: result as ExistingEntityModel[] };
    }

    /**
     * Permanently deletes a single entity row.
     *
     * Only allowed when the entity has already been soft-deleted (`deletedAt` is
     * not null). Returns an error when the row is still active.
     *
     * @param id - Numeric primary key of the entity to hard-delete.
     * @returns The deleted entity's ID, or an error result.
     */
    async hardDelete(id: number): Promise<QueryResult<number>> {
        // First check if the addiction is soft-deleted
        const existingEntity = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.id, id))
            .limit(1);

        if (lib.resultEmpty(existingEntity)) {
            return { error: "Data not found." };
        }

        const entity = existingEntity[0] as any;
        if ("deletedAt" in entity && entity.deletedAt === null) {
            return { error: "Cannot hard delete: must be soft-deleted first." };
        }

        const result = await lib.db
            .delete(this.table)
            .where(lib.eq(this.table.id, id))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: "Failed to hard delete." };
        }

        return { success: "Hard deleted successfully.", entity: id };
    }

    /**
     * Permanently deletes all rows in the table.
     *
     * Requires passing `true` as `confirm`. Use with extreme caution — this
     * operation is irreversible.
     *
     * @param confirm - Must be `true` to proceed.
     * @returns A success result with entity `-1` as a sentinel value, or an error result.
     */
    async hardDeleteAll(confirm?: boolean): Promise<QueryResult<number>> {
        if (!confirm) {
            return { error: "Are you really sure you want to hard delete all entities? Pass 'true' as the confirm parameter to proceed." };
        }

        await lib.db
            .delete(this.table)
            .returning();

        return { success: "All entities hard deleted successfully.", entity: -1 };
    }
}