import { test, expect } from '@playwright/test';

test.describe('Connexion page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/professeur/connexion');
    });

    test('should display the connexion form', async ({ page }) => {
        const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Mot de passe');
        const submitButton = page.getByRole('button', { name: 'Se connecter' });

        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        await expect(submitButton).toBeVisible();
    });

    test('should show error message on invalid credentials', async ({ page }) => {const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Mot de passe');
        const submitButton = page.getByRole('button', { name: 'Se connecter' });

        await emailInput.fill('invaliduser');
        await passwordInput.fill('wrongpassword');
        await submitButton.click();

        const errorMessage = page.getByText('Email ou mot de passe incorrect.');
        await expect(errorMessage).toBeVisible();
    });

    test('should redirect to dashboard on successful login', async ({ page }) => {const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Mot de passe');
        const submitButton = page.getByRole('button', { name: 'Se connecter' });

        await emailInput.fill('benoit.tottereau');
        await passwordInput.fill('Totoro123');
        await submitButton.click();

        await expect(page).toHaveURL('/professeur/dashboard');
    });

    test('should remove mail domain if user enters it', async ({ page }) => {const emailInput = page.getByLabel('Email');

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