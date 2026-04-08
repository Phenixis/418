import { SignJWT } from 'jose';
import { test as base, type Page, type TestInfo } from '@playwright/test';
import {
    deleteTeacherAccountByEmail,
    ensureTeacherAccountByEmail,
    getTestAccountPassword,
} from '../helpers/test-account';
import { db } from '@/lib/db/drizzle';
import { table as resourceTable } from '@/lib/db/schema/resource';
import { table as resourceTeacherTable } from '@/lib/db/schema/resource-teacher';
import { table as sessionTable } from '@/lib/db/schema/session';
import { eq } from 'drizzle-orm';

const SESSION_COOKIE_NAME = 'teacher_session';
const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

type TeacherSessionPayload = {
    expires: string;
    teacherEmail: string;
    isPersistentSession: boolean;
};

type AuthenticatedTeacherFixtures = {
    authenticatedPage: Page;
    testTeacherEmail: string;
};

function buildTestTeacherEmail(testInfo: TestInfo): string {
    if (process.env.TEST_ACCOUNT_EMAIL) {
        return process.env.TEST_ACCOUNT_EMAIL;
    }

    const projectSuffix = testInfo.project.name.replaceAll(' ', '-').toLowerCase();
    const normalizedTestId = testInfo.testId
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, '-')
        .slice(-40);

    return `teacher.e2e.${projectSuffix}.${normalizedTestId}@univ-rennes.fr`;
}

function getAuthSecret(): string {
    const authSecret = process.env.AUTH_SECRET;

    if (!authSecret) {
        throw new Error('AUTH_SECRET doit être défini pour générer le cookie de session des tests E2E.');
    }

    return authSecret;
}

async function createSessionToken(payload: TeacherSessionPayload): Promise<string> {
    const authSecretKey = new TextEncoder().encode(getAuthSecret());
    const expirationTimestamp = Math.floor(new Date(payload.expires).getTime() / 1000);

    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(expirationTimestamp)
        .sign(authSecretKey);
}

async function setAuthenticatedTeacherCookie(page: Page, teacherEmail: string, baseURL = 'http://localhost:3005'): Promise<void> {
    const cookieDomain = new URL(baseURL).hostname;
    const sessionExpirationDate = new Date(Date.now() + ONE_DAY_IN_MILLISECONDS);
    const sessionToken = await createSessionToken({
        expires: sessionExpirationDate.toISOString(),
        teacherEmail,
        isPersistentSession: true,
    });

    await page.context().addCookies([
        {
            name: SESSION_COOKIE_NAME,
            value: sessionToken,
            domain: cookieDomain,
            path: '/',
            httpOnly: true,
            sameSite: 'Lax',
            secure: false,
            expires: Math.floor(sessionExpirationDate.getTime() / 1000),
        },
    ]);
}

async function createTeacherTestResources(teacherEmail: string): Promise<string> {
    const timestamp = Date.now();
    const resourceId = `e2e-res-${timestamp.toString(36)}`;
    const ONE_HOUR = 3_600_000;

    await db.insert(resourceTable).values({
        resourceId,
        subject: 'Ressource Test E2E',
    });

    await db.insert(resourceTeacherTable).values({
        resourceId,
        teacherMail: teacherEmail,
    });

    await db.insert(sessionTable).values([
        {
            sessionId: `${resourceId}-past`,
            resourceId,
            subject: 'Séance passée E2E',
            startAt: new Date(timestamp - 3 * ONE_HOUR),
            endAt: new Date(timestamp - 2 * ONE_HOUR),
        },
        {
            sessionId: `${resourceId}-now`,
            resourceId,
            subject: 'Séance en cours E2E',
            startAt: new Date(timestamp - ONE_HOUR),
            endAt: new Date(timestamp + ONE_HOUR),
        },
        {
            sessionId: `${resourceId}-fut`,
            resourceId,
            subject: 'Séance future E2E',
            startAt: new Date(timestamp + 2 * ONE_HOUR),
            endAt: new Date(timestamp + 3 * ONE_HOUR),
        },
    ]);

    return resourceId;
}

async function deleteTeacherTestResources(resourceId: string): Promise<void> {
    await db.delete(resourceTable).where(eq(resourceTable.resourceId, resourceId));
}

export const test = base.extend<AuthenticatedTeacherFixtures>({
    testTeacherEmail: async ({}, use, testInfo) => {
        const testTeacherEmail = buildTestTeacherEmail(testInfo);
        await use(testTeacherEmail);
    },
    authenticatedPage: async ({ page, baseURL, testTeacherEmail }, use) => {
        const shouldCleanupTeacherAccount = !process.env.TEST_ACCOUNT_EMAIL;

        await ensureTeacherAccountByEmail(testTeacherEmail, getTestAccountPassword());
        await setAuthenticatedTeacherCookie(page, testTeacherEmail, baseURL);

        const testResourceId = await createTeacherTestResources(testTeacherEmail);

        try {
            await use(page);
        } finally {
            await deleteTeacherTestResources(testResourceId);

            if (shouldCleanupTeacherAccount) {
                await deleteTeacherAccountByEmail(testTeacherEmail);
            }
        }
    },
});

export { expect } from '@playwright/test';
