import * as lib from './lib';
import * as TagTable from './tag';
import * as StudentTable from './student';

export const table = lib.pgTable('student_tag', {
    studentTagId: lib.serial("student_tag_id").primaryKey(),
    tagId: lib.integer("tag_id").notNull()
        .references(() => TagTable.table.tagId, { onDelete: 'cascade', onUpdate: 'cascade' }),
    studentMail: lib.varchar("student_mail", { length: 60 }).notNull()
        .references(() => StudentTable.table.userMail, { onDelete: 'cascade', onUpdate: 'cascade' }),
    ...lib.baseAttributes
});

export const relations = lib.relations(table, ({ one }) => ({
    tag: one(TagTable.table, {
        fields: [table.tagId],
        references: [TagTable.table.tagId],
    }),
    student: one(StudentTable.table, {
        fields: [table.studentMail],
        references: [StudentTable.table.userMail],
    }),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
