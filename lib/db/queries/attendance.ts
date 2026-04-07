import { QueryModel, QueryResult, SuccessQueryResult } from './model'
import * as lib from './lib'

const attendanceTable = lib.Schema.AttendanceTable.table

type NewAttendance = lib.Schema.AttendanceTable.Insert
type Attendance = lib.Schema.AttendanceTable.Select

class AttendanceQueries extends QueryModel<NewAttendance, Attendance> {
    constructor() {
        super(attendanceTable)
    }

    async getById(id: number): Promise<QueryResult<Attendance>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.attendanceId, id))

        if (lib.resultEmpty(result)) {
            return { error: "Présence introuvable avec cet ID." }
        }

        return { success: "Présence trouvée.", entity: result[0] as Attendance }
    }

    // Récupère toutes les présences pour un cours donné
    async getByCourseId(courseId: string): Promise<SuccessQueryResult<Attendance[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(
                lib.eq(this.table.courseId, courseId),
                lib.isNull(this.table.deletedAt)
            ))

        // Un cours sans aucune présence enregistrée est valide — on retourne un tableau vide
        return { success: "Présences récupérées.", entity: result as Attendance[] }
    }

    async getByCourseAndStudent(courseId: string, studentMail: string): Promise<SuccessQueryResult<Attendance[]>> {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.and(
                lib.eq(this.table.courseId, courseId),
                lib.eq(this.table.studentMail, studentMail),
                lib.isNull(this.table.deletedAt)
            ))

        return { success: "Présences récupérées.", entity: result as Attendance[] }
    }

    async markPresent(courseId: string, studentMail: string): Promise<QueryResult<Attendance>> {
        const existingAttendance = await this.getByCourseAndStudent(courseId, studentMail)

        if (existingAttendance.entity.length > 0) {
            return { success: "Étudiant déjà présent.", entity: existingAttendance.entity[0] }
        }

        const createResult = await this.create({
            hourDate: new Date(),
            courseId,
            studentMail
        })

        if ('error' in createResult) {
            return createResult
        }

        return { success: "Présence ajoutée.", entity: createResult.entity }
    }

    /**
     * Marque un étudiant comme présent avec un niveau de retard.
     * Crée l'enregistrement s'il n'existe pas, met à jour le lateStatus sinon.
     *
     * @param lateStatus 0 = présent, 1 = retard +5, 2 = retard +10, 3 = retard +15
     */
    async markPresentAvecRetard(courseId: string, studentMail: string, lateStatus: number): Promise<QueryResult<Attendance>> {
        const existingAttendance = await this.getByCourseAndStudent(courseId, studentMail)

        if (existingAttendance.entity.length > 0) {
            // Mettre à jour le late_status de la présence existante
            const result = await lib.db
                .update(this.table)
                .set({ lateStatus, updatedAt: new Date() })
                .where(lib.and(
                    lib.eq(this.table.courseId, courseId),
                    lib.eq(this.table.studentMail, studentMail),
                    lib.isNull(this.table.deletedAt)
                ))
                .returning()

            if (lib.resultEmpty(result)) {
                return { error: "Impossible de mettre à jour le statut de retard." }
            }

            return { success: "Statut de retard mis à jour.", entity: result[0] as Attendance }
        }

        // Créer une nouvelle présence avec le late_status
        const createResult = await this.create({
            hourDate: new Date(),
            courseId,
            studentMail,
            lateStatus
        })

        if ('error' in createResult) {
            return createResult
        }

        return { success: "Présence ajoutée avec retard.", entity: createResult.entity }
    }

    async markNonScanne(courseId: string, studentMail: string): Promise<SuccessQueryResult<Attendance[]>> {
        const deletedAttendances = await lib.db
            .delete(this.table)
            .where(lib.and(
                lib.eq(this.table.courseId, courseId),
                lib.eq(this.table.studentMail, studentMail),
                lib.isNull(this.table.deletedAt)
            ))
            .returning()

        return { success: "Présence supprimée.", entity: deletedAttendances as Attendance[] }
    }
}

export const attendanceQueries = new AttendanceQueries()
