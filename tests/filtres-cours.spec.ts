import { test, expect } from './fixtures/authenticated-teacher';

function normalizeStatusLabel(rawStatusText: string): 'En cours' | 'À venir' | 'Terminé' | null {
    const normalizedStatusText = rawStatusText
        .normalize('NFD')
        .replaceAll(/\p{Diacritic}/gu, '')
        .toLowerCase();

    if (normalizedStatusText.includes('en cours')) return 'En cours';
    if (normalizedStatusText.includes('a venir')) return 'À venir';
    if (normalizedStatusText.includes('termine')) return 'Terminé';
    return null;
}

test.describe('Filtres de cours sur le dashboard', () => {
    test.beforeEach(async ({ authenticatedPage }) => {
        await authenticatedPage.goto('/professeur/dashboard');

        const firstResourceRow = authenticatedPage.locator('tbody tr').first();
        await expect(firstResourceRow).toBeVisible();
        await firstResourceRow.click();
        await expect(authenticatedPage).toHaveURL(/\/professeur\/resource\/[\w-]+$/);
    });

    test('doit afficher le tableau des séances de la ressource', async ({ authenticatedPage }) => {
        await expect(authenticatedPage.getByRole('columnheader', { name: 'Jour' })).toBeVisible();
        await expect(authenticatedPage.getByRole('columnheader', { name: 'Début' })).toBeVisible();
        await expect(authenticatedPage.getByRole('columnheader', { name: 'Fin' })).toBeVisible();
        await expect(authenticatedPage.getByRole('columnheader', { name: 'Cours' })).toBeVisible();
        await expect(authenticatedPage.getByRole('columnheader', { name: 'Statut' })).toBeVisible();
    });

    test('doit afficher les séances triées par statut puis date', async ({ authenticatedPage }) => {
        const sessionRows = authenticatedPage.locator('tbody tr');
        const sessionRowCount = await sessionRows.count();

        expect(sessionRowCount).toBeGreaterThan(0);

        const statusPriorityByLabel: Record<string, number> = {
            'En cours': 0,
            'À venir': 1,
            'Terminé': 2,
        };

        const statusLabels: Array<'En cours' | 'À venir' | 'Terminé'> = [];
        for (let sessionRowIndex = 0; sessionRowIndex < sessionRowCount; sessionRowIndex++) {
            const rowCells = sessionRows.nth(sessionRowIndex).locator('td');
            const rowCellCount = await rowCells.count();
            if (rowCellCount === 0) {
                continue;
            }

            const rawStatusText = (await rowCells.nth(5).innerText()).trim();
            const statusLabel = normalizeStatusLabel(rawStatusText);
            expect(statusLabel).not.toBeNull();
            statusLabels.push(statusLabel as 'En cours' | 'À venir' | 'Terminé');
        }

        for (let statusIndex = 1; statusIndex < statusLabels.length; statusIndex++) {
            const previousPriority = statusPriorityByLabel[statusLabels[statusIndex - 1]];
            const currentPriority = statusPriorityByLabel[statusLabels[statusIndex]];
            expect(currentPriority).toBeGreaterThanOrEqual(previousPriority);
        }
    });

    test('doit ouvrir une séance en cliquant sur sa ligne', async ({ authenticatedPage }) => {
        const firstSessionRow = authenticatedPage.locator('tbody tr').first();
        await expect(firstSessionRow).toBeVisible();

        await firstSessionRow.click();
        await expect(authenticatedPage).toHaveURL(/\/professeur\/session\/[\w-]+$/);
    });
});
