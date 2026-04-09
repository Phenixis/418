import * as lib from './lib';
import * as TeacherTable from './teacher';

export const table = lib.pgTable('tag', {
    tagId: lib.serial("tag_id").primaryKey(),
    teacherMail: lib.varchar("teacher_mail", { length: 60 }).notNull()
        .references(() => TeacherTable.table.userMail, { onDelete: 'cascade', onUpdate: 'cascade' }),
    name: lib.varchar("name", { length: 50 }).notNull(),
    color: lib.varchar("color", { length: 7 }),
    ...lib.baseAttributes
});

export const relations = lib.relations(table, ({ one }) => ({
    teacher: one(TeacherTable.table, {
        fields: [table.teacherMail],
        references: [TeacherTable.table.userMail],
    }),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
