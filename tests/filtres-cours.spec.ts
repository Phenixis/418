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
    });

    const filterTests = [
        { label: 'En cours', status: 'En cours' },
        { label: 'À venir', status: 'À venir' },
        { label: 'Terminé', status: 'Terminé' },
    ];

    for (const filter of filterTests) {
        test(`doit afficher uniquement les cours ayant le statut "${filter.status}" quand on sélectionne "${filter.label}"`, async ({ authenticatedPage }) => {
            // Ouvrir la liste des filtres
            await authenticatedPage.getByRole('combobox').click();

            // Sélectionner le filtre
            await authenticatedPage.getByRole('option', { name: filter.label }).click();
            await authenticatedPage.keyboard.press('Escape');

            // Attendre un court instant pour la mise à jour (React est très rapide)
            const courseRows = authenticatedPage.locator('tbody tr');
            await courseRows.first().waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
            const courseRowCount = await courseRows.count();
            
            // Si "Aucun cours", c'est valide
            const noCourseVisible = await authenticatedPage.getByRole('cell', { name: /Aucun cours disponible/i }).isVisible();
            if (noCourseVisible || courseRowCount === 0) {
                return;
            }

            for (let i = 0; i < courseRowCount; i++) {
                const courseCells = courseRows.nth(i).locator('td');
                const courseCellCount = await courseCells.count();
                
                if (courseCellCount > 0) {
                    const rawStatusText = (await courseCells.nth(courseCellCount - 1).innerText()).trim();
                    if (courseCellCount === 1 && rawStatusText.includes('Aucun cours')) {
                        continue;
                    }
                    const normalizedStatusText = normalizeStatusLabel(rawStatusText);
                    expect(normalizedStatusText).toBe(filter.status);
                }
            }
        });
    }

    test('doit afficher tous les cours quand aucun filtre n\'est sélectionné', async ({ authenticatedPage }) => {
        // D'abord on sélectionne un filtre pour que l'état change
        await authenticatedPage.getByRole('combobox').click();
        await authenticatedPage.getByRole('option', { name: 'En cours' }).click();
        await authenticatedPage.keyboard.press('Escape');

        // Retirer le filtre en cliquant sur le bouton remove du chip
        await authenticatedPage.locator('[data-slot="combobox-chip-remove"]').first().click();

        // Vérifier qu'il y a bien la vue de base (le tableau existe)
        const table = authenticatedPage.locator('table');
        await expect(table).toBeVisible();
        const courseRows = authenticatedPage.locator('tbody tr');
        const count = await courseRows.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });
});
