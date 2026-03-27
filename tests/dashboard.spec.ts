import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { db } from '@/lib/db/drizzle';
import { table as teacherTable } from '@/lib/db/schema/teacher';
import { table as courseTable } from '@/lib/db/schema/course';
import { table as courseTeacherTable } from '@/lib/db/schema/course-teacher';
import { eq } from 'drizzle-orm';

function getTestAccountLocalPart(): string {
    const testAccountEmail = process.env.TEST_ACCOUNT_EMAIL ?? 'test@univ-rennes.fr';
    return testAccountEmail.split('@')[0];
}

async function loginAsTestTeacher(page: Page) {
    await page.goto('/professeur/connexion');

    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Mot de passe');
    const submitButton = page.getByRole('button', { name: 'Se connecter' });

    await emailInput.fill(getTestAccountLocalPart());
    await passwordInput.fill(process.env.TEST_ACCOUNT_PASSWORD ?? 'MotDePasse1');
    await expect(submitButton).toBeEnabled();
    await submitButton.click();
    await expect(page).toHaveURL('/professeur/dashboard');
}

test.describe('Dashboard page', () => {
    test.beforeEach(async ({ page }: { page: Page }) => {
        await loginAsTestTeacher(page);
    });

    test('should display the dashboard', async ({ page }: { page: Page }) => {
        const heading1 = page.getByRole('heading', { name: 'Dashboard' });
        const createCourseButton = page.getByRole('button', { name: 'Créer un cours' });
        
        await expect(heading1).toBeVisible();
        await expect(createCourseButton).toBeVisible();
    });

    test('should display courses ordered by status: present, future, past', async ({ page }: { page: Page }) => {
        const statusCells = page.locator('tbody tr td:nth-child(6)');
        const statusTexts = (await statusCells.allTextContents()).map((statusText) => statusText.trim());

        const statusPriorityByLabel: Record<string, number> = {
            'En cours': 0,
            'À venir': 1,
            'Terminé': 2,
        };

        expect(statusTexts.length).toBeGreaterThan(0);

        for (const statusText of statusTexts) {
            expect(statusPriorityByLabel[statusText]).not.toBeUndefined();
        }

        for (let statusIndex = 1; statusIndex < statusTexts.length; statusIndex++) {
            const previousStatusPriority = statusPriorityByLabel[statusTexts[statusIndex - 1]];
            const currentStatusPriority = statusPriorityByLabel[statusTexts[statusIndex]];

            expect(currentStatusPriority).toBeGreaterThanOrEqual(previousStatusPriority);
        }
    });

    test('should only display courses for the connected teacher', async ({ page }: { page: Page }) => {
        const testTeacherEmail = process.env.TEST_ACCOUNT_EMAIL ?? 'test@univ-rennes.fr';
        const outsiderTeacherEmail = `outsider.${Date.now()}@univ-rennes.fr`;
        const outsiderCourseId = `outsider-course-${Date.now()}`;
        const outsiderCourseSubject = `Cours outsider ${Date.now()}`;

        await db.insert(teacherTable).values({
            userMail: outsiderTeacherEmail,
            firstName: 'Outsider',
            lastName: 'Teacher',
            password: `outsider-${Date.now()}`,
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
            await page.goto('/professeur/dashboard');

            await expect(page.getByRole('cell', { name: outsiderCourseSubject })).toHaveCount(0);
            await expect(page.getByText('Cours Passé')).toBeVisible();

            // Sanity check: the temporary course is linked to another teacher than the connected one.
            expect(outsiderTeacherEmail).not.toBe(testTeacherEmail);
        } finally {
            await db.delete(courseTeacherTable).where(eq(courseTeacherTable.courseId, outsiderCourseId));
            await db.delete(courseTable).where(eq(courseTable.courseId, outsiderCourseId));
            await db.delete(teacherTable).where(eq(teacherTable.userMail, outsiderTeacherEmail));
        }
    });
});