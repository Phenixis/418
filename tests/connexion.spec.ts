import { test, expect } from '@playwright/test';
import bcrypt from 'bcrypt';
import { db } from '@/lib/db/drizzle';
import { table as teacherTable } from '@/lib/db/schema/teacher';
import {
    deleteTeacherAccountByEmail,
} from './helpers/test-account';

type LoginTeacherOptions = {
    isValidated?: boolean;
};

async function createLoginTeacherCredentials(
    options: LoginTeacherOptions = {},
): Promise<{ localPart: string; password: string; email: string }> {
    const isTeacherValidated = options.isValidated ?? true;
    const randomSuffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    const localPart = `login.${randomSuffix}`;
    const email = `${localPart}@univ-rennes.fr`;
    const password = `ValidPass1!${randomSuffix}`;
    const hashedPassword = await bcrypt.hash(password, 12);

    await db.insert(teacherTable).values({
        userMail: email,
        firstName: 'Login',
        lastName: 'Test',
        password: hashedPassword,
        isTeacher: true,
        isValidated: isTeacherValidated,
    });

    return { localPart, password, email };
}

test.describe('Connexion page', () => {
    let createdTeacherEmails: string[] = [];

    test.beforeEach(async ({ page }) => {
        createdTeacherEmails = [];
        await page.goto('/professeur/connexion');
    });

    test.afterEach(async () => {
        for (const teacherEmail of createdTeacherEmails) {
            await deleteTeacherAccountByEmail(teacherEmail);
        }
    });

    test('should display the connexion form', async ({ page }) => {
        const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Mot de passe', { exact: true });
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
        const passwordInput = page.getByLabel('Mot de passe', { exact: true });
        const submitButton = page.getByRole('button', { name: 'Se connecter' });

        await emailInput.fill('invaliduser');
        await passwordInput.fill('wrongpassword');
        await submitButton.click();

        const errorMessage = page.getByText('Email ou mot de passe incorrect.');
        await expect(errorMessage).toBeVisible();
    });

    test('should redirect to dashboard on successful login', async ({ page }) => {
        const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Mot de passe', { exact: true });
        const submitButton = page.getByRole('button', { name: 'Se connecter' });
        const loginTeacherCredentials = await createLoginTeacherCredentials();
        createdTeacherEmails.push(loginTeacherCredentials.email);

        await emailInput.fill(loginTeacherCredentials.localPart);
        await passwordInput.fill(loginTeacherCredentials.password);
        await expect(submitButton).toBeEnabled();
        await submitButton.click();

        await expect(page).toHaveURL('/professeur/dashboard', { timeout: 15_000 });
    });

    test('should redirect to waiting page when teacher account is not validated', async ({ page }) => {
        const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Mot de passe', { exact: true });
        const submitButton = page.getByRole('button', { name: 'Se connecter' });
        const loginTeacherCredentials = await createLoginTeacherCredentials({ isValidated: false });
        createdTeacherEmails.push(loginTeacherCredentials.email);

        await emailInput.fill(loginTeacherCredentials.localPart);
        await passwordInput.fill(loginTeacherCredentials.password);
        await expect(submitButton).toBeEnabled();
        await submitButton.click();

        await expect(page).toHaveURL('/professeur/en-attente', { timeout: 15_000 });
        await expect(page.getByRole('heading', { name: 'Compte en attente de validation' })).toBeVisible();
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

    test('should toggle password visibility on login form', async ({ page }) => {
        const passwordInput = page.getByLabel('Mot de passe', { exact: true });
        const showPasswordButton = page.getByRole('button', { name: 'Afficher le mot de passe' });

        await expect(passwordInput).toHaveAttribute('type', 'password');

        await showPasswordButton.click();
        await expect(passwordInput).toHaveAttribute('type', 'text');
        await expect(page.getByRole('button', { name: 'Cacher le mot de passe' })).toBeVisible();

        await page.getByRole('button', { name: 'Cacher le mot de passe' }).click();
        await expect(passwordInput).toHaveAttribute('type', 'password');
        await expect(page.getByRole('button', { name: 'Afficher le mot de passe' })).toBeVisible();
    });
});