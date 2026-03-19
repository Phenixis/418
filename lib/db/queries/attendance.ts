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
}

export const attendanceQueries = new AttendanceQueries()
