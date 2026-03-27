import { test, expect } from '@playwright/test';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db/drizzle';
import { table as teacherTable } from '@/lib/db/schema/teacher';
import {
    ensureTestTeacherAccount,
} from './helpers/test-account';

async function createLoginTeacherCredentials(): Promise<{ localPart: string; password: string }> {
    const randomSuffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const localPart = `login.${randomSuffix}`;
    const password = `ValidPass1!${randomSuffix}`;
    const hashedPassword = await bcrypt.hash(password, 12);

    await db.insert(teacherTable).values({
        userMail: `${localPart}@univ-rennes.fr`,
        firstName: 'Login',
        lastName: 'Test',
        password: hashedPassword,
        isTeacher: true,
    });

    return { localPart, password };
}

test.describe('Connexion page', () => {

    test.beforeEach(async ({ page }) => {
        await ensureTestTeacherAccount();
        await page.goto('/professeur/connexion');
    });

    test('should display the connexion form', async ({ page }) => {
        const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Mot de passe');
        const rememberCheckbox = page.getByLabel('Rester connecté');
        const submitButton = page.getByRole('button', { name: 'Se connecter' });

        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        await expect(rememberCheckbox).toBeVisible();
        await expect(submitButton).toBeVisible();
    });

    test('should allow toggling remember checkbox', async ({ page }) => {
        const rememberCheckbox = page.getByLabel('Rester connecté');

        await expect(rememberCheckbox).not.toBeChecked();
        await rememberCheckbox.click();
        await expect(rememberCheckbox).toBeChecked();
        await rememberCheckbox.click();
        await expect(rememberCheckbox).not.toBeChecked();
    });

    test('should show error message on invalid credentials', async ({ page }) => {
        const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Mot de passe');
        const submitButton = page.getByRole('button', { name: 'Se connecter' });

        await emailInput.fill('invaliduser');
        await passwordInput.fill('wrongpassword');
        await submitButton.click();

        const errorMessage = page.getByText('Email ou mot de passe incorrect.');
        await expect(errorMessage).toBeVisible();
    });

    test('should redirect to dashboard on successful login', async ({ page }) => {
        const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Mot de passe');
        const submitButton = page.getByRole('button', { name: 'Se connecter' });
        const loginTeacherCredentials = await createLoginTeacherCredentials();

        await emailInput.fill(loginTeacherCredentials.localPart);
        await passwordInput.fill(loginTeacherCredentials.password);
        await expect(submitButton).toBeEnabled();
        await submitButton.click();

        await expect(page).toHaveURL('/professeur/dashboard', { timeout: 15_000 });
    });

    test('should remove mail domain if user enters it', async ({ page }) => {
        const emailInput = page.getByLabel('Email');

        await emailInput.fill('benoit.tottereau@univ-rennes.fr');
        await emailInput.blur();

        await expect(emailInput).toHaveValue('benoit.tottereau');
    });

    test('should display the mail domain after the mailInput', async ({ page }) => {
        // there should be a text "@univ-rennes.fr", placed after the email input to indicate that the user only needs to enter the first part of their email
        // CSSSelector = emailInput > p
        const emailInput = page.getByLabel('Email');
        const mailDomainText = emailInput.locator('xpath=following-sibling::p');

        await expect(mailDomainText).toBeVisible();
        await expect(mailDomainText).toHaveText('@univ-rennes.fr');
    });
});