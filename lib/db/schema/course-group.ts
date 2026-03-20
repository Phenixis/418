import * as lib from './lib';
import * as CourseTable from './course';
import * as GroupTable from './group'

// Classe association entre un étudiant et un cours
export const table = lib.pgTable('course_group', {
    courseGroupId: lib.serial("course_group_id").primaryKey(),
    courseId: lib.varchar("course_id", { length: 10 })
        .references(() => CourseTable.table.courseId).notNull(),
    groupId: lib.integer("group_id").notNull()
        .references(() => GroupTable.table.groupId),
});

export const relations = lib.relations(table, ({many}) => ({
    Groups: many(GroupTable.table),
    courses: many(GroupTable.table)
}))

export type Select = typeof table.$inferSelect;
export type Insert = typeof table.$inferInsert;
