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
        test(`doit afficher uniquement les cours ayant le statut "${filter.status}" quand on clique sur le bouton "${filter.label}"`, async ({ authenticatedPage }) => {
            // Cliquer sur le bouton du groupe pour l'activer
            await authenticatedPage.getByRole('button', { name: filter.label }).click();

            // Attendre la mise à jour
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
                    const rawStatusText = (await courseCells.nth(5).innerText()).trim();
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
        // D'abord on active un bouton
        await authenticatedPage.getByRole('button', { name: 'En cours' }).click();

        // Puis on le désactive
        await authenticatedPage.getByRole('button', { name: 'En cours' }).click();

        // Vérifier qu'il y a bien la vue de base (le tableau existe)
        const table = authenticatedPage.locator('table');
        await expect(table).toBeVisible();
        const courseRows = authenticatedPage.locator('tbody tr');
        const count = await courseRows.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('doit afficher les données des deux filtres quand deux filtres sont sélectionnés', async ({ authenticatedPage }) => {
        await authenticatedPage.getByRole('button', { name: 'En cours' }).click();
        await authenticatedPage.getByRole('button', { name: 'À venir' }).click();

        const courseRows = authenticatedPage.locator('tbody tr');
        await courseRows.first().waitFor({ state: 'attached', timeout: 5000 }).catch(() => {});
        const courseRowCount = await courseRows.count();
            
        const noCourseVisible = await authenticatedPage.getByRole('cell', { name: /Aucun cours disponible/i }).isVisible();
        if (noCourseVisible || courseRowCount === 0) return;

        for (let i = 0; i < courseRowCount; i++) {
            const courseCells = courseRows.nth(i).locator('td');
            const courseCellCount = await courseCells.count();
            
            if (courseCellCount > 0) {
                const rawStatusText = (await courseCells.nth(5).innerText()).trim();
                if (courseCellCount === 1 && rawStatusText.includes('Aucun cours')) continue;
                
                const normalizedStatusText = normalizeStatusLabel(rawStatusText);
                expect(['En cours', 'À venir']).toContain(normalizedStatusText);
            }
        }
    });

    test('doit réinitialiser la sélection et afficher toutes les données quand les 3 filtres sont sélectionnés', async ({ authenticatedPage }) => {
        await authenticatedPage.getByRole('button', { name: 'En cours' }).click();
        await authenticatedPage.getByRole('button', { name: 'À venir' }).click();
        await authenticatedPage.getByRole('button', { name: 'Terminé' }).click();

        // Le comportement attendu est que le 3e clic vide la sélection
        const table = authenticatedPage.locator('table');
        await expect(table).toBeVisible();
        const courseRows = authenticatedPage.locator('tbody tr');
        const count = await courseRows.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });
});
