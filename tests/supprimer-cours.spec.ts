import { test, expect } from './fixtures/authenticated-teacher';
import { db } from '@/lib/db/drizzle';
import { table as courseTable } from '@/lib/db/schema/course';
import { table as courseTeacherTable } from '@/lib/db/schema/course-teacher';
import { eq } from 'drizzle-orm';

function generateCourseId(): string {
    // course_id is varchar(36) in schema
    return `course-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

test.describe('Suppression de cours', () => {
    const createdCourseIds: string[] = [];

    test.afterEach(async () => {
        for (const courseId of createdCourseIds) {
            await db.delete(courseTeacherTable).where(eq(courseTeacherTable.courseId, courseId));
            await db.delete(courseTable).where(eq(courseTable.courseId, courseId));
        }
        createdCourseIds.length = 0;
    });

    test('doit supprimer un cours et ne plus l afficher sur le dashboard', async ({ authenticatedPage, testTeacherEmail }) => {
        const courseId = generateCourseId();
        const courseSubject = `Test suppression ${Date.now()}`;

        await db.insert(courseTable).values({
            courseId,
            subject: courseSubject,
            startAt: new Date(Date.now() + 3600_000),
            endAt: new Date(Date.now() + 7200_000),
        });

        await db.insert(courseTeacherTable).values({
            courseId,
            teacherMail: testTeacherEmail,
        });

        createdCourseIds.push(courseId);

        await authenticatedPage.goto('/professeur/dashboard');

        const courseCell = authenticatedPage.getByRole('cell', { name: courseSubject });
        await expect(courseCell).toBeVisible();

        // Suppression du cours dans la base (simule l'action métier de suppression)
        await db.delete(courseTable).where(eq(courseTable.courseId, courseId));

        await authenticatedPage.reload();

        await expect(authenticatedPage.getByRole('cell', { name: courseSubject })).toHaveCount(0);
    });

    test('doit supprimer en cascade le lien course-teacher lorsque le cours est supprimé', async ({ testTeacherEmail }) => {
        const courseId = generateCourseId();

        await db.insert(courseTable).values({
            courseId,
            subject: `Test cascade ${Date.now()}`,
            startAt: new Date(Date.now() + 3600_000),
            endAt: new Date(Date.now() + 7200_000),
        });

        await db.insert(courseTeacherTable).values({
            courseId,
            teacherMail: testTeacherEmail,
        });

        createdCourseIds.push(courseId);

        await db.delete(courseTable).where(eq(courseTable.courseId, courseId));

        const leftoverCourseTeachers = await db
            .select()
            .from(courseTeacherTable)
            .where(eq(courseTeacherTable.courseId, courseId));

        expect(leftoverCourseTeachers.length).toBe(0);
    });
});
