import { expect, test } from '@playwright/test';
import {
    createExpiredResetPasswordSessionInDb,
    createResetPasswordSessionInDb,
    deleteResetPasswordSessionsByEmail,
    deleteStudentAccountByEmail,
    deleteTeacherAccountByEmail,
    ensureStudentAccountByEmail,
    ensureTeacherAccountByEmail,
} from './helpers/test-account';

type ResetTeacherCredentials = {
    email: string;
    localPart: string;
    oldPassword: string;
    newPassword: string;
};

type ResetStudentCredentials = {
    email: string;
    localPart: string;
    oldPassword: string;
    newPassword: string;
};

function buildUniqueLocalPart(prefix: string): string {
    const randomSuffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    return `${prefix}.${randomSuffix}`;
}

async function createResetTeacherCredentials(): Promise<ResetTeacherCredentials> {
    const localPart = buildUniqueLocalPart('reset.teacher');
    const email = `${localPart}@univ-rennes.fr`;
    const oldPassword = `OldPass1!${localPart.slice(-6)}`;
    const newPassword = `NewPass1!${localPart.slice(-6)}`;

    await ensureTeacherAccountByEmail(email, oldPassword);

    return { email, localPart, oldPassword, newPassword };
}

async function createResetStudentCredentials(): Promise<ResetStudentCredentials> {
    const localPart = buildUniqueLocalPart('reset.student');
    const email = `${localPart}@etudiant.univ-rennes.fr`;
    const oldPassword = `OldPass1!${localPart.slice(-6)}`;
    const newPassword = `NewPass1!${localPart.slice(-6)}`;

    await ensureStudentAccountByEmail(email, oldPassword);

    return { email, localPart, oldPassword, newPassword };
}

