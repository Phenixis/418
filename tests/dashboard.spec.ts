import { test, expect } from './fixtures/authenticated-teacher';
import { db } from '@/lib/db/drizzle';
import { table as teacherTable } from '@/lib/db/schema/teacher';
import { table as resourceTable } from '@/lib/db/schema/resource';
import { table as resourceTeacherTable } from '@/lib/db/schema/resource-teacher';
import { table as sessionTable } from '@/lib/db/schema/session';
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
        const createResourceButton = authenticatedPage.getByRole('button', { name: 'Créer une ressource' });
        
        await expect(heading1).toBeVisible();
        await expect(createResourceButton).toBeVisible();
    });

    test('should display resources ordered by status: present, future, past', async ({ authenticatedPage }) => {
        const resourceRows = authenticatedPage.locator('tbody tr');
        const resourceRowCount = await resourceRows.count();
        const statusTexts: Array<'En cours' | 'À venir' | 'Terminé'> = [];

        for (let resourceRowIndex = 0; resourceRowIndex < resourceRowCount; resourceRowIndex++) {
            const resourceCells = resourceRows.nth(resourceRowIndex).locator('td');
            const resourceCellCount = await resourceCells.count();

            if (resourceCellCount === 0) {
                continue;
            }

            const rawStatusText = (await resourceCells.nth(6).innerText()).trim();
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
        const outsiderResourceId = `outsider-resource-${Date.now()}`;
        const outsiderSessionId = `outsider-session-${Date.now()}`;
        const outsiderResourceSubject = `Ressource outsider ${Date.now()}`;

        await db.insert(teacherTable).values({
            userMail: outsiderTeacherEmail,
            firstName: 'Outsider',
            lastName: 'Teacher',
            password: '',
            isTeacher: true,
        });

        await db.insert(resourceTable).values({
            resourceId: outsiderResourceId,
            subject: outsiderResourceSubject,
        });

        await db.insert(resourceTeacherTable).values({
            resourceId: outsiderResourceId,
            teacherMail: outsiderTeacherEmail,
        });

        await db.insert(sessionTable).values({
            sessionId: outsiderSessionId,
            resourceId: outsiderResourceId,
            subject: outsiderResourceSubject,
            startAt: new Date(Date.now() + 60 * 60 * 1000),
            endAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
        });

        try {
            await authenticatedPage.goto('/professeur/dashboard');

            await expect(authenticatedPage.getByRole('cell', { name: outsiderResourceSubject })).toHaveCount(0);
            await expect(authenticatedPage.locator('tbody tr').first()).toBeVisible();

            // Sanity check: the temporary course is linked to another teacher than the connected one.
            expect(outsiderTeacherEmail).not.toBe(testTeacherEmail);
        } finally {
            await db.delete(sessionTable).where(eq(sessionTable.sessionId, outsiderSessionId));
            await db.delete(resourceTeacherTable).where(eq(resourceTeacherTable.resourceId, outsiderResourceId));
            await db.delete(resourceTable).where(eq(resourceTable.resourceId, outsiderResourceId));
            await db.delete(teacherTable).where(eq(teacherTable.userMail, outsiderTeacherEmail));
        }
    });

    test('should persist tutorial completion and show completed badge', async ({ authenticatedPage, testTeacherEmail }) => {
        await db
            .update(teacherTable)
            .set({ isFirstConnection: false })
            .where(eq(teacherTable.userMail, testTeacherEmail));

        await authenticatedPage.goto('/professeur/dashboard');

        const completionResponse = await authenticatedPage.request.post('/api/teacher/tutorial/complete');
        expect(completionResponse.ok()).toBeTruthy();

        await expect
            .poll(async () => {
                const updatedTeacherRows = await db
                    .select({ isFirstConnection: teacherTable.isFirstConnection })
                    .from(teacherTable)
                    .where(eq(teacherTable.userMail, testTeacherEmail));

                return updatedTeacherRows[0]?.isFirstConnection;
            })
            .toBe(true);

    await authenticatedPage.reload();

    const completedTutorialTriggerButton = authenticatedPage.getByRole('button', { name: /Tutoriel déjà effectué/i });
    const completedBadge = authenticatedPage.getByText('FAIT');

    await expect(completedTutorialTriggerButton).toBeVisible();
    await expect(completedBadge).toBeVisible();
    });
});