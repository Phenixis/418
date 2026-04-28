import { QueryModel, QueryResult, SuccessQueryResult } from './model'
import * as lib from './lib'

const annotationTable = lib.Schema.AnnotationTable.table

type NewAnnotation = lib.Schema.AnnotationTable.Insert
type Annotation = lib.Schema.AnnotationTable.Select

export class AnnotationQueries extends QueryModel<NewAnnotation, Annotation> {
    constructor() {
        super(annotationTable)
    }

    async getById(id: number): Promise<QueryResult<Annotation>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.annotationId, id))

        if (lib.resultEmpty(result)) {
            return { error: "Annotation introuvable avec cet ID." }
        }

        return { success: "Annotation trouvée.", entity: result[0] as Annotation }
    }

    async getByStudentEmail(studentEmail: string): Promise<SuccessQueryResult<Annotation[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(
                lib.eq(this.table.studentEmail, studentEmail),
                lib.isNull(this.table.deletedAt)
            ))

        return { success: "Annotations recuperees.", entity: result as Annotation[] }
    }

    async getByStudentAndTeacher(studentEmail: string, teacherEmail: string): Promise<SuccessQueryResult<Annotation>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(
                lib.eq(this.table.studentEmail, studentEmail),
                lib.eq(this.table.teacherEmail, teacherEmail),
                lib.isNull(this.table.deletedAt)
            ))

        return { success: "Annotations recuperees.", entity: result[0] as Annotation }
    }

    async updateById(id: number, content: string): Promise<QueryResult<Annotation>> {
        const result = await lib.db
            .update(this.table)
            .set({ content, updatedAt: new Date() })
            .where(lib.eq(this.table.annotationId, id))
            .returning();

        if (lib.resultEmpty(result)) {
            return { error: "Annotation introuvable." };
        }

        return { success: "Annotation modifiée.", entity: result[0] as Annotation };
    }
}

export const annotationQueries = new AnnotationQueries()