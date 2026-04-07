import * as lib from './lib';
import * as SessionTable from './session';
import * as StudentTable from './student'

// Classe association entre un etudiant et une seance
export const table = lib.pgTable('attendance', {
    attendanceId: lib.serial("attendance_id").primaryKey(),
    hourDate: lib.timestamp("hour_date"),
    sessionId: lib.varchar("session_id", { length: 36 })
        .references(() => SessionTable.table.sessionId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),
    studentMail: lib.varchar("student_mail", { length: 60 }).notNull()
        .references(() => StudentTable.table.userMail, { onDelete: 'cascade', onUpdate: 'cascade' }),
            ...lib.baseAttributes,
    lateStatus: lib.integer("late_status").notNull().default(0)
});

export const relations = lib.relations(table, ({ one }) => ({
    student: one(StudentTable.table, {
        fields: [table.studentMail],
        references: [StudentTable.table.userMail],
    }),
    session: one(SessionTable.table, {
        fields: [table.sessionId],
        references: [SessionTable.table.sessionId],
    }),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
