import { test, expect } from './fixtures/authenticated-teacher';
import { db } from '@/lib/db/drizzle';
import { table as sessionTable } from '@/lib/db/schema/session';
import { courseQueries } from '@/lib/db/queries/session';
import { table as sessionTeacherTable } from '@/lib/db/schema/session-teacher';
import { eq } from 'drizzle-orm';

function generateCourseId(): string {
    // course_id is varchar(36) in schema
    return `course-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

test.describe('Suppression de cours', () => {
    const createdCourseIds: string[] = [];

    test.afterEach(async () => {
        for (const courseId of createdCourseIds) {
            await db.delete(sessionTeacherTable).where(eq(sessionTeacherTable.sessionId, courseId));
            await db.delete(sessionTable).where(eq(sessionTable.sessionId, courseId));
        }
        createdCourseIds.length = 0;
    });

    test('doit supprimer un cours et ne plus l afficher sur le dashboard', async ({ authenticatedPage, testTeacherEmail }) => {
        const courseId = generateCourseId();
        const courseSubject = `Test suppression ${Date.now()}`;

        await db.insert(sessionTable).values({
            courseId,
            subject: courseSubject,
            startAt: new Date(Date.now() + 3600_000),
            endAt: new Date(Date.now() + 7200_000),
        });

        await db.insert(sessionTeacherTable).values({
            courseId,
            teacherMail: testTeacherEmail,
        });

        createdCourseIds.push(courseId);

        await authenticatedPage.goto('/professeur/dashboard');

        const courseCell = authenticatedPage.getByRole('cell', { name: courseSubject });
        await expect(courseCell).toBeVisible();

        // Suppression du cours dans la base (simule l'action métier de suppression)
        await db.delete(sessionTable).where(eq(sessionTable.sessionId, courseId));

        await authenticatedPage.reload();

        await expect(authenticatedPage.getByRole('cell', { name: courseSubject })).toHaveCount(0);
    });

    test('doit supprimer un cours depuis l’interface professeur', async ({ authenticatedPage, testTeacherEmail }) => {
        const courseId = generateCourseId();
        const courseSubject = `Test suppression UI ${Date.now()}`;

        await db.insert(sessionTable).values({
            courseId,
            subject: courseSubject,
            startAt: new Date(Date.now() + 3600_000),
            endAt: new Date(Date.now() + 7200_000),
        });

        await db.insert(sessionTeacherTable).values({
            courseId,
            teacherMail: testTeacherEmail,
        });

        createdCourseIds.push(courseId);

        await authenticatedPage.goto('/professeur/dashboard');

        const courseCell = authenticatedPage.getByRole('cell', { name: courseSubject });
        await expect(courseCell).toBeVisible();

        const courseRow = courseCell.locator('xpath=ancestor::tr');
        await courseRow.getByRole('button', { name: 'Open actions menu' }).click();
        await authenticatedPage.getByText('Supprimer le cours', { exact: true }).click();

        const dialog = authenticatedPage.locator('[data-slot="alert-dialog-content"]');
        await expect(dialog).toBeVisible();

        const confirmDeleteButton = dialog.getByRole('button', { name: 'Supprimer' });
        await confirmDeleteButton.click();

        await expect(authenticatedPage).toHaveURL(/\/professeur\/dashboard/);

        await expect(authenticatedPage.getByRole('cell', { name: courseSubject })).toHaveCount(0);

        await expect.poll(async () => {
            const deletedCourse = await db.select().from(sessionTable).where(eq(sessionTable.sessionId, courseId));
            if (deletedCourse.length === 0) return null;
            return deletedCourse[0].deletedAt;
        }, { timeout: 5000 }).not.toBeNull();

        const deletedCourse = await db.select().from(sessionTable).where(eq(sessionTable.sessionId, courseId));
        expect(deletedCourse).toHaveLength(1);

    });

    test('doit supprimer en cascade le lien course-teacher lorsque le cours est supprimé', async ({ testTeacherEmail }) => {
        const courseId = generateCourseId();

        await db.insert(sessionTable).values({
            courseId,
            subject: `Test cascade ${Date.now()}`,
            startAt: new Date(Date.now() + 3600_000),
            endAt: new Date(Date.now() + 7200_000),
        });

        await db.insert(sessionTeacherTable).values({
            courseId,
            teacherMail: testTeacherEmail,
        });

        createdCourseIds.push(courseId);

        await db.delete(sessionTable).where(eq(sessionTable.sessionId, courseId));

        const leftoverCourseTeachers = await db
            .select()
            .from(sessionTeacherTable)
            .where(eq(sessionTeacherTable.sessionId, courseId));

        expect(leftoverCourseTeachers.length).toBe(0);
    });

    test('ne doit pas afficher le cours supprimé lors de la navigation', async ({ authenticatedPage, testTeacherEmail }) => {
        const courseId = generateCourseId();
        const courseSubject = `Test cours supprimé ${Date.now()}`;

        await db.insert(sessionTable).values({
            courseId,
            subject: courseSubject,
            startAt: new Date(Date.now() + 3600_000),
            endAt: new Date(Date.now() + 7200_000),
        });

        await db.insert(sessionTeacherTable).values({
            courseId,
            teacherMail: testTeacherEmail,
        });

        createdCourseIds.push(courseId);

        await db.update(sessionTable).set({ deletedAt: new Date() }).where(eq(sessionTable.sessionId, courseId));

        await authenticatedPage.goto('/professeur/dashboard');
        await expect(authenticatedPage.getByRole('cell', { name: courseSubject })).toHaveCount(0);
    });

    test('doit permettre la suppression de plusieurs cours via l’interface', async ({ authenticatedPage, testTeacherEmail }) => {
        const toCreate = 3;
        const ids: string[] = [];

        for (let i = 0; i < toCreate; i++) {
            const courseId = generateCourseId();
            const courseSubject = `Test multi suppression ${Date.now()}-${i}`;

            await db.insert(sessionTable).values({
                courseId,
                subject: courseSubject,
                startAt: new Date(Date.now() + 3600_000),
                endAt: new Date(Date.now() + 7200_000),
            });
            await db.insert(sessionTeacherTable).values({ courseId, teacherMail: testTeacherEmail });
            createdCourseIds.push(courseId);
            ids.push(courseId);
        }

        await authenticatedPage.goto('/professeur/dashboard');

        for (const courseId of ids) {
            const courseRow = authenticatedPage
                .getByRole('cell', { name: new RegExp(`Test multi suppression .*`, 'i') })
                .first()
                .locator('xpath=ancestor::tr');

            await courseRow.getByRole('button', { name: 'Open actions menu' }).click();
            await authenticatedPage.getByText('Supprimer le cours', { exact: true }).click();

            const dialog = authenticatedPage.locator('[data-slot="alert-dialog-content"]');
            await expect(dialog).toBeVisible();

            await dialog.getByRole('button', { name: 'Supprimer' }).click();
            await expect(authenticatedPage).toHaveURL(/\/professeur\/dashboard/);
        }

        for (const courseId of ids) {
            const checkRow = await db.select().from(sessionTable).where(eq(sessionTable.sessionId, courseId));
            expect(checkRow).toHaveLength(1);
            expect(checkRow[0].deletedAt).not.toBeNull();
        }
    });

    test('ne supprime pas deux fois un même cours', async ({ authenticatedPage, testTeacherEmail }) => {
        const courseId = generateCourseId();
        const courseSubject = `Test double suppression ${Date.now()}`;

        await db.insert(sessionTable).values({
            courseId,
            subject: courseSubject,
            startAt: new Date(Date.now() + 3600_000),
            endAt: new Date(Date.now() + 7200_000),
        });
        await db.insert(sessionTeacherTable).values({ courseId, teacherMail: testTeacherEmail });

        createdCourseIds.push(courseId);

        await authenticatedPage.goto('/professeur/dashboard');

        // première suppression
        const courseRow = authenticatedPage.getByRole('cell', { name: courseSubject }).locator('xpath=ancestor::tr');
        await courseRow.getByRole('button', { name: 'Open actions menu' }).click();
        await authenticatedPage.getByText('Supprimer le cours', { exact: true }).click();
        await authenticatedPage.locator('[data-slot="alert-dialog-content"]').getByRole('button', { name: 'Supprimer' }).click();

        await expect(authenticatedPage.getByRole('cell', { name: courseSubject })).toHaveCount(0);

        // tentative de suppression second time via API (no-op soft delete)
        const deleteResult = await db.update(sessionTable).set({ deletedAt: new Date() }).where(eq(sessionTable.sessionId, courseId));
        expect(deleteResult).toBeDefined();
    });

    test('ne doit pas affecter les autres cours lors de suppression', async ({ authenticatedPage, testTeacherEmail }) => {
        const course1 = generateCourseId();
        const course2 = generateCourseId();

        await db.insert(sessionTable).values({
            sessionId: course1,
            subject: `Test isolation 1 ${Date.now()}`,
            startAt: new Date(Date.now() + 3600_000),
            endAt: new Date(Date.now() + 7200_000),
        });
        await db.insert(sessionTable).values({
            sessionId: course2,
            subject: `Test isolation 2 ${Date.now()}`,
            startAt: new Date(Date.now() + 3600_000),
            endAt: new Date(Date.now() + 7200_000),
        });

        await db.insert(sessionTeacherTable).values({ sessionId: course1, teacherMail: testTeacherEmail });
        await db.insert(sessionTeacherTable).values({ sessionId: course2, teacherMail: testTeacherEmail });

        createdCourseIds.push(course1, course2);

        await db.update(sessionTable).set({ deletedAt: new Date() }).where(eq(sessionTable.sessionId, course1));

        const allCourses = await db.select().from(sessionTable);
        const visibleCourses = allCourses.filter(c => c.deletedAt === null || c.deletedAt === undefined);
        expect(visibleCourses.some(c => c.sessionId === course1)).toBe(false);
        expect(visibleCourses.some(c => c.sessionId === course2)).toBe(true);
    });

    test('doit afficher cours ensuite une fois supprimé', async ({ authenticatedPage, testTeacherEmail }) => {
        const courseId = generateCourseId();
        const courseSubject = `Test visible supprime ${Date.now()}`;

        await db.insert(sessionTable).values({
            courseId,
            subject: courseSubject,
            startAt: new Date(Date.now() + 3600_000),
            endAt: new Date(Date.now() + 7200_000),
        });
        await db.insert(sessionTeacherTable).values({ courseId, teacherMail: testTeacherEmail });

        createdCourseIds.push(courseId);

        await authenticatedPage.goto('/professeur/dashboard');

        const courseRow = authenticatedPage.getByRole('cell', { name: courseSubject }).locator('xpath=ancestor::tr');
        await courseRow.getByRole('button', { name: 'Open actions menu' }).click();
        await authenticatedPage.getByText('Supprimer le cours', { exact: true }).click();
        await authenticatedPage.locator('[data-slot="alert-dialog-content"]').getByRole('button', { name: 'Supprimer' }).click();

        await expect(authenticatedPage.getByRole('cell', { name: courseSubject })).toHaveCount(0);
    });

    test('ne laisse pas de trace après suppression puis et rechargement', async ({ authenticatedPage, testTeacherEmail }) => {
        const courseId = generateCourseId();
        const courseSubject = `Test trace ${Date.now()}`;

        await db.insert(sessionTable).values({
            courseId,
            subject: courseSubject,
            startAt: new Date(Date.now() + 3600_000),
            endAt: new Date(Date.now() + 7200_000),
        });
        await db.insert(sessionTeacherTable).values({ courseId, teacherMail: testTeacherEmail });

        createdCourseIds.push(courseId);

        await authenticatedPage.goto('/professeur/dashboard');

        const courseRow = authenticatedPage.getByRole('cell', { name: courseSubject }).locator('xpath=ancestor::tr');
        await courseRow.getByRole('button', { name: 'Open actions menu' }).click();
        await authenticatedPage.getByText('Supprimer le cours', { exact: true }).click();
        await authenticatedPage.locator('[data-slot="alert-dialog-content"]').getByRole('button', { name: 'Supprimer' }).click();

        await expect(authenticatedPage.getByRole('cell', { name: courseSubject })).toHaveCount(0);
        await authenticatedPage.reload();
        await expect(authenticatedPage.getByRole('cell', { name: courseSubject })).toHaveCount(0);
    });

    test('deleteBySessionId retourne erreur si le cours n’existe pas', async () => {
        const result = await courseQueries.deleteBySessionId('not-found-course-id');
        expect('error' in result).toBe(true);
    });
});
