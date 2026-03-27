import { passwordRules } from '@/components/login/rules';
import { expect, test } from '@playwright/test';
import {
    ensureTestTeacherAccount,
    getTestAccountLocalPart,
} from './helpers/test-account';

test.describe('Inscription page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/professeur/inscription?invite_id=123');
    });

    test("should show Not found if the invite_id is empty", async ({ page }) => {
        await page.goto('/professeur/inscription');

        const notFoundText = page.getByText('This page could not be found.');
        await expect(notFoundText).toBeVisible();
    });

    test('should display the inscription form', async ({ page }) => {
        const firstNameInput = page.getByLabel('Prénom', { exact: true });
        const lastNameInput = page.getByLabel('Nom', { exact: true });
        const emailInput = page.getByLabel('Email', { exact: true });
        const passwordInput = page.getByLabel('Mot de passe', { exact: true });
        const confirmPasswordInput = page.getByLabel('Confirmer le mot de passe', { exact: true });
        const submitButton = page.getByRole('button', { name: "S'inscrire" });

        await expect(firstNameInput).toBeVisible();
        await expect(lastNameInput).toBeVisible();
        await expect(emailInput).toBeVisible();
        await expect(passwordInput).toBeVisible();
        await expect(confirmPasswordInput).toBeVisible();
        await expect(submitButton).toBeVisible();
    });

    test('should show error message on creation with email already registered', async ({ page }) => {
        await ensureTestTeacherAccount();

        const firstNameInput = page.getByLabel('Prénom', { exact: true });
        const lastNameInput = page.getByLabel('Nom', { exact: true });
        const emailInput = page.getByLabel('Email', { exact: true });
        const passwordInput = page.getByLabel('Mot de passe', { exact: true });
        const confirmPasswordInput = page.getByLabel('Confirmer le mot de passe', { exact: true });
        const submitButton = page.getByRole('button', { name: "S'inscrire" });

        await firstNameInput.fill('Benoit');
        await lastNameInput.fill('Tottereau');
        await emailInput.fill(getTestAccountLocalPart());
        await passwordInput.fill('Totoro123');
        await confirmPasswordInput.fill('Totoro123');
        await submitButton.click();

        const errorMessage = page.getByText('Un compte existe déjà avec cet email.');
        await expect(errorMessage).toBeVisible();
    });

    test('should display password rules on password input focus', async ({ page }) => {
        const passwordInput = page.getByLabel('Mot de passe', { exact: true });
        await passwordInput.focus();

        for (const rule of passwordRules) {
            const ruleElement = page.getByText("✗" + rule.label);
            await expect(ruleElement).toBeVisible();
        }
    });

    test('should update password rules status on password input', async ({ page }) => {
        const passwordInput = page.getByLabel('Mot de passe', { exact: true });
        await passwordInput.focus();

        // fill the password input with a password that respects only "Au moins 1 minuscule"
        await passwordInput.fill('a');
        const validRules = passwordRules.filter(rule => rule.label === "Au moins 1 minuscule");
        const invalidRules = passwordRules.filter(rule => !validRules.includes(rule));

        for (const rule of validRules) {
            const ruleElement = page.getByText("✓" + rule.label);
            await expect(ruleElement).toBeVisible();
        }

        for (const rule of invalidRules) {
            const ruleElement = page.getByText("✗" + rule.label);
            await expect(ruleElement).toBeVisible();
        }

        // fill the password input with a password that respects only "Au moins 8 caractères" & "Au moins 1 minuscule"
        await passwordInput.fill('abcdefgh');
        const validRules2 = passwordRules.filter(rule => rule.label === "Au moins 1 minuscule" || rule.label === "Au moins 8 caractères");
        const invalidRules2 = passwordRules.filter(rule => !validRules2.includes(rule));

        for (const rule of validRules2) {
            const ruleElement = page.getByText("✓" + rule.label);
            await expect(ruleElement).toBeVisible();
        }

        for (const rule of invalidRules2) {
            const ruleElement = page.getByText("✗" + rule.label);
            await expect(ruleElement).toBeVisible();
        }

        // fill the password input with a password that respects only "Au moins 8 caractères" & "Au moins 1 minuscule" & "Au moins 1 majuscule"
        await passwordInput.fill('Abcdefgh');
        const validRules3 = passwordRules.filter(rule => rule.label === "Au moins 1 minuscule" || rule.label === "Au moins 8 caractères" || rule.label === "Au moins 1 majuscule");
        const invalidRules3 = passwordRules.filter(rule => !validRules3.includes(rule));

        for (const rule of validRules3) {
            const ruleElement = page.getByText("✓" + rule.label);
            await expect(ruleElement).toBeVisible();
        }

        for (const rule of invalidRules3) {
            const ruleElement = page.getByText("✗" + rule.label);
            await expect(ruleElement).toBeVisible();
        }

        // fill the password input with a password that respects all rules
        await passwordInput.fill('Totoro123');
        for (const rule of passwordRules) {
            const ruleElement = page.getByText("✓" + rule.label);
            await expect(ruleElement).toBeVisible();
        }
    });

    test('should show error message if password and confirm password do not match', async ({ page }) => {
        const passwordInput = page.getByLabel('Mot de passe', { exact: true });
        const confirmPasswordInput = page.getByLabel('Confirmer le mot de passe', { exact: true });

        await passwordInput.fill('Totoro123');
        await confirmPasswordInput.fill('Totoro1234');

        const errorMessage = page.getByText('Les mots de passe ne correspondent pas.');
        await expect(errorMessage).toBeVisible();
    });
});