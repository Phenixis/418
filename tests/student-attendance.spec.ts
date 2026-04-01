import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db/drizzle';
import { table as studentTable } from '@/lib/db/schema/student';
import { table as courseTable } from '@/lib/db/schema/course';
import { table as groupTable } from '@/lib/db/schema/group';
import { table as courseGroupTable } from '@/lib/db/schema/course-group';
import { table as attendanceTable } from '@/lib/db/schema/attendance';
import { ensureStudentAccountByEmail, deleteStudentAccountByEmail } from './helpers/test-account';
import { and, eq } from 'drizzle-orm';

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

type StudentCourseAccessFixture = {
    email: string;
    localPart: string;
    password: string;
    groupId: number;
    courseId: string;
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
    const randomSuffix = Math.random().toString(36).slice(2, 10);
    const courseId = randomUUID();
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

async function createGroupFixture(): Promise<number> {
    const randomSuffix = Math.floor(Math.random() * 9_999_999).toString().padStart(7, '0');
    const [createdGroup] = await db.insert(groupTable).values({
        promo: '4',
        td: 'A',
        tp: '1',
        department: `D${randomSuffix.slice(0, 2)}`,
        codePath: `C${randomSuffix.slice(2, 4)}`,
        descriptionPath: `Test path ${randomSuffix}`,
    }).returning({ groupId: groupTable.groupId });

    return createdGroup.groupId;
}

async function deleteGroupById(groupId: number): Promise<void> {
    await db.delete(groupTable).where(eq(groupTable.groupId, groupId));
}

async function linkCourseToGroup(courseId: string, groupId: number): Promise<void> {
    await db.insert(courseGroupTable).values({
        courseId,
        groupId,
    });
}

async function createStudentWithCourseAccessFixture(): Promise<StudentCourseAccessFixture> {
    const studentCredentials = await createStudentCredentials();
    const groupId = await createGroupFixture();
    const activeCourse = await createActiveCourseFixture();

    await ensureStudentAccountByEmail(studentCredentials.email, studentCredentials.password, {
        firstName: 'Test',
        lastName: 'Student',
        groupId,
    });

    await linkCourseToGroup(activeCourse.courseId, groupId);

    return {
        email: studentCredentials.email,
        localPart: studentCredentials.localPart,
        password: studentCredentials.password,
        groupId,
        courseId: activeCourse.courseId,
    };
}

async function signInStudentFromAttendancePage(
    page: Page,
    studentEmailLocalPart: string,
    studentPassword: string,
    shouldRememberSession: boolean,
): Promise<void> {
    const emailInput = page.getByLabel('Adresse email IUT');
    await expect(emailInput).toBeVisible();
    await emailInput.fill(studentEmailLocalPart);

    await page.getByRole('button', { name: 'Suivant' }).click();

    const passwordInput = page.getByLabel('Mot de passe', { exact: true });
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill(studentPassword);

    const rememberCheckbox = page.getByLabel('Rester connecté');
    await expect(rememberCheckbox).toBeVisible();
    if (shouldRememberSession) {
        await rememberCheckbox.click();
        await expect(rememberCheckbox).toBeChecked();
    } else {
        await expect(rememberCheckbox).not.toBeChecked();
    }

    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByText('Présence validée')).toBeVisible();
}

async function countAttendanceRecords(courseId: string, studentEmail: string): Promise<number> {
    const attendanceRecords = await db
        .select({ attendanceId: attendanceTable.attendanceId })
        .from(attendanceTable)
        .where(
            and(
                eq(attendanceTable.courseId, courseId),
                eq(attendanceTable.studentMail, studentEmail),
            ),
        );

    return attendanceRecords.length;
}

async function deleteAttendanceRecords(courseId: string, studentEmail: string): Promise<void> {
    await db.delete(attendanceTable).where(
        and(
            eq(attendanceTable.courseId, courseId),
            eq(attendanceTable.studentMail, studentEmail),
        ),
    );
}

