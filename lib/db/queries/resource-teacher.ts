import { QueryModel, QueryResult } from './model';
import * as lib from './lib';

const resourceTeacherTable = lib.Schema.ResourceTeacherTable.table;

type NewResourceTeacher = lib.Schema.ResourceTeacherTable.Insert;
type ResourceTeacher = lib.Schema.ResourceTeacherTable.Select;

class ResourceTeacherQueries extends QueryModel<NewResourceTeacher, ResourceTeacher> {
    constructor() {
        super(resourceTeacherTable);
    }

    async getById(id: number): Promise<QueryResult<ResourceTeacher>> {
        const result = await lib.db.select().from(this.table).where(lib.eq(this.table.resourceTeacherId, id));

        if (lib.resultEmpty(result)) {
            return { error: 'Lien Ressource-Professeur introuvable avec cet ID.' };
        }

        return { success: 'Lien Ressource-Professeur trouve.', entity: result[0] as ResourceTeacher };
    }

    async getByTeacherEmail(teacherEmail: string): Promise<QueryResult<ResourceTeacher[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(lib.eq(this.table.teacherMail, teacherEmail), lib.isNull(this.table.deletedAt)));

        if (lib.resultEmpty(result)) {
            return { error: 'Aucune ressource trouvee.' };
        }

        return { success: 'Liens Ressource-Professeur trouves.', entity: result as ResourceTeacher[] };
    }

    async getByResourceId(resourceId: string): Promise<QueryResult<ResourceTeacher[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(lib.eq(this.table.resourceId, resourceId), lib.isNull(this.table.deletedAt)));

        if (lib.resultEmpty(result)) {
            return { error: 'Aucun lien Ressource-Professeur trouve pour cet ID de ressource.' };
        }

        return { success: 'Liens Ressource-Professeur trouves.', entity: result as ResourceTeacher[] };
    }

    async deleteByResourceId(resourceId: string): Promise<QueryResult<ResourceTeacher[]>> {
        const result = await lib.db
            .update(this.table)
            .set({ deletedAt: new Date() })
            .where(lib.eq(this.table.resourceId, resourceId))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: 'Aucun lien Ressource-Professeur trouve pour cette ressource.' };
        }

        return { success: 'Liens Ressource-Professeur supprimes avec succes.', entity: result as ResourceTeacher[] };
    }

}

export const resourceTeacherQueries = new ResourceTeacherQueries();
