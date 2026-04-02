import { PgTableWithColumns } from "drizzle-orm/pg-core";
import * as lib from "./lib";

export type QueryResult<T> = SuccessQueryResult<T> | ErrorQueryResult;

export type SuccessQueryResult<T> = { success: string; entity: T };
export type ErrorQueryResult = { error: string };

export class QueryModel<NewEntityModel extends { [x: string]: any; }, ExistingEntityModel extends { [x: string]: any; }> {
    table: PgTableWithColumns<any>;

    constructor(table: PgTableWithColumns<any>) {
        this.table = table;
    }

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

    async getAll(): Promise<QueryResult<ExistingEntityModel[]>> {
        const result = await lib.db
            .select()
            .from(this.table)

        return { success: "Data trouvées.", entity: result as ExistingEntityModel[] }
    }

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