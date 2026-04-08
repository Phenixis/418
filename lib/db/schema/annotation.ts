import * as lib from './lib';
import * as TeacherTable from './teacher';
import * as StudentTable from './student';

export const table = lib.pgTable('annotation', {
    annotationId: lib.serial("annotation_id").primaryKey(),
    teacherEmail: lib.varchar("teacher_email", { length: 60 }).notNull()
        .references(() => TeacherTable.table.userMail, { onDelete: 'cascade', onUpdate: 'cascade' }),
    studentEmail: lib.varchar("student_email", { length: 60 }).notNull()
        .references(() => StudentTable.table.userMail, { onDelete: 'cascade', onUpdate: 'cascade' }),
    content: lib.text("content").notNull(),
    ...lib.baseAttributes
});