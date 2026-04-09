import { resourceTeacherQueries } from './resource-teacher';
import * as lib from './lib';
import { QueryModel, QueryResult } from './model';

const resourceTable = lib.Schema.ResourceTable.table;

type NewResource = lib.Schema.ResourceTable.Insert;
type Resource = lib.Schema.ResourceTable.Select;

class ResourceQueries extends QueryModel<NewResource, Resource> {
    constructor() {
        super(resourceTable);
    }

    async getByStringId(stringId: string): Promise<QueryResult<Resource>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(lib.eq(this.table.resourceId, stringId), lib.isNull(this.table.deletedAt)));

        if (lib.resultEmpty(result)) {
            return { error: 'Ressource introuvable avec cet ID.' };
        }
        return { success: 'Ressource trouvee.', entity: result[0] as Resource };
    }

    async getByTeacherMail(teacherMail: string): Promise<QueryResult<Resource[]>> {
        const resourceTeacherResult = await resourceTeacherQueries.getByTeacherEmail(teacherMail);

        if ('error' in resourceTeacherResult) {
            return resourceTeacherResult;
        }

        const resourceIds = resourceTeacherResult.entity.map((resourceTeacher) => resourceTeacher.resourceId);

        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(lib.inArray(this.table.resourceId, resourceIds), lib.isNull(this.table.deletedAt)));

        return { success: 'Ressources trouvees pour le professeur.', entity: result as Resource[] };
    }

    async findBySubjectAndTeacher(subject: string, teacherMail: string): Promise<QueryResult<Resource>> {
        const resourceTeacherResult = await resourceTeacherQueries.getByTeacherEmail(teacherMail);

        if ('error' in resourceTeacherResult) {
            return { error: 'Aucune ressource trouvee pour cet enseignant.' };
        }

        const resourceIds = resourceTeacherResult.entity.map((resourceTeacher) => resourceTeacher.resourceId);

        const result = await lib.db
            .select()
            .from(this.table)
            .where(
                lib.and(
                    lib.inArray(this.table.resourceId, resourceIds),
                    lib.eq(this.table.subject, subject),
                    lib.isNull(this.table.deletedAt)
                )
            )
            .limit(1);

        if (lib.resultEmpty(result)) {
            return { error: 'Ressource introuvable.' };
        }

        return { success: 'Ressource trouvee.', entity: result[0] as Resource };
    }

    async upsertAde(subject: string, teacherMail: string): Promise<QueryResult<Resource>> {
        const existing = await this.findBySubjectAndTeacher(subject, teacherMail);

        if ('entity' in existing) {
            return existing;
        }

        const resourceId = crypto.randomUUID();

        const createResult = await this.create({ resourceId, subject, source: 'ADE' });

        if ('error' in createResult) {
            return createResult;
        }

        const linkResult = await resourceTeacherQueries.create({ resourceId, teacherMail });

        if ('error' in linkResult) {
            return { error: 'Ressource créée, mais liaison enseignant échouée.' };
        }

        return createResult;
    }

    async update(stringId: string, data: Partial<NewResource>): Promise<QueryResult<Resource>> {
        const result = await lib.db
            .update(this.table)
            .set({
                ...data,
                updatedAt: new Date(),
            })
            .where(lib.eq(this.table.resourceId, stringId))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: 'Echec de la mise a jour de la ressource.' };
        }

        return { success: 'Ressource mise a jour.', entity: result[0] as Resource };
    }

    async deleteByResourceId(resourceId: string): Promise<QueryResult<Resource>> {
        const result = await lib.db
            .update(this.table)
            .set({ deletedAt: new Date() })
            .where(lib.and(lib.eq(this.table.resourceId, resourceId), lib.isNull(this.table.deletedAt)))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: 'Ressource introuvable ou deja supprimee.' };
        }

        return { success: 'Ressource supprimee.', entity: result[0] as Resource };
    }

}

export const resourceQueries = new ResourceQueries();
