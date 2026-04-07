import { test, expect } from './fixtures/authenticated-teacher';
import { db } from '@/lib/db/drizzle';
import { table as resourceTable } from '@/lib/db/schema/resource';
import { table as resourceTeacherTable } from '@/lib/db/schema/resource-teacher';
import { table as sessionTable } from '@/lib/db/schema/session';
import { table as sessionTeacherTable } from '@/lib/db/schema/session-teacher';
import { table as sessionGroupTable } from '@/lib/db/schema/session-group';
import { table as groupTable } from '@/lib/db/schema/group';
import { sessionQueries } from '@/lib/db/queries/session';
import { eq } from 'drizzle-orm';

function generateUniqueId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

async function createResourceCourseFixture(teacherEmail: string) {
    const resourceId = generateUniqueId('resource');
    const sessionId = generateUniqueId('session');
    const groupId = Math.floor(Math.random() * 9_000_000) + 1_000_000;
    const subject = `Test suppression ${Date.now()}`;

    await db.insert(resourceTable).values({
        resourceId,
        subject,
    });

    await db.insert(resourceTeacherTable).values({
        resourceId,
        teacherMail: teacherEmail,
    });

    await db.insert(groupTable).values({
        groupId,
        promo: '4',
        td: 'A',
        tp: '1',
        department: 'D1',
        codePath: 'C1',
        descriptionPath: `Groupe test ${Date.now()}`,
    });

    await db.insert(sessionTable).values({
        sessionId,
        resourceId,
        subject,
        startAt: new Date(Date.now() + 3_600_000),
        endAt: new Date(Date.now() + 7_200_000),
    });

    await db.insert(sessionTeacherTable).values({
        sessionId,
        teacherMail: teacherEmail,
    });

    await db.insert(sessionGroupTable).values({
        sessionId,
        groupId,
    });

    return { resourceId, sessionId, groupId, subject };
}

test.describe('Suppression de cours', () => {
    const createdResourceIds: string[] = [];
    const createdSessionIds: string[] = [];
    const createdGroupIds: number[] = [];

    test.afterEach(async () => {
        for (const sessionId of createdSessionIds) {
            await db.delete(sessionTeacherTable).where(eq(sessionTeacherTable.sessionId, sessionId));
            await db.delete(sessionGroupTable).where(eq(sessionGroupTable.sessionId, sessionId));
            await db.delete(sessionTable).where(eq(sessionTable.sessionId, sessionId));
        }

        for (const resourceId of createdResourceIds) {
            await db.delete(resourceTeacherTable).where(eq(resourceTeacherTable.resourceId, resourceId));
            await db.delete(resourceTable).where(eq(resourceTable.resourceId, resourceId));
        }

        for (const groupId of createdGroupIds) {
            await db.delete(groupTable).where(eq(groupTable.groupId, groupId));
        }

        createdResourceIds.length = 0;
        createdSessionIds.length = 0;
        createdGroupIds.length = 0;
    });

    test('doit supprimer un cours depuis l interface professeur', async ({ authenticatedPage, testTeacherEmail }) => {
        const fixture = await createResourceCourseFixture(testTeacherEmail);
        createdResourceIds.push(fixture.resourceId);
        createdSessionIds.push(fixture.sessionId);
        createdGroupIds.push(fixture.groupId);

        await authenticatedPage.goto('/professeur/dashboard');
        await authenticatedPage.getByRole('cell', { name: fixture.subject }).click();
        await expect(authenticatedPage).toHaveURL(new RegExp(`/professeur/resource/${fixture.resourceId}$`));

        const sessionRow = authenticatedPage.getByRole('row', { name: new RegExp(fixture.subject) }).first();
        await expect(sessionRow).toBeVisible();
        await sessionRow.getByRole('button', { name: 'Open actions menu' }).click();
        await authenticatedPage.getByText('Supprimer le cours', { exact: true }).click();

        const dialog = authenticatedPage.locator('[data-slot="alert-dialog-content"]');
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: 'Supprimer' }).click();

        await expect(authenticatedPage.getByRole('row', { name: new RegExp(fixture.subject) })).toHaveCount(0);

        await authenticatedPage.goto('/professeur/dashboard');
        const dashboardRow = authenticatedPage.getByRole('row', { name: new RegExp(fixture.subject) });
        await expect(dashboardRow).toBeVisible();
        await expect(dashboardRow).toContainText('0');
        await expect(dashboardRow).toContainText('Aucune seance');
    });

    test('doit supprimer les liens techniques lors de la suppression logique', async ({ authenticatedPage, testTeacherEmail }) => {
        const fixture = await createResourceCourseFixture(testTeacherEmail);
        createdResourceIds.push(fixture.resourceId);
        createdSessionIds.push(fixture.sessionId);
        createdGroupIds.push(fixture.groupId);

        await db.delete(sessionTable).where(eq(sessionTable.sessionId, fixture.sessionId));

        const remainingSessionTeachers = await db
            .select()
            .from(sessionTeacherTable)
            .where(eq(sessionTeacherTable.sessionId, fixture.sessionId));

        const remainingSessionGroups = await db
            .select()
            .from(sessionGroupTable)
            .where(eq(sessionGroupTable.sessionId, fixture.sessionId));

        expect(remainingSessionTeachers).toHaveLength(0);
        expect(remainingSessionGroups).toHaveLength(0);

        await authenticatedPage.goto('/professeur/dashboard');
        const dashboardRow = authenticatedPage.getByRole('row', { name: new RegExp(fixture.subject) });
        await expect(dashboardRow).toBeVisible();
        await expect(dashboardRow).toContainText('0');
    });

    test('deleteBySessionId retourne erreur si le cours n existe pas', async () => {
        const result = await sessionQueries.deleteBySessionId('not-found-course-id');
        expect('error' in result).toBe(true);
    });
});
