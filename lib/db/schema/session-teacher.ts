import * as lib from './lib';
import * as SessionTable from './session';
import * as TeacherTable from './teacher';

export const table = lib.pgTable('session_teacher', {
    sessionTeacherId: lib.serial('session_teacher_id').primaryKey(),
    sessionId: lib
        .varchar('session_id', { length: 36 })
        .references(() => SessionTable.table.sessionId, { onDelete: 'cascade', onUpdate: 'cascade' })
        .notNull(),
    teacherMail: lib
        .varchar('teacher_mail', { length: 60 })
        .notNull()
        .references(() => TeacherTable.table.userMail, { onDelete: 'cascade', onUpdate: 'cascade' }),
    ...lib.baseAttributes,
});

export const relations = lib.relations(table, ({ one }) => ({
    session: one(SessionTable.table, {
        fields: [table.sessionId],
        references: [SessionTable.table.sessionId],
    }),
    teacher: one(TeacherTable.table, {
        fields: [table.teacherMail],
        references: [TeacherTable.table.userMail],
    }),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
