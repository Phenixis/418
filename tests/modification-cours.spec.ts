import { test, expect } from './fixtures/authenticated-teacher';
import { db } from '@/lib/db/drizzle';
import { table as sessionTable } from '@/lib/db/schema/session';
import { table as sessionTeacherTable } from '@/lib/db/schema/session-teacher';
import { table as groupTable } from '@/lib/db/schema/group';
import { table as sessionGroupTable } from '@/lib/db/schema/session-group';
import { table as studentTable } from '@/lib/db/schema/student';
import { eq } from 'drizzle-orm';

function generateCourseId(): string {
    return `course-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
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
    const createdGroupIds: number[] = [];
    const createdStudentEmails: string[] = [];

    test.afterEach(async () => {
        for (const courseId of createdCourseIds) {
            await db.delete(sessionTeacherTable).where(eq(sessionTeacherTable.sessionId, courseId));
            await db.delete(sessionGroupTable).where(eq(sessionGroupTable.sessionId, courseId));
            await db.delete(sessionTable).where(eq(sessionTable.sessionId, courseId));
        }
        for (const groupId of createdGroupIds) {
            await db.delete(groupTable).where(eq(groupTable.groupId, groupId));
        }

        for (const studentEmail of createdStudentEmails) {
            await db.delete(studentTable).where(eq(studentTable.userMail, studentEmail));
        }

        createdCourseIds.length = 0;
        createdGroupIds.length = 0;
        createdStudentEmails.length = 0;
    });

    test('doit permettre de modifier un cours via le formulaire depuis la page du cours', async ({ authenticatedPage, testTeacherEmail }) => {
        const courseId = generateCourseId();
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

        await db.insert(sessionTable).values({
            courseId,
            subject: originalSubject,
            startAt: futureStartTime,
            endAt: futureEndTime,
        });

        await db.insert(sessionTeacherTable).values({
            courseId,
            teacherMail: testTeacherEmail,
        });

        await db.insert(sessionGroupTable).values({
            courseId,
            groupId: createdGroup.groupId,
        });

        createdCourseIds.push(courseId);

        await authenticatedPage.goto(`/professeur/session/${courseId}`);

        await expect(authenticatedPage.getByRole('heading', { name: originalSubject, exact: true })).toBeVisible();

        const modifyButton = authenticatedPage.getByRole('button', { name: 'Modifier le cours', exact: true });
        await expect(modifyButton).toBeVisible();
        await modifyButton.click();

        await expect(authenticatedPage.getByLabel('Nom du cours')).toBeVisible();

        const newSubject = `${originalSubject} - MODIFIÉ`;
        await authenticatedPage.getByLabel('Nom du cours').fill(newSubject);

        const editDialog = authenticatedPage.getByRole('dialog', { name: 'Modifier le cours' });
        const startTimeInput = editDialog.locator('input[type="time"]').first();
        await expect(startTimeInput).toBeVisible();
        await startTimeInput.fill('09:15');

        const durationCombobox = authenticatedPage.locator('text=Durée').locator('..').locator('[role="combobox"]').first();
        await durationCombobox.click();
        await authenticatedPage.getByRole('option', { name: '2 heures' }).click();

        const submitButton = authenticatedPage.locator('form').getByRole('button', { name: 'Modifier le cours', exact: true });
        await expect(submitButton).toBeEnabled();
        await submitButton.click();

        await authenticatedPage.waitForURL(new RegExp(`/professeur/session/${courseId}$`), { timeout: 10000 });

        const courseTitle = authenticatedPage.locator('main h1');
        await expect(courseTitle).toBeVisible();
        await expect(courseTitle).toContainText(' - MODI');

        await authenticatedPage.reload();

        await expect(courseTitle).toBeVisible();
        await expect(courseTitle).toContainText(' - MODI');
    });
});
