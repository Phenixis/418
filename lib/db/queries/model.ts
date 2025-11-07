import { PgTableWithColumns } from "drizzle-orm/pg-core";


export abstract class QueryModel<NewEntityModel, ExistingEntityModel> {
    table: PgTableWithColumns<any>;

    constructor(table: PgTableWithColumns<any>) {
        this.table = table;
    }

    // C
    abstract create(creationData: NewEntityModel): Promise<{ success: string; createdEntity: ExistingEntityModel } | { error: string }>;
    
    // R
    abstract getById(id: number): Promise<ExistingEntityModel | null>;

    // U
    abstract update(id: number, updateData: Partial<ExistingEntityModel>): Promise<{ success: string; updatedEntity: ExistingEntityModel } | { error: string }>;

    // D
    abstract delete(id: number): Promise<{ success: string } | { error: string }>;
}