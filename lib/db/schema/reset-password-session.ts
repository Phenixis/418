import * as lib from './lib';
import * as TeacherTable from './teacher'
import * as StudentTable from './student'

export const table = lib.pgTable('reset_password_session', {
    id: lib.varchar("session_id", { length: 36 }).primaryKey(),
    userMailStudent: lib.varchar("user_mail_student", { length: 60 })
        .references(() => StudentTable.table.userMail, { onDelete: 'cascade', onUpdate: 'cascade' }),
    userMailTeacher: lib.varchar("user_mail_teacher", { length: 60 })
        .references(() => TeacherTable.table.userMail, { onDelete: 'cascade', onUpdate: 'cascade' }),
    expiresAt: lib.timestamp("expires_at").notNull(),
    ...lib.baseAttributes,
});

export const relations = lib.relations(table, ({ one }) => ({
    student: one(StudentTable.table, {
        fields: [table.userMailStudent],
        references: [StudentTable.table.userMail],
    }),
    teacher: one(TeacherTable.table, {
        fields: [table.userMailTeacher],
        references: [TeacherTable.table.userMail],
    }),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
