import { test as baseTest, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db/drizzle';
import { table as resourceTable } from '@/lib/db/schema/resource';
import { table as studentTable } from '@/lib/db/schema/student';
import { table as sessionTable } from '@/lib/db/schema/session';
import { table as groupTable } from '@/lib/db/schema/group';
import { table as sessionGroupTable } from '@/lib/db/schema/session-group';
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
    sessionId: string;
    resourceId: string;
    courseName: string;
};

type StudentCourseAccessFixture = {
    email: string;
    localPart: string;
    password: string;
    groupId: number;
    sessionId: string;
};

type TestCleanupState = {
    createdStudentEmails: string[];
    createdCourseIds: string[];
    createdResourceIds: string[];
    createdGroupIds: number[];
};

const test = baseTest.extend<{ cleanupState: TestCleanupState }>({
    cleanupState: async ({}, registerCleanupState) => {
        const cleanupState: TestCleanupState = {
            createdStudentEmails: [],
            createdCourseIds: [],
            createdResourceIds: [],
            createdGroupIds: [],
        };

        try {
            await registerCleanupState(cleanupState);
        } finally {
            for (const studentEmail of cleanupState.createdStudentEmails) {
                await deleteStudentByEmail(studentEmail);
            }

            for (const courseId of cleanupState.createdCourseIds) {
                await deleteCourseById(courseId);
            }

            for (const resourceId of cleanupState.createdResourceIds) {
                await deleteResourceById(resourceId);
            }

            for (const groupId of cleanupState.createdGroupIds) {
                await deleteGroupById(groupId);
            }
        }
    },
});

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
    const sessionId = randomUUID();
    const resourceId = randomUUID();
    const courseName = `Cours UI ${randomSuffix}`;

    await db.insert(resourceTable).values({
        resourceId,
        subject: courseName,
    });

    await db.insert(sessionTable).values({
        sessionId,
        resourceId,
        subject: courseName,
        startAt: new Date(Date.now() - 5 * 60 * 1000),
        endAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    return { sessionId, resourceId, courseName };
}

async function deleteCourseById(sessionId: string): Promise<void> {
    await db.delete(sessionTable).where(eq(sessionTable.sessionId, sessionId));
}

async function deleteResourceById(resourceId: string): Promise<void> {
    await db.delete(resourceTable).where(eq(resourceTable.resourceId, resourceId));
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

async function linkCourseToGroup(sessionId: string, groupId: number): Promise<void> {
    await db.insert(sessionGroupTable).values({
        sessionId,
        groupId,
    });
}

async function createStudentWithCourseAccessFixture(
    cleanupState: TestCleanupState,
): Promise<StudentCourseAccessFixture> {
    const studentCredentials = await createStudentCredentials();
    const groupId = await createGroupFixture();
    const activeCourse = await createActiveCourseFixture();

    await ensureStudentAccountByEmail(studentCredentials.email, studentCredentials.password, {
        firstName: 'Test',
        lastName: 'Student',
        groupId,
    });

    await linkCourseToGroup(activeCourse.sessionId, groupId);

    cleanupState.createdStudentEmails.push(studentCredentials.email);
    cleanupState.createdCourseIds.push(activeCourse.sessionId);
    cleanupState.createdResourceIds.push(activeCourse.resourceId);
    cleanupState.createdGroupIds.push(groupId);

    return {
        email: studentCredentials.email,
        localPart: studentCredentials.localPart,
        password: studentCredentials.password,
        groupId,
        sessionId: activeCourse.sessionId,
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

async function countAttendanceRecords(sessionId: string, studentEmail: string): Promise<number> {
    const attendanceRecords = await db
        .select({ attendanceId: attendanceTable.attendanceId })
        .from(attendanceTable)
        .where(
            and(
                eq(attendanceTable.sessionId, sessionId),
                eq(attendanceTable.studentMail, studentEmail),
            ),
        );

    return attendanceRecords.length;
}

async function deleteAttendanceRecords(sessionId: string, studentEmail: string): Promise<void> {
    await db.delete(attendanceTable).where(
        and(
            eq(attendanceTable.sessionId, sessionId),
            eq(attendanceTable.studentMail, studentEmail),
        ),
    );
}

test.describe('Student attendance UI and session persistence', () => {
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

    test('should show email input when page loads with valid course', async ({ page, cleanupState }) => {
        const activeCourse = await createActiveCourseFixture();
        cleanupState.createdCourseIds.push(activeCourse.sessionId);

        await page.goto(`/etudiant?cours_id=${activeCourse.sessionId}`);

        const emailInput = page.getByLabel('Adresse email IUT');
        await expect(emailInput).toBeVisible();
    });

    test('should allow entering student email', async ({ page, cleanupState }) => {
        const credentials = await createStudentCredentials();
        cleanupState.createdStudentEmails.push(credentials.email);

        const activeCourse = await createActiveCourseFixture();
        cleanupState.createdCourseIds.push(activeCourse.sessionId);
        await page.goto(`/etudiant?cours_id=${activeCourse.sessionId}`);

        // Remplir l'email
        const emailInput = page.getByLabel('Adresse email IUT');
        await expect(emailInput).toBeVisible();
        await emailInput.fill(credentials.localPart);

        // Vérifier que l'email est bien rempli (sans le domaine)
        const inputValue = await emailInput.inputValue();
        expect(inputValue).toBe(credentials.localPart);
    });

    test('should format email input correctly on blur', async ({ page, cleanupState }) => {
        const activeCourse = await createActiveCourseFixture();
        cleanupState.createdCourseIds.push(activeCourse.sessionId);
        await page.goto(`/etudiant?cours_id=${activeCourse.sessionId}`);

        const emailInput = page.getByLabel('Adresse email IUT');
        await expect(emailInput).toBeVisible();

        // Saisir un email avec des majuscules et espaces
        await emailInput.fill('  Jean.Dupont  ');
        await emailInput.blur();

        // Vérifier que l'email est normalisé (minuscules, pas d'espaces)
        const inputValue = await emailInput.inputValue();
        expect(inputValue).toBe('jean.dupont');
    });

    test('should display domain suffix next to email input', async ({ page, cleanupState }) => {
        const activeCourse = await createActiveCourseFixture();
        cleanupState.createdCourseIds.push(activeCourse.sessionId);
        await page.goto(`/etudiant?cours_id=${activeCourse.sessionId}`);

        // Vérifier que le suffixe de domaine est affiché
        const domainSuffix = page.getByText(`@${STUDENT_EMAIL_DOMAIN}`);
        await expect(domainSuffix).toBeVisible();
    });

    test('student account creation helper should work correctly', async ({ cleanupState }) => {
        // Test du helper de création de compte étudiant
        const randomEmail = `unit-test-${Date.now()}@${STUDENT_EMAIL_DOMAIN}`;
        const testPassword = 'TestPass123!';

        // Register test account for global cleanup in case this test fails before manual cleanup.
        cleanupState.createdStudentEmails.push(randomEmail);

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
        cleanupState.createdStudentEmails = cleanupState.createdStudentEmails.filter(
            (studentEmail) => studentEmail !== randomEmail,
        );

        // Vérifier que le compte est supprimé
        const deletedStudent = await db.select().from(studentTable).where(eq(studentTable.userMail, randomEmail));
        expect(deletedStudent.length).toBe(0);
    });

    test('should create student_session cookie with persistent flag depending on remember option', async ({ page, cleanupState }, testInfo) => {
        const rememberedStudentFixture = await createStudentWithCourseAccessFixture(cleanupState);

        await page.goto(`/etudiant?cours_id=${rememberedStudentFixture.sessionId}`);
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

        const notRememberedStudentFixture = await createStudentWithCourseAccessFixture(cleanupState);

        const baseUrl = testInfo.project.use.baseURL;
        if (typeof baseUrl !== 'string' || baseUrl.length === 0) {
            throw new Error('Playwright baseURL is required to create a second isolated context');
        }

        const secondContext = await page.context().browser()?.newContext({ baseURL: baseUrl });
        if (!secondContext) {
            throw new Error('Failed to create second browser context for non-persistent cookie check');
        }

        try {
            const secondPage = await secondContext.newPage();
            await secondPage.goto(`/etudiant?cours_id=${notRememberedStudentFixture.sessionId}`);
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
        } finally {
            await secondContext.close();
        }
    });

    test('should auto-attend student after reload when session is valid', async ({ page, cleanupState }) => {
        const studentAccessFixture = await createStudentWithCourseAccessFixture(cleanupState);

        await page.goto(`/etudiant?cours_id=${studentAccessFixture.sessionId}`);
        await signInStudentFromAttendancePage(
            page,
            studentAccessFixture.localPart,
            studentAccessFixture.password,
            true,
        );

        expect(
            await countAttendanceRecords(studentAccessFixture.sessionId, studentAccessFixture.email),
        ).toBe(1);

        await deleteAttendanceRecords(studentAccessFixture.sessionId, studentAccessFixture.email);
        expect(
            await countAttendanceRecords(studentAccessFixture.sessionId, studentAccessFixture.email),
        ).toBe(0);

        await page.reload();
        await expect(page.getByText('Présence validée')).toBeVisible();

        expect(
            await countAttendanceRecords(studentAccessFixture.sessionId, studentAccessFixture.email),
        ).toBe(1);
    });

    test('should show non-attended dialog and reset student session when user changes account', async ({ page, cleanupState }) => {
        const studentAccessFixture = await createStudentWithCourseAccessFixture(cleanupState);

        const unauthorizedCourse = await createActiveCourseFixture();
        cleanupState.createdCourseIds.push(unauthorizedCourse.sessionId);

        await page.goto(`/etudiant?cours_id=${studentAccessFixture.sessionId}`);
        await signInStudentFromAttendancePage(
            page,
            studentAccessFixture.localPart,
            studentAccessFixture.password,
            true,
        );

        await page.goto(`/etudiant?cours_id=${unauthorizedCourse.sessionId}`);

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
