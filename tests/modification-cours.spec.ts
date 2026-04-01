import { test, expect } from './fixtures/authenticated-teacher';
import { db } from '@/lib/db/drizzle';
import { table as courseTable } from '@/lib/db/schema/course';
import { table as courseTeacherTable } from '@/lib/db/schema/course-teacher';
import { table as groupTable } from '@/lib/db/schema/group';
import { table as courseGroupTable } from '@/lib/db/schema/course-group';
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
            await db.delete(courseTeacherTable).where(eq(courseTeacherTable.courseId, courseId));
            await db.delete(courseGroupTable).where(eq(courseGroupTable.courseId, courseId));
            await db.delete(courseTable).where(eq(courseTable.courseId, courseId));
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

        await db.insert(courseTable).values({
            courseId,
            subject: originalSubject,
            startAt: futureStartTime,
            endAt: futureEndTime,
        });

        await db.insert(courseTeacherTable).values({
            courseId,
            teacherMail: testTeacherEmail,
        });

        await db.insert(courseGroupTable).values({
            courseId,
            groupId: createdGroup.groupId,
        });

        createdCourseIds.push(courseId);

        await authenticatedPage.goto(`/professeur/cours/${courseId}`);

        await expect(authenticatedPage.getByRole('heading', { name: originalSubject, exact: true })).toBeVisible();

        const modifyButton = authenticatedPage.getByRole('button', { name: 'Modifier le cours', exact: true });
        await expect(modifyButton).toBeVisible();
        await modifyButton.click();

        await expect(authenticatedPage.getByLabel('Nom du cours')).toBeVisible();

        const newSubject = `${originalSubject} - MODIFIÉ`;
        await authenticatedPage.getByLabel('Nom du cours').fill(newSubject);

        const startTimeCombobox = authenticatedPage.locator('text=Heure de début').locator('..').locator('[role="combobox"]').first();
        await startTimeCombobox.click();
        await authenticatedPage.getByRole('option', { name: '9h15' }).click();

        const durationCombobox = authenticatedPage.locator('text=Durée').locator('..').locator('[role="combobox"]').first();
        await durationCombobox.click();
        await authenticatedPage.getByRole('option', { name: '2 heures' }).click();

        const submitButton = authenticatedPage.locator('form').getByRole('button', { name: 'Modifier le cours', exact: true });
        await expect(submitButton).toBeEnabled();
        await submitButton.click();

        await authenticatedPage.waitForURL(new RegExp(`/professeur/cours/${courseId}$`), { timeout: 10000 });

        const courseTitle = authenticatedPage.locator('main h1');
        await expect(courseTitle).toBeVisible();
        await expect(courseTitle).toContainText(' - MODI');

        await authenticatedPage.reload();

        await expect(courseTitle).toBeVisible();
        await expect(courseTitle).toContainText(' - MODI');
    });
});
