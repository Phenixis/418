import * as lib from './lib';
import * as CourseTable from './course';
import * as GroupTable from './group'

// Classe association entre un étudiant et un cours
export const table = lib.pgTable('course_group', {
    courseGroupId: lib.serial("course_group_id").primaryKey(),
    courseId: lib.varchar("course_id", { length: 36 })
        .references(() => CourseTable.table.courseId, { onDelete: 'cascade', onUpdate: 'cascade' }).notNull(),
    groupId: lib.integer("group_id").notNull()
        .references(() => GroupTable.table.groupId, { onDelete: 'cascade', onUpdate: 'cascade' }),
            ...lib.baseAttributes,
});

export const relations = lib.relations(table, ({many}) => ({
    groups: many(GroupTable.table),
    courses: many(GroupTable.table)
}))

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
