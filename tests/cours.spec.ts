import { expect, test } from './fixtures/authenticated-teacher';
import type { Locator, Page } from '@playwright/test';

const QR_BUTTON_ACCESSIBLE_NAME = 'Ouvrir le QR code dans une nouvelle fenêtre';
const BOUTON_DEMARRER_APPEL = 'Démarrer le cours';

async function demarrerAppelSiNecessaire(page: Page): Promise<void> {
	const boutonDemarrer = page.getByRole('button', { name: BOUTON_DEMARRER_APPEL, exact: true });
	if (await boutonDemarrer.isVisible()) {
		await boutonDemarrer.click();
		// Attendre que le QR code apparaisse pour confirmer que l'action a bien été traitée
		await expect(page.getByRole('button', { name: QR_BUTTON_ACCESSIBLE_NAME })).toBeVisible({ timeout: 10_000 });
	}
}

async function openCourseByStatus(page: Page, statusLabel: 'En cours' | 'Terminé' | 'À venir'): Promise<void> {
	await page.goto('/professeur/dashboard');

	const courseRow = page.locator('tbody tr').filter({
		has: page.getByRole('cell', { name: statusLabel, exact: true }),
	}).first();
	const expectedCourseUrlPattern = /\/professeur\/cours\/[\w-]+$/;

	await expect(courseRow).toBeVisible();

	for (let attemptIndex = 0; attemptIndex < 5; attemptIndex++) {
		await courseRow.click({ force: true });

		try {
			await expect(page).toHaveURL(expectedCourseUrlPattern, { timeout: 3_000 });
			return;
		} catch {
			if (attemptIndex === 4) {
				throw new Error(`Navigation vers la page de cours impossible pour le statut "${statusLabel}".`);
			}

			await page.waitForTimeout(500);
		}
	}
}

async function readInfoCount(page: Page, label: 'Total' | 'Présents' | 'Non-scannés'): Promise<number> {
	const infoField = page.locator('div.flex.flex-col.gap-1').filter({
		has: page.locator(`span:text-is("${label}")`),
	}).first();

	await expect(infoField).toBeVisible();
	const valueText = (await infoField.locator('span').nth(1).innerText()).trim();
	const value = Number(valueText);

	expect(Number.isNaN(value)).toBeFalsy();
	return value;
}

function getQrButton(page: Page): Locator {
	return page.getByRole('button', { name: QR_BUTTON_ACCESSIBLE_NAME });
}

function getStudentCards(page: Page): Locator {
	return page.locator('button').filter({
		has: page.locator('p.text-xs.text-muted-foreground'),
	});
}

// Un étudiant est considéré présent s'il a un statut « présent » ou un statut de retard
// (vert = présent, jaune/orange/rouge = retard niveau 1/2/3)
const PRESENCE_BG_CLASSES = ['div.bg-green', 'div.bg-yellow-400', 'div.bg-orange', 'div.bg-red'];

async function isStudentPresent(studentCard: Locator): Promise<boolean> {
	for (const presenceClass of PRESENCE_BG_CLASSES) {
		if ((await studentCard.locator(presenceClass).count()) > 0) {
			return true;
		}
	}
	return false;
}

async function countPresentStudents(studentCards: Locator): Promise<number> {
	const studentCardCount = await studentCards.count();
	let presentStudents = 0;

	for (let studentIndex = 0; studentIndex < studentCardCount; studentIndex++) {
		const studentCard = studentCards.nth(studentIndex);
		if (await isStudentPresent(studentCard)) {
			presentStudents += 1;
		}
	}

	return presentStudents;
}

type StudentIdentity = {
	groupName: string;
	lastName: string;
	firstName: string;
};

async function readStudentsInDisplayedOrder(page: Page): Promise<StudentIdentity[]> {
	const studentCards = getStudentCards(page);
	const studentCardCount = await studentCards.count();
	const students: StudentIdentity[] = [];

	for (let studentIndex = 0; studentIndex < studentCardCount; studentIndex++) {
		const studentCard = studentCards.nth(studentIndex);
		const firstName = (await studentCard.locator('p').nth(0).innerText()).trim();
		const lastName = (await studentCard.locator('p').nth(1).innerText()).trim();
		const groupName = (await studentCard.locator('p.text-xs.text-muted-foreground').innerText()).trim();

		students.push({
			groupName,
			lastName,
			firstName,
		});
	}

	return students;
}

// Déclenche un clic sur la carte étudiant et attend la réponse PATCH du toggle
async function clickStudentAndWaitForToggle(
	page: Page,
	studentCard: Locator
): Promise<{ status: string }> {
	const toggleResponsePromise = page.waitForResponse((response) => {
		return response.url().includes('/api/teacher/attendance/toggle')
			&& response.request().method() === 'PATCH';
	});

	await studentCard.click();

	const toggleResponse = await toggleResponsePromise;
	expect(toggleResponse.ok()).toBeTruthy();

	const toggleResponseBody = await toggleResponse.json() as { status?: string };
	expect(toggleResponseBody.status).toBeDefined();

	return { status: toggleResponseBody.status as string };
}

