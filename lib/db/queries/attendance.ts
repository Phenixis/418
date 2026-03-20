import { QueryModel } from './model'
import * as lib from './lib'
import { InferInsertModel, InferSelectModel } from 'drizzle-orm'

const attendanceTable = lib.Schema.AttendanceTable.table

type NewAttendance = InferInsertModel<typeof attendanceTable>
type Attendance = InferSelectModel<typeof attendanceTable>

class AttendanceQueries extends QueryModel<NewAttendance, Attendance> {
    constructor() {
        super(attendanceTable)
    }

    async getById(id: number) {
        const result = await lib.db
            .select()
            .from(this.table)
            .where(lib.eq(this.table.attendanceId, id))

        if (lib.resultEmpty(result)) {
            return { error: "Présence introuvable avec cet ID." }
        }

        return { success: "Présence trouvée.", entity: result[0] as Attendance }
    }
}

export const attendanceQueries = new AttendanceQueries()
