import { SignJWT } from 'jose';
import { test as base, type Page } from '@playwright/test';
import {
    ensureTestTeacherAccount,
    getTestAccountEmail,
} from '../helpers/test-account';

const SESSION_COOKIE_NAME = 'teacher_session';
const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

type TeacherSessionPayload = {
    expires: string;
    teacherEmail: string;
    isPersistentSession: boolean;
};

type AuthenticatedTeacherFixtures = {
    authenticatedPage: Page;
};

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

async function setAuthenticatedTeacherCookie(page: Page, baseURL = 'http://localhost:3005'): Promise<void> {
    const cookieDomain = new URL(baseURL).hostname;
    const sessionExpirationDate = new Date(Date.now() + ONE_DAY_IN_MILLISECONDS);
    const sessionToken = await createSessionToken({
        expires: sessionExpirationDate.toISOString(),
        teacherEmail: getTestAccountEmail(),
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

export const test = base.extend<AuthenticatedTeacherFixtures>({
    authenticatedPage: async ({ page, baseURL }, use) => {
        await ensureTestTeacherAccount();
        await setAuthenticatedTeacherCookie(page, baseURL);
        await use(page);
    },
});

export { expect } from '@playwright/test';
