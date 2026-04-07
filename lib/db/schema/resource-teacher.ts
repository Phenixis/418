import * as lib from './lib';
import * as ResourceTable from './resource';
import * as TeacherTable from './teacher';

export const table = lib.pgTable('resource_teacher', {
    resourceTeacherId: lib.serial('resource_teacher_id').primaryKey(),
    resourceId: lib
        .varchar('resource_id', { length: 36 })
        .references(() => ResourceTable.table.resourceId, { onDelete: 'cascade', onUpdate: 'cascade' })
        .notNull(),
    teacherMail: lib
        .varchar('teacher_mail', { length: 60 })
        .notNull()
        .references(() => TeacherTable.table.userMail, { onDelete: 'cascade', onUpdate: 'cascade' }),
    ...lib.baseAttributes,
});

export const relations = lib.relations(table, ({ one }) => ({
    resource: one(ResourceTable.table, {
        fields: [table.resourceId],
        references: [ResourceTable.table.resourceId],
    }),
    teacher: one(TeacherTable.table, {
        fields: [table.teacherMail],
        references: [TeacherTable.table.userMail],
    }),
}));

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
