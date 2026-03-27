import { test, expect } from '@playwright/test';

test.describe('Dashboard page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/professeur/connexion');
        const emailInput = page.getByLabel('Email');
        const passwordInput = page.getByLabel('Mot de passe');
        const submitButton = page.getByRole('button', { name: 'Se connecter' });

        await emailInput.fill('maxime.duhamel');
        await passwordInput.fill('M0tD3P4ss3');
        await submitButton.click();
    });

    test('should display the dashboard', async ({ page }) => {
        const heading1 = page.getByRole('heading', { name: 'Dashboard' });
        const createCourseButton = page.getByRole('button', { name: 'Créer un cours' });
        
        await expect(heading1).toBeVisible();
        await expect(createCourseButton).toBeVisible();
    });

    test('should display the list of courses', async ({ page }) => {
        
    });
});