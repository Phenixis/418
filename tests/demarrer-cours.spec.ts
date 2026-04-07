import { test, expect } from './fixtures/authenticated-teacher';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db/drizzle';
import { table as courseTable } from '@/lib/db/schema/course';
import { table as courseTeacherTable } from '@/lib/db/schema/course-teacher';
import { table as courseGroupTable } from '@/lib/db/schema/course-group';
import { table as groupTable } from '@/lib/db/schema/group';
import { table as studentTable } from '@/lib/db/schema/student';
import { eq } from 'drizzle-orm';

const BOUTON_DEMARRER = 'Démarrer le cours';
const BOUTON_TERMINER = 'Terminer';
const BOUTON_QR = 'Ouvrir le QR code dans une nouvelle fenêtre';

test.describe('Démarrage et clôture d\'un appel de présence', () => {
    const coursCreesIds: string[] = [];
    const groupesCreesIds: number[] = [];
    const etudiantsCreesEmails: string[] = [];

    test.afterEach(async () => {
        for (const courseId of coursCreesIds) {
            await db.delete(courseTeacherTable).where(eq(courseTeacherTable.courseId, courseId));
            await db.delete(courseGroupTable).where(eq(courseGroupTable.courseId, courseId));
            await db.delete(courseTable).where(eq(courseTable.courseId, courseId));
        }
        for (const studentEmail of etudiantsCreesEmails) {
            await db.delete(studentTable).where(eq(studentTable.userMail, studentEmail));
        }
        for (const groupId of groupesCreesIds) {
            await db.delete(groupTable).where(eq(groupTable.groupId, groupId));
        }
        coursCreesIds.length = 0;
        groupesCreesIds.length = 0;
        etudiantsCreesEmails.length = 0;
    });

    async function creerCoursEnCours(testTeacherEmail: string): Promise<{ courseId: string }> {
        const courseId = randomUUID();
        const randomSuffix = Math.floor(Math.random() * 9_999_999).toString().padStart(7, '0');

        const [groupe] = await db.insert(groupTable).values({
            promo: '3',
            td: 'A',
            tp: '1',
            department: `D${randomSuffix.slice(0, 2)}`,
            codePath: `C${randomSuffix.slice(2, 4)}`,
            descriptionPath: `Groupe test ${randomSuffix}`,
        }).returning({ groupId: groupTable.groupId });

        groupesCreesIds.push(groupe.groupId);

        const studentEmail = `etudiant.appel.${Date.now()}.${Math.floor(Math.random() * 1_000_000)}@etudiant.univ-rennes.fr`;
        etudiantsCreesEmails.push(studentEmail);

        await db.insert(studentTable).values({
            userMail: studentEmail,
            firstName: 'Test',
            lastName: 'Etudiant',
            password: 'test123',
            isTeacher: false,
            groupId: groupe.groupId,
        });

        await db.insert(courseTable).values({
            courseId,
            subject: `Cours appel test ${Date.now()}`,
            startAt: new Date(Date.now() - 5 * 60_000),
            endAt: new Date(Date.now() + 60 * 60_000),
        });

        await db.insert(courseTeacherTable).values({
            courseId,
            teacherMail: testTeacherEmail,
        });

        await db.insert(courseGroupTable).values({
            courseId,
            groupId: groupe.groupId,
        });

        coursCreesIds.push(courseId);

        return { courseId };
    }

    test('doit afficher le bouton "Démarrer le cours" pour un cours en cours sans appel démarré', async ({ authenticatedPage, testTeacherEmail }) => {
        const { courseId } = await creerCoursEnCours(testTeacherEmail);
        await authenticatedPage.goto(`/professeur/cours/${courseId}`);

        const boutonDemarrer = authenticatedPage.getByRole('button', { name: BOUTON_DEMARRER, exact: true });
        await expect(boutonDemarrer).toBeVisible();
        await expect(boutonDemarrer).toBeEnabled();
    });

    test('ne doit pas afficher le bouton "Terminer" avant que l\'appel soit démarré', async ({ authenticatedPage, testTeacherEmail }) => {
        const { courseId } = await creerCoursEnCours(testTeacherEmail);
        await authenticatedPage.goto(`/professeur/cours/${courseId}`);

        await expect(authenticatedPage.getByRole('button', { name: BOUTON_TERMINER, exact: true })).toHaveCount(0);
    });

    test('ne doit pas afficher le QR code avant que l\'appel soit démarré', async ({ authenticatedPage, testTeacherEmail }) => {
        const { courseId } = await creerCoursEnCours(testTeacherEmail);
        await authenticatedPage.goto(`/professeur/cours/${courseId}`);

        await expect(authenticatedPage.getByRole('button', { name: BOUTON_QR })).toHaveCount(0);
    });

    test('doit afficher le QR code et le bouton "Terminer" après avoir démarré l\'appel', async ({ authenticatedPage, testTeacherEmail }) => {
        const { courseId } = await creerCoursEnCours(testTeacherEmail);
        await authenticatedPage.goto(`/professeur/cours/${courseId}`);

        const boutonDemarrer = authenticatedPage.getByRole('button', { name: BOUTON_DEMARRER, exact: true });
        await expect(boutonDemarrer).toBeVisible();
        await boutonDemarrer.click();

        await expect(authenticatedPage.getByRole('button', { name: BOUTON_QR })).toBeVisible({ timeout: 10_000 });
        await expect(authenticatedPage.getByRole('button', { name: BOUTON_TERMINER, exact: true })).toBeVisible();
        await expect(authenticatedPage.getByRole('button', { name: BOUTON_DEMARRER, exact: true })).toHaveCount(0);
    });

    test('doit enregistrer calledStartAt et calledEndAt en base lors du démarrage de l\'appel', async ({ authenticatedPage, testTeacherEmail }) => {
        const { courseId } = await creerCoursEnCours(testTeacherEmail);
        await authenticatedPage.goto(`/professeur/cours/${courseId}`);

        const avantDemarrage = new Date();

        await authenticatedPage.getByRole('button', { name: BOUTON_DEMARRER, exact: true }).click();
        await expect(authenticatedPage.getByRole('button', { name: BOUTON_QR })).toBeVisible({ timeout: 10_000 });

        const [coursMisAJour] = await db.select().from(courseTable).where(eq(courseTable.courseId, courseId));
        expect(coursMisAJour.calledStartAt).not.toBeNull();
        expect(coursMisAJour.calledStartAt!.getTime()).toBeGreaterThanOrEqual(avantDemarrage.getTime() - 5_000);
        expect(coursMisAJour.calledEndAt).not.toBeNull();
        expect(coursMisAJour.calledEndAt!.getTime()).toBeGreaterThan(coursMisAJour.calledStartAt!.getTime());
    });

    test('doit masquer le QR code après avoir clôturé l\'appel', async ({ authenticatedPage, testTeacherEmail }) => {
        const { courseId } = await creerCoursEnCours(testTeacherEmail);
        await authenticatedPage.goto(`/professeur/cours/${courseId}`);

        await authenticatedPage.getByRole('button', { name: BOUTON_DEMARRER, exact: true }).click();
        await expect(authenticatedPage.getByRole('button', { name: BOUTON_QR })).toBeVisible({ timeout: 10_000 });

        await authenticatedPage.getByRole('button', { name: BOUTON_TERMINER, exact: true }).click();

        await expect(authenticatedPage.getByRole('button', { name: BOUTON_QR })).toHaveCount(0, { timeout: 10_000 });
        await expect(authenticatedPage.getByRole('button', { name: BOUTON_TERMINER, exact: true })).toHaveCount(0);
    });

    test('doit mettre à jour calledEndAt en base lors de la clôture de l\'appel', async ({ authenticatedPage, testTeacherEmail }) => {
        const { courseId } = await creerCoursEnCours(testTeacherEmail);
        await authenticatedPage.goto(`/professeur/cours/${courseId}`);

        await authenticatedPage.getByRole('button', { name: BOUTON_DEMARRER, exact: true }).click();
        await expect(authenticatedPage.getByRole('button', { name: BOUTON_QR })).toBeVisible({ timeout: 10_000 });

        const avantCloture = new Date();

        await authenticatedPage.getByRole('button', { name: BOUTON_TERMINER, exact: true }).click();
        await expect(authenticatedPage.getByRole('button', { name: BOUTON_QR })).toHaveCount(0, { timeout: 10_000 });

        const [coursMisAJour] = await db.select().from(courseTable).where(eq(courseTable.courseId, courseId));
        expect(coursMisAJour.calledEndAt).not.toBeNull();
        expect(coursMisAJour.calledEndAt!.getTime()).toBeGreaterThanOrEqual(avantCloture.getTime() - 5_000);
        expect(coursMisAJour.calledEndAt!.getTime()).toBeLessThanOrEqual(new Date().getTime() + 1_000);
    });

    test('ne doit pas afficher le bouton "Démarrer le cours" pour un cours terminé', async ({ testTeacherEmail, authenticatedPage }) => {
        const courseId = randomUUID();
        const randomSuffix = Math.floor(Math.random() * 9_999_999).toString().padStart(7, '0');

        const [groupe] = await db.insert(groupTable).values({
            promo: '3',
            td: 'B',
            tp: '2',
            department: `D${randomSuffix.slice(0, 2)}`,
            codePath: `C${randomSuffix.slice(2, 4)}`,
            descriptionPath: `Groupe test ${randomSuffix}`,
        }).returning({ groupId: groupTable.groupId });

        groupesCreesIds.push(groupe.groupId);

        const studentEmail = `etudiant.termine.${Date.now()}.${Math.floor(Math.random() * 1_000_000)}@etudiant.univ-rennes.fr`;
        etudiantsCreesEmails.push(studentEmail);

        await db.insert(studentTable).values({
            userMail: studentEmail,
            firstName: 'Test',
            lastName: 'Termine',
            password: 'test123',
            isTeacher: false,
            groupId: groupe.groupId,
        });

        await db.insert(courseTable).values({
            courseId,
            subject: `Cours terminé test ${Date.now()}`,
            startAt: new Date(Date.now() - 2 * 60 * 60_000),
            endAt: new Date(Date.now() - 60 * 60_000),
        });

        await db.insert(courseTeacherTable).values({
            courseId,
            teacherMail: testTeacherEmail,
        });

        await db.insert(courseGroupTable).values({
            courseId,
            groupId: groupe.groupId,
        });

        coursCreesIds.push(courseId);

        await authenticatedPage.goto(`/professeur/cours/${courseId}`);

        await expect(authenticatedPage.getByRole('button', { name: BOUTON_DEMARRER, exact: true })).toHaveCount(0);
        await expect(authenticatedPage.getByRole('button', { name: BOUTON_QR })).toHaveCount(0);
    });
});
