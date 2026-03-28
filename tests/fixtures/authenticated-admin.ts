import { SignJWT } from 'jose';
import { test as base, type Page } from '@playwright/test';
import { ensureTeacherAccountByEmail } from '../helpers/test-account';

const SESSION_COOKIE_NAME = 'teacher_session';
const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD ?? 'MotDePasse1';

type TeacherSessionPayload = {
    expires: string;
    teacherEmail: string;
    isPersistentSession: boolean;
};

type AuthenticatedAdminFixtures = {
    authenticatedAdminPage: Page;
    testAdminEmail: string;
};

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
        const projectSuffix = testInfo.project.name.replaceAll(' ', '-').toLowerCase();
        const testAdminEmail = process.env.TEST_ADMIN_EMAIL ?? `admin.e2e.${projectSuffix}@univ-rennes.fr`;

        await ensureTeacherAccountByEmail(testAdminEmail, TEST_ADMIN_PASSWORD, {
            isAdmin: true,
            isValidated: true,
            firstName: 'Admin',
            lastName: 'E2E',
        });

        await setAuthenticatedAdminCookie(page, testAdminEmail, baseURL);
        await use(page);
    },
    testAdminEmail: async ({}, use, testInfo) => {
        const projectSuffix = testInfo.project.name.replaceAll(' ', '-').toLowerCase();
        const testAdminEmail = process.env.TEST_ADMIN_EMAIL ?? `admin.e2e.${projectSuffix}@univ-rennes.fr`;
        await use(testAdminEmail);
    },
});

export { expect } from '@playwright/test';
