import { test, expect } from '@playwright/test';
import { db } from '@/lib/db/drizzle';
import { table as studentTable } from '@/lib/db/schema/student';
import { table as courseTable } from '@/lib/db/schema/course';
import { ensureStudentAccountByEmail, deleteStudentAccountByEmail } from './helpers/test-account';
import { eq } from 'drizzle-orm';

const STUDENT_EMAIL_DOMAIN = 'etudiant.univ-rennes.fr';

type StudentCredentials = {
    email: string;
    password: string;
    localPart: string;
};

type CourseFixture = {
    courseId: string;
    courseName: string;
};

async function createStudentCredentials(): Promise<StudentCredentials> {
    const randomSuffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const localPart = `test.${randomSuffix}`;
    const email = `${localPart}@${STUDENT_EMAIL_DOMAIN}`;
    const password = `ValidPass1!${randomSuffix}`;

    await ensureStudentAccountByEmail(email, password, {
        firstName: 'Test',
        lastName: 'Student',
        groupId: null,
    });

    return { email, password, localPart };
}

async function deleteStudentByEmail(studentEmail: string): Promise<void> {
    await deleteStudentAccountByEmail(studentEmail);
}

async function createActiveCourseFixture(): Promise<CourseFixture> {
    const randomSuffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const courseId = `student-ui-course-${randomSuffix}`;
    const courseName = `Cours UI ${randomSuffix}`;

    await db.insert(courseTable).values({
        courseId,
        subject: courseName,
        startAt: new Date(Date.now() - 5 * 60 * 1000),
        endAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    return { courseId, courseName };
}

async function deleteCourseById(courseId: string): Promise<void> {
    await db.delete(courseTable).where(eq(courseTable.courseId, courseId));
}

test.describe('Student attendance UI and session persistence', () => {
    let createdStudentEmails: string[] = [];
    let createdCourseIds: string[] = [];

    test.beforeEach(async () => {
        createdStudentEmails = [];
        createdCourseIds = [];
    });

    test.afterEach(async () => {
        for (const studentEmail of createdStudentEmails) {
            await deleteStudentByEmail(studentEmail);
        }

        for (const courseId of createdCourseIds) {
            await deleteCourseById(courseId);
        }
    });

    test('should display error when no course ID provided', async ({ page }) => {
        await page.goto('/etudiant');

        // Vérifier que l'erreur est affichée
        const errorMessage = page.getByText(/Aucun cours détecté/i);
        await expect(errorMessage).toBeVisible();
    });

    test('should display error for invalid course ID', async ({ page }) => {
        const invalidCourseId = 'invalid-course-12345';
        await page.goto(`/etudiant?cours_id=${invalidCourseId}`);

        // Vérifier que l'erreur est affichée (cours non reconnu)
        const errorMessage = page.getByText(/Cours non reconnu|QR Code/i);
        await expect(errorMessage).toBeVisible();
    });

    test('should show email input when page loads with valid course', async ({ page }) => {
        const activeCourse = await createActiveCourseFixture();
        createdCourseIds.push(activeCourse.courseId);

        await page.goto(`/etudiant?cours_id=${activeCourse.courseId}`);

        const emailInput = page.getByLabel('Adresse email IUT');
        await expect(emailInput).toBeVisible();
    });

    test('should allow entering student email', async ({ page }) => {
        const credentials = await createStudentCredentials();
        createdStudentEmails.push(credentials.email);

        const activeCourse = await createActiveCourseFixture();
        createdCourseIds.push(activeCourse.courseId);
        await page.goto(`/etudiant?cours_id=${activeCourse.courseId}`);

        // Remplir l'email
        const emailInput = page.getByLabel('Adresse email IUT');
        await expect(emailInput).toBeVisible();
        await emailInput.fill(credentials.localPart);

        // Vérifier que l'email est bien rempli (sans le domaine)
        const inputValue = await emailInput.inputValue();
        expect(inputValue).toBe(credentials.localPart);
    });

    test('should format email input correctly on blur', async ({ page }) => {
        const activeCourse = await createActiveCourseFixture();
        createdCourseIds.push(activeCourse.courseId);
        await page.goto(`/etudiant?cours_id=${activeCourse.courseId}`);

        const emailInput = page.getByLabel('Adresse email IUT');
        await expect(emailInput).toBeVisible();

        // Saisir un email avec des majuscules et espaces
        await emailInput.fill('  Jean.Dupont  ');
        await emailInput.blur();

        // Vérifier que l'email est normalisé (minuscules, pas d'espaces)
        const inputValue = await emailInput.inputValue();
        expect(inputValue).toBe('jean.dupont');
    });

    test('should display domain suffix next to email input', async ({ page }) => {
        const activeCourse = await createActiveCourseFixture();
        createdCourseIds.push(activeCourse.courseId);
        await page.goto(`/etudiant?cours_id=${activeCourse.courseId}`);

        // Vérifier que le suffixe de domaine est affiché
        const domainSuffix = page.getByText(`@${STUDENT_EMAIL_DOMAIN}`);
        await expect(domainSuffix).toBeVisible();
    });

    test('student account creation helper should work correctly', async () => {
        // Test du helper de création de compte étudiant
        const randomEmail = `unit-test-${Date.now()}@${STUDENT_EMAIL_DOMAIN}`;
        const testPassword = 'TestPass123!';

        await ensureStudentAccountByEmail(randomEmail, testPassword, {
            firstName: 'UnitTest',
            lastName: 'Student',
            groupId: null,
        });

        // Vérifier que le compte est créé en DB
        const student = await db.select().from(studentTable).where(eq(studentTable.userMail, randomEmail));
        expect(student.length).toBe(1);
        expect(student[0].firstName).toBe('UnitTest');
        expect(student[0].lastName).toBe('Student');

        // Cleanup
        await deleteStudentByEmail(randomEmail);

        // Vérifier que le compte est supprimé
        const deletedStudent = await db.select().from(studentTable).where(eq(studentTable.userMail, randomEmail));
        expect(deletedStudent.length).toBe(0);
    });

    /**
     * NOTE: Tests d'authentification complète et de persistance de session
     * 
     * Les tests suivants requièrent un authentification-fixture avec setup de cours de test,
     * similaire au fixture `authenticated-teacher` utilisé dans les tests professeurs.
     * 
     * Ils devraient être implémentés une fois qu'une fixture complète est disponible:
     * - Test: "should toggle remember checkbox on password step"
     * - Test: "should toggle remember checkbox on password creation step"  
     * - Test: "should create session cookie when 'Rester connecté' is checked"
     * - Test: "should NOT create persistent cookie when 'Rester connecté' is unchecked"
     * - Test: "should auto-attend when returning with valid session cookie"
     */
});
