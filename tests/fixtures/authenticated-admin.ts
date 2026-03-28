import { SignJWT } from 'jose';
import { test as base, type Page, type TestInfo } from '@playwright/test';
import {
    deleteTeacherAccountByEmail,
    ensureTeacherAccountByEmail,
} from '../helpers/test-account';

const SESSION_COOKIE_NAME = 'teacher_session';
const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const TEST_ADMIN_PASSWORD = process.env.TEST_ACCOUNT_PASSWORD ?? 'MotDePasse1';

type TeacherSessionPayload = {
    expires: string;
    teacherEmail: string;
    isPersistentSession: boolean;
};

type AuthenticatedAdminFixtures = {
    authenticatedAdminPage: Page;
    testAdminEmail: string;
};

function buildTestAdminEmail(testInfo: TestInfo): string {
    if (process.env.TEST_ACCOUNT_EMAIL) {
        return process.env.TEST_ACCOUNT_EMAIL;
    }

    const projectSuffix = testInfo.project.name.replaceAll(' ', '-').toLowerCase();
    const normalizedTestId = testInfo.testId
        .toLowerCase()
        .replaceAll(/[^a-z0-9]+/g, '-')
        .slice(-40);

    return `admin.e2e.${projectSuffix}.${normalizedTestId}@univ-rennes.fr`;
}

function getAuthSecret(): string {
    const authSecret = process.env.AUTH_SECRET;

    if (!authSecret) {
        throw new Error('AUTH_SECRET doit etre defini pour generer le cookie de session des tests E2E.');
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

async function setAuthenticatedAdminCookie(page: Page, teacherEmail: string, baseURL = 'http://localhost:3005'): Promise<void> {
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

export const test = base.extend<AuthenticatedAdminFixtures>({
    authenticatedAdminPage: async ({ page, baseURL }, use, testInfo) => {
        const testAdminEmail = buildTestAdminEmail(testInfo);
        const shouldCleanupAdminAccount = !process.env.TEST_ACCOUNT_EMAIL;

        await ensureTeacherAccountByEmail(testAdminEmail, TEST_ADMIN_PASSWORD, {
            isAdmin: true,
            isValidated: true,
            firstName: 'Admin',
            lastName: 'E2E',
        });

        await setAuthenticatedAdminCookie(page, testAdminEmail, baseURL);

        try {
            await use(page);
        } finally {
            if (shouldCleanupAdminAccount) {
                await deleteTeacherAccountByEmail(testAdminEmail);
            }
        }
    },
    testAdminEmail: async ({}, use, testInfo) => {
        const testAdminEmail = buildTestAdminEmail(testInfo);
        await use(testAdminEmail);
    },
});

export { expect } from '@playwright/test';
