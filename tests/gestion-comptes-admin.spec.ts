import { expect, test } from './fixtures/authenticated-admin';
import { SignJWT } from 'jose';
import type { Page } from '@playwright/test';
import {
    deleteTeacherAccountByEmail,
    ensureTeacherAccountByEmail,
} from './helpers/test-account';

const ADMIN_ACCOUNTS_ROUTE = '/administrateur/gestion-comptes';
const TEACHER_DASHBOARD_ROUTE = '/professeur/dashboard';
const LOGIN_ROUTE = '/professeur/connexion';
const SESSION_COOKIE_NAME = 'teacher_session';
const ONE_DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

type TeacherSessionPayload = {
    expires: string;
    teacherEmail: string;
    isPersistentSession: boolean;
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

async function expandTeachersSection(page: Page): Promise<void> {
    const statusColumn = page.getByRole('columnheader', { name: 'Statut' });

    if (await statusColumn.count() > 0 && await statusColumn.first().isVisible()) {
        return;
    }

    await page.getByRole('button', { name: 'Liste des professeurs' }).click();
    await expect(statusColumn).toBeVisible();
}

async function expandStudentsSection(page: Page): Promise<void> {
    const studentSectionText = page.getByText('Cette section est en cours de développement.');

    if (await studentSectionText.count() > 0 && await studentSectionText.first().isVisible()) {
        return;
    }

    await page.getByRole('button', { name: 'Liste des étudiants' }).click();
    await expect(studentSectionText).toBeVisible();
}

function getTeacherRowByEmail(page: Page, teacherEmail: string) {
    return page.locator('tbody tr', { hasText: teacherEmail }).first();
}

async function openRefuseAccountAction(page: Page, teacherRow: ReturnType<typeof getTeacherRowByEmail>) {
    const refuseMenuItem = page.getByRole('menuitem', { name: 'Refuser le compte' });

    if (await refuseMenuItem.count() === 0) {
        await teacherRow.getByRole('button', { name: 'Open actions menu' }).click();
    }

    await expect(refuseMenuItem).toBeVisible();
    return refuseMenuItem;
}

function buildUniqueTeacherEmail(prefix: string): string {
    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    return `${prefix}.${uniqueSuffix}@univ-rennes.fr`;
}

test.describe('Page administrateur - gestion des comptes', () => {
    let createdTeacherEmails: string[] = [];

    test.beforeEach(() => {
        createdTeacherEmails = [];
    });

    test.afterEach(async () => {
        for (const teacherEmail of createdTeacherEmails) {
            await deleteTeacherAccountByEmail(teacherEmail);
        }
    });

    test('redirige vers la connexion quand il n y a pas de session', async ({ page }) => {
        await page.goto(ADMIN_ACCOUNTS_ROUTE);

        await expect(page).toHaveURL(new RegExp(`${LOGIN_ROUTE}(\\?.*)?$`));
    });

    test('redirige vers le dashboard pour un enseignant non administrateur', async ({ page }) => {
        const nonAdminTeacherEmail = buildUniqueTeacherEmail('admin-guard');
        createdTeacherEmails.push(nonAdminTeacherEmail);

        await ensureTeacherAccountByEmail(nonAdminTeacherEmail, 'Totoro123', {
            isAdmin: false,
            isValidated: true,
            firstName: 'Non',
            lastName: 'Admin',
        });
        await setAuthenticatedTeacherCookie(page, nonAdminTeacherEmail);

        await page.goto(ADMIN_ACCOUNTS_ROUTE);

        await expect(page).toHaveURL(new RegExp(`${TEACHER_DASHBOARD_ROUTE}$`));
    });

    test('affiche la page et les sections principales pour un administrateur', async ({ authenticatedAdminPage }) => {
        await authenticatedAdminPage.goto(ADMIN_ACCOUNTS_ROUTE);

        await expect(authenticatedAdminPage.getByRole('heading', { name: 'Gestion des comptes' })).toBeVisible();
        await expect(authenticatedAdminPage.getByRole('heading', { name: 'Liste des professeurs' })).toBeVisible();
        await expect(authenticatedAdminPage.getByRole('heading', { name: 'Liste des étudiants' })).toBeVisible();
        await expandStudentsSection(authenticatedAdminPage);

        await expandTeachersSection(authenticatedAdminPage);
    });

    test('affiche les informations de compte dans le tableau enseignant', async ({ authenticatedAdminPage }) => {
        const pendingTeacherEmail = buildUniqueTeacherEmail('pending-list');
        createdTeacherEmails.push(pendingTeacherEmail);

        await ensureTeacherAccountByEmail(pendingTeacherEmail, 'Totoro123', {
            isAdmin: false,
            isValidated: false,
            firstName: 'Pending',
            lastName: 'List',
        });

        await authenticatedAdminPage.goto(ADMIN_ACCOUNTS_ROUTE);
        await expandTeachersSection(authenticatedAdminPage);

        await expect(authenticatedAdminPage.getByRole('columnheader', { name: 'Statut' })).toBeVisible();
        await expect(authenticatedAdminPage.getByRole('columnheader', { name: 'Nom' })).toBeVisible();
        await expect(authenticatedAdminPage.getByRole('columnheader', { name: 'Email' })).toBeVisible();
        await expect(authenticatedAdminPage.getByRole('columnheader', { name: 'Rôle' })).toBeVisible();

        const pendingTeacherRow = getTeacherRowByEmail(authenticatedAdminPage, pendingTeacherEmail);

        await expect(pendingTeacherRow).toContainText('Pending List');
        await expect(pendingTeacherRow).toContainText('Enseignant');
        await expect(pendingTeacherRow).toContainText('Non validé');
    });

    test('permet de valider un compte non validé', async ({ authenticatedAdminPage }) => {
        const pendingTeacherEmail = buildUniqueTeacherEmail('pending-validate');
        createdTeacherEmails.push(pendingTeacherEmail);

        await ensureTeacherAccountByEmail(pendingTeacherEmail, 'Totoro123', {
            isAdmin: false,
            isValidated: false,
            firstName: 'Pending',
            lastName: 'Validate',
        });

        await authenticatedAdminPage.goto(ADMIN_ACCOUNTS_ROUTE);
        await expandTeachersSection(authenticatedAdminPage);

        const pendingTeacherRow = getTeacherRowByEmail(authenticatedAdminPage, pendingTeacherEmail);

        await pendingTeacherRow.getByRole('button', { name: 'Open actions menu' }).click();
        await authenticatedAdminPage.getByRole('menuitem', { name: 'Valider le compte' }).click();

        await expect(pendingTeacherRow).toContainText('Validé');

        await pendingTeacherRow.getByRole('button', { name: 'Open actions menu' }).click();
        await expect(authenticatedAdminPage.getByRole('menuitem', { name: 'Valider le compte' })).toHaveCount(0);
        await expect(authenticatedAdminPage.getByRole('menuitem', { name: 'Refuser le compte' })).toHaveCount(0);
        await expect(authenticatedAdminPage.getByRole('menuitem', { name: 'Supprimer le compte' })).toBeVisible();
    });

    test('permet d annuler puis de confirmer le refus d un compte non validé', async ({ authenticatedAdminPage }) => {
        const pendingTeacherEmail = buildUniqueTeacherEmail('pending-refuse');
        createdTeacherEmails.push(pendingTeacherEmail);

        await ensureTeacherAccountByEmail(pendingTeacherEmail, 'Totoro123', {
            isAdmin: false,
            isValidated: false,
            firstName: 'Pending',
            lastName: 'Refuse',
        });

        await authenticatedAdminPage.goto(ADMIN_ACCOUNTS_ROUTE);
        await expandTeachersSection(authenticatedAdminPage);

        const pendingTeacherRow = getTeacherRowByEmail(authenticatedAdminPage, pendingTeacherEmail);

        const firstRefusalAction = await openRefuseAccountAction(authenticatedAdminPage, pendingTeacherRow);
        await firstRefusalAction.click();

        const refuseDialog = authenticatedAdminPage.getByRole('alertdialog');
        await expect(refuseDialog).toBeVisible();
        await expect(refuseDialog).toContainText(pendingTeacherEmail);

        await refuseDialog.getByRole('button', { name: 'Annuler' }).click();
        await expect(refuseDialog).toHaveCount(0);
        await expect(getTeacherRowByEmail(authenticatedAdminPage, pendingTeacherEmail)).toHaveCount(1);

        const secondRefusalAction = await openRefuseAccountAction(authenticatedAdminPage, pendingTeacherRow);
        await secondRefusalAction.click();

        const refusalDialog = authenticatedAdminPage.getByRole('alertdialog');
        const refusalSubmissionPromise = authenticatedAdminPage.waitForResponse((response) => {
            return response.url().includes('/administrateur/gestion-comptes')
                && response.request().method() === 'POST';
        });

        await refusalDialog.getByRole('button', { name: 'Refuser' }).click();
        await refusalSubmissionPromise;

        await authenticatedAdminPage.goto(ADMIN_ACCOUNTS_ROUTE);
        await expandTeachersSection(authenticatedAdminPage);
        await expect(getTeacherRowByEmail(authenticatedAdminPage, pendingTeacherEmail)).toHaveCount(0);
    });
});
