import { expect, test } from './fixtures/authenticated-teacher';
import type { Locator, Page } from '@playwright/test';

const QR_BUTTON_ACCESSIBLE_NAME = 'Ouvrir le QR code dans une nouvelle fenêtre';

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

async function isStudentPresent(studentCard: Locator): Promise<boolean> {
	return (await studentCard.locator('div.bg-green').count()) > 0;
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

	test('doit afficher le QR code si le cours est en cours', async ({ authenticatedPage }) => {
		await openCourseByStatus(authenticatedPage, 'En cours');

		const qrButton = getQrButton(authenticatedPage);

		await expect(authenticatedPage.getByText('En cours', { exact: true })).toBeVisible();
		await expect(qrButton).toBeVisible();
		await expect(qrButton).toBeEnabled();
	});

	test('doit ouvrir une nouvelle fenêtre QR avec uniquement le QR quand on clique dessus', async ({ authenticatedPage }) => {
		await openCourseByStatus(authenticatedPage, 'En cours');

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

	test('doit permettre de cliquer un étudiant pour basculer present et non-scanné', async ({ authenticatedPage }) => {
		await openCourseByStatus(authenticatedPage, 'En cours');

		const firstStudentCard = getStudentCards(authenticatedPage).first();
		await expect(firstStudentCard).toBeVisible();

		const initialStudentPresence = await isStudentPresent(firstStudentCard);
		const expectedStatusAfterFirstClick = initialStudentPresence ? 'non-scanne' : 'present';

		const firstToggleResponsePromise = authenticatedPage.waitForResponse((response) => {
			return response.url().includes('/api/teacher/attendance/toggle')
				&& response.request().method() === 'PATCH';
		});

		await firstStudentCard.click();

		const firstToggleResponse = await firstToggleResponsePromise;
		expect(firstToggleResponse.ok()).toBeTruthy();
		const firstToggleResponseBody = await firstToggleResponse.json() as { status?: string };
		expect(firstToggleResponseBody.status).toBe(expectedStatusAfterFirstClick);

		await expect.poll(async () => isStudentPresent(firstStudentCard)).toBe(!initialStudentPresence);

		const secondToggleResponsePromise = authenticatedPage.waitForResponse((response) => {
			return response.url().includes('/api/teacher/attendance/toggle')
				&& response.request().method() === 'PATCH';
		});

		await firstStudentCard.click();

		const secondToggleResponse = await secondToggleResponsePromise;
		expect(secondToggleResponse.ok()).toBeTruthy();
		const secondToggleResponseBody = await secondToggleResponse.json() as { status?: string };
		expect(secondToggleResponseBody.status).toBe(initialStudentPresence ? 'present' : 'non-scanne');

		await expect.poll(async () => isStudentPresent(firstStudentCard)).toBe(initialStudentPresence);
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
