import { test, expect } from './fixtures/authenticated-teacher';
import { db } from '@/lib/db/drizzle';
import { table as teacherTable } from '@/lib/db/schema/teacher';
import { table as courseTable } from '@/lib/db/schema/course';
import { table as courseTeacherTable } from '@/lib/db/schema/course-teacher';
import { eq } from 'drizzle-orm';

function normalizeStatusLabel(rawStatusText: string): 'En cours' | 'À venir' | 'Terminé' | null {
    const normalizedStatusText = rawStatusText
        .normalize('NFD')
        .replaceAll(/\p{Diacritic}/gu, '')
        .toLowerCase();

    if (normalizedStatusText.includes('en cours')) {
        return 'En cours';
    }

    if (normalizedStatusText.includes('a venir')) {
        return 'À venir';
    }

    if (normalizedStatusText.includes('termine')) {
        return 'Terminé';
    }

    return null;
}

test.describe('Dashboard page', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/professeur/dashboard');
    });

    test('should display the dashboard', async ({ authenticatedPage }) => {
        const heading1 = authenticatedPage.getByRole('heading', { name: 'Dashboard' });
        const createCourseButton = authenticatedPage.getByRole('button', { name: 'Créer un cours' });
        
        await expect(heading1).toBeVisible();
        await expect(createCourseButton).toBeVisible();
    });

    test('should display courses ordered by status: present, future, past', async ({ authenticatedPage }) => {
        const courseRows = authenticatedPage.locator('tbody tr');
        const courseRowCount = await courseRows.count();
        const statusTexts: Array<'En cours' | 'À venir' | 'Terminé'> = [];

        for (let courseRowIndex = 0; courseRowIndex < courseRowCount; courseRowIndex++) {
            const courseCells = courseRows.nth(courseRowIndex).locator('td');
            const courseCellCount = await courseCells.count();

            if (courseCellCount === 0) {
                continue;
            }

            const rawStatusText = (await courseCells.nth(courseCellCount - 1).innerText()).trim();
            const normalizedStatusText = normalizeStatusLabel(rawStatusText);

            expect(normalizedStatusText).not.toBeNull();
            statusTexts.push(normalizedStatusText as 'En cours' | 'À venir' | 'Terminé');
        }

        const statusPriorityByLabel: Record<string, number> = {
            'En cours': 0,
            'À venir': 1,
            'Terminé': 2,
        };

        expect(statusTexts.length).toBeGreaterThan(0);

        for (let statusIndex = 1; statusIndex < statusTexts.length; statusIndex++) {
            const previousStatusPriority = statusPriorityByLabel[statusTexts[statusIndex - 1]];
            const currentStatusPriority = statusPriorityByLabel[statusTexts[statusIndex]];

            expect(currentStatusPriority).toBeGreaterThanOrEqual(previousStatusPriority);
        }
    });

    test('should only display courses for the connected teacher', async ({ authenticatedPage, testTeacherEmail }) => {
        const outsiderTeacherEmail = `outsider.${Date.now()}@univ-rennes.fr`;
        const outsiderCourseId = `outsider-course-${Date.now()}`;
        const outsiderCourseSubject = `Cours outsider ${Date.now()}`;

        await db.insert(teacherTable).values({
            userMail: outsiderTeacherEmail,
            firstName: 'Outsider',
            lastName: 'Teacher',
            password: '',
            isTeacher: true,
        });

        await db.insert(courseTable).values({
            courseId: outsiderCourseId,
            subject: outsiderCourseSubject,
            startAt: new Date(Date.now() + 60 * 60 * 1000),
            endAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        });

        await db.insert(courseTeacherTable).values({
            courseId: outsiderCourseId,
            teacherMail: outsiderTeacherEmail,
        });

        try {
            await authenticatedPage.goto('/professeur/dashboard');

            await expect(authenticatedPage.getByRole('cell', { name: outsiderCourseSubject })).toHaveCount(0);
            await expect(authenticatedPage.getByText('Cours Passé')).toBeVisible();

            // Sanity check: the temporary course is linked to another teacher than the connected one.
            expect(outsiderTeacherEmail).not.toBe(testTeacherEmail);
        } finally {
            await db.delete(courseTeacherTable).where(eq(courseTeacherTable.courseId, outsiderCourseId));
            await db.delete(courseTable).where(eq(courseTable.courseId, outsiderCourseId));
            await db.delete(teacherTable).where(eq(teacherTable.userMail, outsiderTeacherEmail));
        }
    });
});