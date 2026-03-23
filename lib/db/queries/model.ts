import { PgTableWithColumns } from "drizzle-orm/pg-core";
import * as lib from "./lib";

export class QueryModel<NewEntityModel extends { [x: string]: any; }, ExistingEntityModel extends { [x: string]: any; }> {
    table: PgTableWithColumns<any>;

    constructor(table: PgTableWithColumns<any>) {
        this.table = table;
    }

    async create(data: NewEntityModel): Promise<{ success: string; createdEntity: ExistingEntityModel } | { error: string }> {
        const result = await lib.db
            .insert(this.table)
            .values(data)
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: "Failed to create." };
        }

        return { success: "Created successfully.", createdEntity: result[0] as ExistingEntityModel };
    }

    // async getByIds(ids: number[], with_deleted: boolean = false): Promise<{ success: string; entities: ExistingEntityModel[] } | { error: string }> {
    //     const result = await lib.db
    //         .select()
    //         .from(this.table)
    //         .where(lib.and(
    //             lib.inArray(this.table.id, ids),
    //             with_deleted ? lib.sql`true` : lib.isNull(this.table.deleted_at)
    //         ));

    //     if (lib.resultEmpty(result)) {
    //         return { error: "No data found for the provided IDs." };
    //     }

    //     return { success: "Data retrieved successfully.", entities: result };
    // }

    // async getById(id: number, with_deleted: boolean = false): Promise<{ success: string; entity: ExistingEntityModel } | { error: string }> {
    //     const result = await this.getByIds([id], with_deleted);

    //     if ("error" in result) {
    //         return { error: result.error };
    //     }

    //     return { success: "Data retrieved successfully.", entity: result.entities[0] };
    // }

    async update(id: number, data: Partial<NewEntityModel>): Promise<{ success: string; updatedEntity: ExistingEntityModel } | { error: string }> {
        const result = await lib.db
            .update(this.table)
            .set({
                ...data,
                updated_at: new Date(),
            })
            .where(lib.eq(this.table.id, id))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: "Failed to update." };
        }

        return { success: "Updated successfully.", updatedEntity: result[0] as ExistingEntityModel };
    }

    async delete(id: number): Promise<{ success: string } | { error: string }> {
        const result = await lib.db
            .update(this.table)
            .set({ deleted_at: new Date() })
            .where(lib.eq(this.table.id, id))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: "Failed to delete." };
        }

        return { success: "Deleted successfully." };
    }

    async hardDelete(id: number): Promise<{ success: string } | { error: string }> {
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
        if ("deleted_at" in entity && entity.deleted_at === null) {
            return { error: "Cannot hard delete: must be soft-deleted first." };
        }

        const result = await lib.db
            .delete(this.table)
            .where(lib.eq(this.table.id, id))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: "Failed to hard delete." };
        }

        return { success: "Hard deleted successfully." };
    }
}