test.describe('Reset password flow', () => {
    const createdTeacherEmails: string[] = [];
    const createdStudentEmails: string[] = [];

    test.afterEach(async () => {
        for (const teacherEmail of createdTeacherEmails.splice(0)) {
            await deleteResetPasswordSessionsByEmail(teacherEmail);
            await deleteTeacherAccountByEmail(teacherEmail);
        }

        for (const studentEmail of createdStudentEmails.splice(0)) {
            await deleteResetPasswordSessionsByEmail(studentEmail);
            await deleteStudentAccountByEmail(studentEmail);
        }
    });

    test('should display reset session creation form for teacher', async ({ page }) => {
        await page.goto('/reset-password?new=true&target=teacher');

        await expect(page.getByText('Modification du mot de passe')).toBeVisible();
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByText('@univ-rennes.fr')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Réinitialiser le mot de passe' })).toBeDisabled();
    });

    test('should display reset session creation form for student', async ({ page }) => {
        await page.goto('/reset-password?new=true&target=student');

        await expect(page.getByText('Modification du mot de passe')).toBeVisible();
        await expect(page.getByLabel('Email')).toBeVisible();
        await expect(page.getByText('@etudiant.univ-rennes.fr')).toBeVisible();
    });

    test('should remove domain from email input on blur during reset creation', async ({ page }) => {
        await page.goto('/reset-password?new=true&target=teacher');

        const emailInput = page.getByLabel('Email');
        await emailInput.fill('reset.domain@univ-rennes.fr');
        await emailInput.blur();

        await expect(emailInput).toHaveValue('reset.domain');
    });

    test('should return a neutral confirmation message for existing teacher email', async ({ page }) => {
        const teacherCredentials = await createResetTeacherCredentials();
        createdTeacherEmails.push(teacherCredentials.email);

        await page.goto('/reset-password?new=true&target=teacher');
        await page.getByLabel('Email').fill(teacherCredentials.localPart);
        await page.getByRole('button', { name: 'Réinitialiser le mot de passe' }).click();

        await expect(page.getByText('Email envoyé')).toBeVisible();
        await expect(page.getByText('Si un compte avec cet email existe, vous recevrez un email de réinitialisation.')).toBeVisible();
    });

    test('should return the same neutral message for unknown teacher email', async ({ page }) => {
        const unknownLocalPart = buildUniqueLocalPart('reset.unknown');

        await page.goto('/reset-password?new=true&target=teacher');
        await page.getByLabel('Email').fill(unknownLocalPart);
        await page.getByRole('button', { name: 'Réinitialiser le mot de passe' }).click();

        await expect(page.getByText('Email envoyé')).toBeVisible();
        await expect(page.getByText('Si un compte avec cet email existe, vous recevrez un email de réinitialisation.')).toBeVisible();
    });

    test('should show invalid session screen when session_id is missing', async ({ page }) => {
        await page.goto('/reset-password');

        await expect(page.getByRole('heading', { name: 'Session de réinitialisation invalide' })).toBeVisible();
        await expect(page.getByText(/invalide ou a expiré/i)).toBeVisible();
    });

    test('should show invalid session screen when session_id does not exist', async ({ page }) => {
        await page.goto(`/reset-password?session_id=${crypto.randomUUID()}`);

        await expect(page.getByRole('heading', { name: 'Session de réinitialisation invalide' })).toBeVisible();
        await expect(page.getByText(/invalide ou a expiré/i)).toBeVisible();
    });

    test('should show invalid session screen for expired reset session', async ({ page }) => {
        const teacherCredentials = await createResetTeacherCredentials();
        createdTeacherEmails.push(teacherCredentials.email);
        const sessionId = await createExpiredResetPasswordSessionInDb(teacherCredentials.email, 'teacher');

        await page.goto(`/reset-password?session_id=${sessionId}`);

        await expect(page.getByRole('heading', { name: 'Session de réinitialisation invalide' })).toBeVisible();
        await expect(page.getByText(/invalide ou a expiré/i)).toBeVisible();
    });

    test('should show an error when verification email does not match session email', async ({ page }) => {
        const teacherCredentials = await createResetTeacherCredentials();
        createdTeacherEmails.push(teacherCredentials.email);
        const sessionId = await createResetPasswordSessionInDb(teacherCredentials.email, 'teacher');

        await page.goto(`/reset-password?session_id=${sessionId}`);

        await page.getByLabel('Email').fill('wrong.local.part');
        await page.getByRole('button', { name: 'Verifier mon email' }).click();

        await expect(page.getByText("L'email ne correspond pas à la session de réinitialisation.")).toBeVisible();
    });

    test('should complete teacher password reset and reject reused session', async ({ page }) => {
        const teacherCredentials = await createResetTeacherCredentials();
        createdTeacherEmails.push(teacherCredentials.email);
        const sessionId = await createResetPasswordSessionInDb(teacherCredentials.email, 'teacher');

        await page.goto(`/reset-password?session_id=${sessionId}`);

        await page.getByLabel('Email').fill(teacherCredentials.localPart);
        await page.getByRole('button', { name: 'Verifier mon email' }).click();

        await expect(page.getByText('Modification du mot de passe')).toBeVisible();

        await page.getByLabel('Mot de passe', { exact: true }).fill(teacherCredentials.newPassword);
        await page.getByLabel('Confirmer le mot de passe').fill(teacherCredentials.newPassword);
        await page.getByRole('button', { name: 'Modifier le mot de passe' }).click();

        await expect(page).toHaveURL('/professeur/connexion');

        await page.getByLabel('Email').fill(teacherCredentials.localPart);
        await page.getByLabel('Mot de passe', { exact: true }).fill(teacherCredentials.oldPassword);
        await page.getByRole('button', { name: 'Se connecter' }).click();
        await expect(page.getByText('Email ou mot de passe incorrect.')).toBeVisible();

        await page.getByLabel('Mot de passe', { exact: true }).fill(teacherCredentials.newPassword);
        await page.getByRole('button', { name: 'Se connecter' }).click();
        await expect(page).toHaveURL('/professeur/dashboard', { timeout: 15_000 });

        await page.goto(`/reset-password?session_id=${sessionId}`);
        await expect(page.getByRole('heading', { name: 'Session de réinitialisation invalide' })).toBeVisible();
    });

    test('should show mismatch error and keep submit disabled when passwords do not match', async ({ page }) => {
        const teacherCredentials = await createResetTeacherCredentials();
        createdTeacherEmails.push(teacherCredentials.email);
        const sessionId = await createResetPasswordSessionInDb(teacherCredentials.email, 'teacher');

        await page.goto(`/reset-password?session_id=${sessionId}`);

        await page.getByLabel('Email').fill(teacherCredentials.localPart);
        await page.getByRole('button', { name: 'Verifier mon email' }).click();

        await page.getByLabel('Mot de passe', { exact: true }).fill('ValidPass1');
        await page.getByLabel('Confirmer le mot de passe').fill('DifferentPass1');

        await expect(page.getByText('Les mots de passe ne correspondent pas.')).toBeVisible();
    });

    test('should show password rules and keep submit disabled for weak password', async ({ page }) => {
        const teacherCredentials = await createResetTeacherCredentials();
        createdTeacherEmails.push(teacherCredentials.email);
        const sessionId = await createResetPasswordSessionInDb(teacherCredentials.email, 'teacher');

        await page.goto(`/reset-password?session_id=${sessionId}`);

        await page.getByLabel('Email').fill(teacherCredentials.localPart);
        await page.getByRole('button', { name: 'Verifier mon email' }).click();

        const passwordInput = page.getByLabel('Mot de passe', { exact: true });
        await passwordInput.focus();
        await passwordInput.fill('weak');

        await expect(page.getByText('✗Au moins 8 caractères')).toBeVisible();
        await expect(page.getByText('✗Au moins 1 majuscule')).toBeVisible();
        await expect(page.getByText('✓Au moins 1 minuscule')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Modifier le mot de passe' })).toBeDisabled();
    });

    test('should complete student password reset and invalidate reset session', async ({ page }) => {
        const studentCredentials = await createResetStudentCredentials();
        createdStudentEmails.push(studentCredentials.email);
        const sessionId = await createResetPasswordSessionInDb(studentCredentials.email, 'student');

        await page.goto(`/reset-password?session_id=${sessionId}`);

        await expect(page.getByText('@etudiant.univ-rennes.fr')).toBeVisible();

        await page.getByLabel('Email').fill(studentCredentials.localPart);
        await page.getByRole('button', { name: 'Verifier mon email' }).click();

        await page.getByLabel('Mot de passe', { exact: true }).fill(studentCredentials.newPassword);
        await page.getByLabel('Confirmer le mot de passe').fill(studentCredentials.newPassword);
        await page.getByRole('button', { name: 'Modifier le mot de passe' }).click();

        await page.waitForTimeout(1000);

        // Selon le flux front courant, la redirection peut etre immediate ou rester sur la page.
        // Dans les deux cas, la session de reset doit etre consommee.
        await page.goto(`/reset-password?session_id=${sessionId}`);
        await expect(page.getByRole('heading', { name: 'Session de réinitialisation invalide' })).toBeVisible();
    });

    test('should show invalid session screen for unsupported target', async ({ page }) => {
        await page.goto('/reset-password?new=true&target=unknown');

        await expect(page.getByRole('heading', { name: 'Session de réinitialisation invalide' })).toBeVisible();
    });
});
