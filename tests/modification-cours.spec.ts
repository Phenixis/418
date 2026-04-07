import { test, expect } from './fixtures/authenticated-teacher';
import { db } from '@/lib/db/drizzle';
import { table as resourceTable } from '@/lib/db/schema/resource';
import { table as resourceTeacherTable } from '@/lib/db/schema/resource-teacher';
import { table as sessionTable } from '@/lib/db/schema/session';
import { table as sessionTeacherTable } from '@/lib/db/schema/session-teacher';
import { table as groupTable } from '@/lib/db/schema/group';
import { table as sessionGroupTable } from '@/lib/db/schema/session-group';
import { table as studentTable } from '@/lib/db/schema/student';
import { eq } from 'drizzle-orm';

function generateSessionId(): string {
    return `session-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function generateResourceId(): string {
    return `resource-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

function generateGroupFixture(): { promo: string; td: string; tp: string; department: string; codePath: string; descriptionPath: string } {
    const randomSuffix = Math.floor(Math.random() * 9_999_999).toString().padStart(7, '0');
    return {
        promo: '4',
        td: 'A',
        tp: '1',
        department: `D${randomSuffix.slice(0, 2)}`,
        codePath: `C${randomSuffix.slice(2, 4)}`,
        descriptionPath: `Test group ${randomSuffix}`,
    };
}

test.describe('Modification de cours', () => {
    const createdCourseIds: string[] = [];
    const createdResourceIds: string[] = [];
    const createdGroupIds: number[] = [];
    const createdStudentEmails: string[] = [];

    test.afterEach(async () => {
        for (const courseId of createdCourseIds) {
            await db.delete(sessionTeacherTable).where(eq(sessionTeacherTable.sessionId, courseId));
            await db.delete(sessionGroupTable).where(eq(sessionGroupTable.sessionId, courseId));
            await db.delete(sessionTable).where(eq(sessionTable.sessionId, courseId));
        }
        for (const resourceId of createdResourceIds) {
            await db.delete(resourceTeacherTable).where(eq(resourceTeacherTable.resourceId, resourceId));
            await db.delete(resourceTable).where(eq(resourceTable.resourceId, resourceId));
        }
        for (const groupId of createdGroupIds) {
            await db.delete(groupTable).where(eq(groupTable.groupId, groupId));
        }

        for (const studentEmail of createdStudentEmails) {
            await db.delete(studentTable).where(eq(studentTable.userMail, studentEmail));
        }

        createdCourseIds.length = 0;
        createdResourceIds.length = 0;
        createdGroupIds.length = 0;
        createdStudentEmails.length = 0;
    });

    test('doit permettre de modifier un cours via le formulaire depuis la page du cours', async ({ authenticatedPage, testTeacherEmail }) => {
        const sessionId = generateSessionId();
        const resourceId = generateResourceId();
        const groupFixture = generateGroupFixture();

        const [createdGroup] = await db.insert(groupTable).values(groupFixture).returning({ groupId: groupTable.groupId });
        createdGroupIds.push(createdGroup.groupId);

        const originalSubject = `Cours modification formulaire ${Date.now()}`;
        const futureStartTime = new Date(Date.now() + 86_400_000); // Demain
        const futureEndTime = new Date(futureStartTime.getTime() + 3_600_000); // 1 heure plus tard

        // Ajouter un étudiant au groupe pour que la page de cours puisse charger sans erreur (requête attend des étudiants).
        const studentEmail = `etudiant-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}@etudiant.univ-rennes.fr`;
        createdStudentEmails.push(studentEmail);

        await db.insert(studentTable).values({
            userMail: studentEmail,
            firstName: 'Test',
            lastName: 'Etudiant',
            password: 'test123',
            isTeacher: false,
            groupId: createdGroup.groupId,
        });

        await db.insert(resourceTable).values({
            resourceId,
            subject: originalSubject,
        });

        await db.insert(resourceTeacherTable).values({
            resourceId,
            teacherMail: testTeacherEmail,
        });

        await db.insert(sessionTable).values({
            sessionId,
            resourceId,
            subject: originalSubject,
            startAt: futureStartTime,
            endAt: futureEndTime,
        });

        await db.insert(sessionTeacherTable).values({
            sessionId,
            teacherMail: testTeacherEmail,
        });

        await db.insert(sessionGroupTable).values({
            sessionId,
            groupId: createdGroup.groupId,
        });

        createdCourseIds.push(sessionId);
        createdResourceIds.push(resourceId);

        await authenticatedPage.goto(`/professeur/session/${sessionId}`);

        await expect(authenticatedPage.getByRole('heading', { name: originalSubject, exact: true })).toBeVisible();

        const modifyButton = authenticatedPage.getByRole('button', { name: 'Modifier la ressource', exact: true });
        await expect(modifyButton).toBeVisible();
        await modifyButton.click();

        await expect(authenticatedPage.getByLabel('Nom de la ressource')).toBeVisible();

        const newSubject = `${originalSubject} - MODIFIÉ`;
        await authenticatedPage.getByLabel('Nom de la ressource').fill(newSubject);

        const submitButton = authenticatedPage.locator('form').getByRole('button', { name: 'Modifier la ressource', exact: true });
        await expect(submitButton).toBeEnabled();
        await submitButton.click();

        await authenticatedPage.waitForURL(new RegExp(`/professeur/session/${sessionId}$`), { timeout: 10000 });

        await authenticatedPage.getByRole('link', { name: 'Voir le détail de la ressource' }).click();
        await authenticatedPage.waitForURL(new RegExp(`/professeur/resource/${resourceId}$`), { timeout: 10000 });

        const resourceTitle = authenticatedPage.locator('main h1');
        await expect(resourceTitle).toBeVisible();
        await expect(resourceTitle).toContainText(' - MODI');

        await authenticatedPage.reload();

        await expect(resourceTitle).toBeVisible();
        await expect(resourceTitle).toContainText(' - MODI');
    });
});