test.describe('Student attendance UI and session persistence', () => {
    let createdStudentEmails: string[] = [];
    let createdCourseIds: string[] = [];
    let createdGroupIds: number[] = [];

    test.beforeEach(async () => {
        createdStudentEmails = [];
        createdCourseIds = [];
        createdGroupIds = [];
    });

    test.afterEach(async () => {
        for (const studentEmail of createdStudentEmails) {
            await deleteStudentByEmail(studentEmail);
        }

        for (const courseId of createdCourseIds) {
            await deleteCourseById(courseId);
        }

        for (const groupId of createdGroupIds) {
            await deleteGroupById(groupId);
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

        // Register test account for global cleanup in case this test fails before manual cleanup.
        createdStudentEmails.push(randomEmail);

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
        createdStudentEmails = createdStudentEmails.filter(
            (studentEmail) => studentEmail !== randomEmail,
        );

        // Vérifier que le compte est supprimé
        const deletedStudent = await db.select().from(studentTable).where(eq(studentTable.userMail, randomEmail));
        expect(deletedStudent.length).toBe(0);
    });

    test('should create student_session cookie with persistent flag depending on remember option', async ({ page }) => {
        const rememberedStudentFixture = await createStudentWithCourseAccessFixture();
        createdStudentEmails.push(rememberedStudentFixture.email);
        createdCourseIds.push(rememberedStudentFixture.courseId);
        createdGroupIds.push(rememberedStudentFixture.groupId);

        await page.goto(`/etudiant?cours_id=${rememberedStudentFixture.courseId}`);
        await signInStudentFromAttendancePage(
            page,
            rememberedStudentFixture.localPart,
            rememberedStudentFixture.password,
            true,
        );

        const rememberedCookie = (await page.context().cookies()).find(
            (cookie) => cookie.name === 'student_session',
        );

        expect(rememberedCookie).toBeDefined();
        if (!rememberedCookie) {
            throw new Error('student_session cookie should exist when remember option is enabled');
        }

        const currentEpochInSeconds = Math.floor(Date.now() / 1000);
        expect(rememberedCookie.expires).toBeGreaterThan(currentEpochInSeconds + 24 * 60 * 60);

        const notRememberedStudentFixture = await createStudentWithCourseAccessFixture();
        createdStudentEmails.push(notRememberedStudentFixture.email);
        createdCourseIds.push(notRememberedStudentFixture.courseId);
        createdGroupIds.push(notRememberedStudentFixture.groupId);

        const secondContext = await page.context().browser()?.newContext();
        if (!secondContext) {
            throw new Error('Failed to create second browser context for non-persistent cookie check');
        }

        const secondPage = await secondContext.newPage();
        await secondPage.goto(`/etudiant?cours_id=${notRememberedStudentFixture.courseId}`);
        await signInStudentFromAttendancePage(
            secondPage,
            notRememberedStudentFixture.localPart,
            notRememberedStudentFixture.password,
            false,
        );

        const sessionCookie = (await secondContext.cookies()).find(
            (cookie) => cookie.name === 'student_session',
        );

        expect(sessionCookie).toBeDefined();
        if (!sessionCookie) {
            throw new Error('student_session cookie should exist when remember option is disabled');
        }

        expect(sessionCookie.expires).toBe(-1);
        await secondContext.close();
    });

    test('should auto-attend student after reload when session is valid', async ({ page }) => {
        const studentAccessFixture = await createStudentWithCourseAccessFixture();
        createdStudentEmails.push(studentAccessFixture.email);
        createdCourseIds.push(studentAccessFixture.courseId);
        createdGroupIds.push(studentAccessFixture.groupId);

        await page.goto(`/etudiant?cours_id=${studentAccessFixture.courseId}`);
        await signInStudentFromAttendancePage(
            page,
            studentAccessFixture.localPart,
            studentAccessFixture.password,
            true,
        );

        expect(
            await countAttendanceRecords(studentAccessFixture.courseId, studentAccessFixture.email),
        ).toBe(1);

        await deleteAttendanceRecords(studentAccessFixture.courseId, studentAccessFixture.email);
        expect(
            await countAttendanceRecords(studentAccessFixture.courseId, studentAccessFixture.email),
        ).toBe(0);

        await page.reload();
        await expect(page.getByText('Présence validée')).toBeVisible();

        expect(
            await countAttendanceRecords(studentAccessFixture.courseId, studentAccessFixture.email),
        ).toBe(1);
    });

    test('should show non-attended dialog and reset student session when user changes account', async ({ page }) => {
        const studentAccessFixture = await createStudentWithCourseAccessFixture();
        createdStudentEmails.push(studentAccessFixture.email);
        createdCourseIds.push(studentAccessFixture.courseId);
        createdGroupIds.push(studentAccessFixture.groupId);

        const unauthorizedCourse = await createActiveCourseFixture();
        createdCourseIds.push(unauthorizedCourse.courseId);

        await page.goto(`/etudiant?cours_id=${studentAccessFixture.courseId}`);
        await signInStudentFromAttendancePage(
            page,
            studentAccessFixture.localPart,
            studentAccessFixture.password,
            true,
        );

        await page.goto(`/etudiant?cours_id=${unauthorizedCourse.courseId}`);

        await expect(page.getByRole('heading', { name: 'Vérification du compte' })).toBeVisible();
        await expect(page.getByText(/n'est pas inscrit à ce cours/i)).toBeVisible();

        await page.getByRole('button', { name: 'Non, changer de compte' }).click();

        await expect(page.getByLabel('Adresse email IUT')).toBeVisible();
        await expect(page.getByRole('heading', { name: 'Vérification du compte' })).not.toBeVisible();

        await expect.poll(async () => {
            const sessionCookie = (await page.context().cookies()).find(
                (cookie) => cookie.name === 'student_session',
            );
            return Boolean(sessionCookie);
        }).toBe(false);

        await page.reload();
        await expect(page.getByLabel('Adresse email IUT')).toBeVisible();
    });
});
