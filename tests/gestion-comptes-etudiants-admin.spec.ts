import { expect, test } from './fixtures/authenticated-admin';
import { deleteStudentAccountByEmail } from './helpers/test-account';

const ADMIN_STUDENTS_ROUTE = '/administrateur/gestion-etudiants';
const LOGIN_ROUTE = '/professeur/connexion';

function buildUniqueStudentLocalPart(prefix: string): string {
    const uniqueSuffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
    return `${prefix}.${uniqueSuffix}`;
}

test.describe('Page administrateur - gestion des étudiants', () => {
    test.describe.configure({ mode: 'serial' });

    const createdStudentEmails = new Set<string>();

    test.afterEach(async () => {
        for (const studentEmail of createdStudentEmails) {
            await deleteStudentAccountByEmail(studentEmail);
        }

        createdStudentEmails.clear();
    });

    test('redirige vers la connexion quand il n y a pas de session', async ({ page }) => {
        await page.goto(ADMIN_STUDENTS_ROUTE);

        await expect(page).toHaveURL(new RegExp(String.raw`${LOGIN_ROUTE}(\?.*)?$`));
    });

    test('affiche la page et les controles principaux pour un administrateur', async ({ authenticatedAdminPage }) => {
        await authenticatedAdminPage.goto(ADMIN_STUDENTS_ROUTE);

        await expect(authenticatedAdminPage.getByRole('heading', { name: 'Gestion des étudiants' })).toBeVisible();
        await expect(authenticatedAdminPage.getByPlaceholder('Recherche (nom ou email)')).toBeVisible();
        await expect(authenticatedAdminPage.getByRole('combobox').first()).toBeVisible();
        await expect(authenticatedAdminPage.getByRole('combobox', { name: 'Toutes les classes' })).toBeVisible();
        await expect(authenticatedAdminPage.getByRole('button', { name: 'Ajouter un étudiant' })).toBeVisible();
    });

    test('permet de creer puis supprimer un etudiant', async ({ authenticatedAdminPage }) => {
        const studentLocalPart = buildUniqueStudentLocalPart('e2e.student');
        const studentEmail = `${studentLocalPart}@etudiant.univ-rennes.fr`;
        createdStudentEmails.add(studentEmail);

        await authenticatedAdminPage.goto(ADMIN_STUDENTS_ROUTE);
        await authenticatedAdminPage.getByRole('button', { name: 'Ajouter un étudiant' }).click();

        await authenticatedAdminPage.getByLabel('Prénom', { exact: true }).fill('E2E');
        await authenticatedAdminPage.getByLabel('Nom', { exact: true }).fill('Student');
        await authenticatedAdminPage.getByLabel('Email étudiant').fill(studentLocalPart);

        await authenticatedAdminPage.getByRole('button', { name: 'Créer' }).click();

        // Wait for the dialog to close before looking for the student card.
        // The dialog closes after the API response is processed and the state is updated.
        await expect(authenticatedAdminPage.getByRole('dialog')).not.toBeVisible({ timeout: 10000 });

        const createdStudentRow = authenticatedAdminPage.locator('article', { hasText: studentEmail }).first();
        await expect(createdStudentRow).toBeVisible({ timeout: 5000 });

        await createdStudentRow.getByTitle('Supprimer').click();

        const deleteDialog = authenticatedAdminPage.getByRole('alertdialog');
        await expect(deleteDialog).toBeVisible();
        await deleteDialog.getByRole('button', { name: 'Supprimer' }).click();
        await expect(authenticatedAdminPage.locator('article', { hasText: studentEmail })).toHaveCount(0);

        createdStudentEmails.delete(studentEmail);
    });
});
