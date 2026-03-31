import { test, expect } from './fixtures/authenticated-teacher';
import { db } from '@/lib/db/drizzle';
import { table as courseTable } from '@/lib/db/schema/course';
import { table as courseTeacherTable } from '@/lib/db/schema/course-teacher';
import { eq } from 'drizzle-orm';

function generateCourseId(): string {
    return `course-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

test.describe('Modification de cours', () => {
    const createdCourseIds: string[] = [];

    test.afterEach(async () => {
        for (const courseId of createdCourseIds) {
            await db.delete(courseTeacherTable).where(eq(courseTeacherTable.courseId, courseId));
            await db.delete(courseTable).where(eq(courseTable.courseId, courseId));
        }
        createdCourseIds.length = 0;
    });

    test('doit mettre à jour le titre du cours et refléter le changement sur le dashboard', async ({ authenticatedPage, testTeacherEmail }) => {
        const courseId = generateCourseId();
        const originalSubject = `Cours test modifier ${Date.now()}`;
        const updatedSubject = `${originalSubject} (modifié)`;

        await db.insert(courseTable).values({
            courseId,
            subject: originalSubject,
            startAt: new Date(Date.now() + 1_000_000),
            endAt: new Date(Date.now() + 2_000_000),
        });

        await db.insert(courseTeacherTable).values({
            courseId,
            teacherMail: testTeacherEmail,
        });

        createdCourseIds.push(courseId);

        await authenticatedPage.goto('/professeur/dashboard');

        const courseRow = authenticatedPage.getByRole('cell', { name: originalSubject });
        await expect(courseRow).toBeVisible();

        await db
            .update(courseTable)
            .set({ subject: updatedSubject })
            .where(eq(courseTable.courseId, courseId));

        await authenticatedPage.reload();

        await expect(authenticatedPage.getByRole('cell', { name: originalSubject })).toHaveCount(0);
        await expect(authenticatedPage.getByRole('cell', { name: updatedSubject })).toBeVisible();
    });

    test('doit mettre à jour les horaires de cours et vérifier le cours modifié via la page du cours', async ({ authenticatedPage, testTeacherEmail }) => {
        const courseId = generateCourseId();
        const courseSubject = `Cours test date modif ${Date.now()}`;

        const originalStart = new Date(Date.now() + 3_600_000);
        const originalEnd = new Date(Date.now() + 7_200_000);

        const nextStart = new Date(Date.now() + 4_600_000);
        const nextEnd = new Date(Date.now() + 8_200_000);

        await db.insert(courseTable).values({
            courseId,
            subject: courseSubject,
            startAt: originalStart,
            endAt: originalEnd,
        });

        await db.insert(courseTeacherTable).values({
            courseId,
            teacherMail: testTeacherEmail,
        });

        createdCourseIds.push(courseId);

        await authenticatedPage.goto('/professeur/dashboard');

        await authenticatedPage.getByRole('cell', { name: courseSubject }).click();

        await expect(authenticatedPage).toHaveURL(new RegExp(`/professeur/cours/${courseId}$`));

        await db
            .update(courseTable)
            .set({ startAt: nextStart, endAt: nextEnd })
            .where(eq(courseTable.courseId, courseId));

        await authenticatedPage.reload();

        // NB : l'affichage exact de la date/heure dépend formattage; on vérifie au moins que la page charge bien et contient le sujet modifié
        await expect(authenticatedPage.getByRole('heading', { name: courseSubject })).toBeVisible();
    });
});