test.describe('Segment dynamique de cours', () => {
	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/professeur/dashboard');
	});

	test('ne doit pas afficher le QR code si le cours n\'est pas en cours', async ({ authenticatedPage }) => {
		for (const nonRunningStatus of ['Terminé', 'À venir'] as const) {
			await openCourseByStatus(authenticatedPage, nonRunningStatus);
			await expect(authenticatedPage.getByText(nonRunningStatus, { exact: true })).toBeVisible();
			await expect(getQrButton(authenticatedPage)).toHaveCount(0);
		}
	});

	test('doit afficher le QR code une fois l\'appel de présence démarré', async ({ authenticatedPage }) => {
		await openCourseByStatus(authenticatedPage, 'En cours');

		await expect(authenticatedPage.getByText('En cours', { exact: true })).toBeVisible();

		// Le QR code n'est visible qu'après avoir démarré l'appel
		await demarrerAppelSiNecessaire(authenticatedPage);

		const qrButton = getQrButton(authenticatedPage);
		await expect(qrButton).toBeVisible();
		await expect(qrButton).toBeEnabled();
	});

	test('doit ouvrir une nouvelle fenêtre QR avec uniquement le QR quand on clique dessus', async ({ authenticatedPage }) => {
		await openCourseByStatus(authenticatedPage, 'En cours');

		// Le QR code n'est visible qu'après avoir démarré l'appel
		await demarrerAppelSiNecessaire(authenticatedPage);

		const qrButton = getQrButton(authenticatedPage);
		const [popup] = await Promise.all([
			authenticatedPage.waitForEvent('popup'),
			qrButton.click(),
		]);

		await popup.waitForLoadState('domcontentloaded');

		expect(popup.url()).toContain('/api/teacher/qr-code?codePin=');
		await expect(popup.locator('main svg')).toHaveCount(1);
		await expect(popup.locator('main > *')).toHaveCount(1);
	});

	test('doit parcourir le cycle complet de présence au clic sur un étudiant', async ({ authenticatedPage }) => {
		await openCourseByStatus(authenticatedPage, 'En cours');

		const firstStudentCard = getStudentCards(authenticatedPage).first();
		await expect(firstStudentCard).toBeVisible();

		// Le test démarre dans un état connu : on s'assure que l'étudiant est non-scanné.
		// S'il est dans un autre statut, on cycle jusqu'à revenir à non-scanné.
		const STATUTS_DU_CYCLE = ['present', 'retard+5', 'retard+10', 'retard+15', 'non-scanne'] as const;
		let attemptCount = 0;
		while (await isStudentPresent(firstStudentCard)) {
			await clickStudentAndWaitForToggle(authenticatedPage, firstStudentCard);
			attemptCount++;
			if (attemptCount > STATUTS_DU_CYCLE.length) {
				throw new Error('Impossible de remettre l\'étudiant en non-scanné.');
			}
		}

		// Cycle complet attendu : non-scanné → présent → retard+5 → retard+10 → retard+15 → non-scanné
		for (const expectedStatus of STATUTS_DU_CYCLE) {
			const { status } = await clickStudentAndWaitForToggle(authenticatedPage, firstStudentCard);
			expect(status).toBe(expectedStatus);

			// Le statut visuel doit refléter ce que l'API a renvoyé
			const expectedPresence = expectedStatus !== 'non-scanne';
			await expect.poll(async () => isStudentPresent(firstStudentCard)).toBe(expectedPresence);
		}
	});

	test('doit afficher des compteurs cohérents entre total, présents et non-scannés', async ({ authenticatedPage }) => {
		await openCourseByStatus(authenticatedPage, 'En cours');

		const totalFromInfo = await readInfoCount(authenticatedPage, 'Total');
		const presentsFromInfo = await readInfoCount(authenticatedPage, 'Présents');
		const nonScannesFromInfo = await readInfoCount(authenticatedPage, 'Non-scannés');

		const studentCards = getStudentCards(authenticatedPage);
		const displayedStudentCount = await studentCards.count();
		const presentStudentsCount = await countPresentStudents(studentCards);
		const nonScannedStudentsCount = displayedStudentCount - presentStudentsCount;

		expect(totalFromInfo).toBe(displayedStudentCount);
		expect(presentsFromInfo).toBe(presentStudentsCount);
		expect(nonScannesFromInfo).toBe(nonScannedStudentsCount);
		expect(totalFromInfo).toBe(presentsFromInfo + nonScannesFromInfo);
	});

	test('doit trier les étudiants par classe puis nom puis prénom', async ({ authenticatedPage }) => {
		await openCourseByStatus(authenticatedPage, 'En cours');

		const displayedStudents = await readStudentsInDisplayedOrder(authenticatedPage);
		const sortedStudents = [...displayedStudents].sort((studentA, studentB) => {
			const groupComparison = studentA.groupName.localeCompare(studentB.groupName, 'fr');
			if (groupComparison !== 0) {
				return groupComparison;
			}

			const lastNameComparison = studentA.lastName.localeCompare(studentB.lastName, 'fr');
			if (lastNameComparison !== 0) {
				return lastNameComparison;
			}

			return studentA.firstName.localeCompare(studentB.firstName, 'fr');
		});

		expect(displayedStudents).toEqual(sortedStudents);

		const first3A2Index = displayedStudents.findIndex((student) => student.groupName === '3A2');
		const last3A1Index = displayedStudents.findLastIndex((student) => student.groupName === '3A1');

		if (first3A2Index !== -1 && last3A1Index !== -1) {
			expect(first3A2Index).toBeGreaterThan(last3A1Index);
		}
	});
});
