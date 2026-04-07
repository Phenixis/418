import { expect, test } from './fixtures/authenticated-teacher';
import type { Locator, Page } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db/drizzle';
import { table as studentTable } from '@/lib/db/schema/student';
import { table as resourceTable } from '@/lib/db/schema/resource';
import { table as sessionTable } from '@/lib/db/schema/session';
import { table as sessionGroupTable } from '@/lib/db/schema/session-group';
import { eq, isNotNull } from 'drizzle-orm';

const QR_BUTTON_ACCESSIBLE_NAME = 'Ouvrir le QR code dans une nouvelle fenêtre';

const createdSessionIds: string[] = [];
const createdResourceIds: string[] = [];

async function createSessionByStatus(statusLabel: 'En cours' | 'Terminé' | 'À venir'): Promise<string> {
	const groupWithStudent = await db
		.select({ groupId: studentTable.groupId })
		.from(studentTable)
		.where(isNotNull(studentTable.groupId))
		.limit(1);

	if (groupWithStudent.length === 0 || groupWithStudent[0].groupId === null) {
		throw new Error('Aucun groupe avec etudiant n\'est disponible pour les tests de cours.');
	}

	const now = Date.now();
	let startAt = new Date(now - 20 * 60 * 1000);
	let endAt = new Date(now + 40 * 60 * 1000);

	if (statusLabel === 'Terminé') {
		startAt = new Date(now - 120 * 60 * 1000);
		endAt = new Date(now - 60 * 60 * 1000);
	}

	if (statusLabel === 'À venir') {
		startAt = new Date(now + 60 * 60 * 1000);
		endAt = new Date(now + 120 * 60 * 1000);
	}

	const resourceId = randomUUID();
	const sessionId = randomUUID();

	await db.insert(resourceTable).values({
		resourceId,
		subject: `Resource test ${statusLabel} ${Date.now()}`,
	});

	await db.insert(sessionTable).values({
		sessionId,
		resourceId,
		subject: `Session test ${statusLabel} ${Date.now()}`,
		startAt,
		endAt,
	});

	await db.insert(sessionGroupTable).values({
		sessionId,
		groupId: groupWithStudent[0].groupId,
	});

	createdSessionIds.push(sessionId);
	createdResourceIds.push(resourceId);

	return sessionId;
}

async function openCourseByStatus(page: Page, statusLabel: 'En cours' | 'Terminé' | 'À venir'): Promise<boolean> {
	const sessionId = await createSessionByStatus(statusLabel);
	await page.goto(`/professeur/session/${sessionId}`);
	await expect(page).toHaveURL(new RegExp(`/professeur/session/${sessionId}$`));
	return true;
}

async function readInfoCount(page: Page, label: 'Total' | 'Présents' | 'Non-scannés'): Promise<number> {
	const infoLabel = page.getByText(label, { exact: true }).first();
	await expect(infoLabel).toBeVisible();

	const valueText = (await infoLabel.locator('xpath=following-sibling::*[1]').innerText()).trim();
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

test.describe('Segment dynamique de cours', () => {
	test.afterEach(async () => {
		for (const sessionId of createdSessionIds) {
			await db.delete(sessionGroupTable).where(eq(sessionGroupTable.sessionId, sessionId));
			await db.delete(sessionTable).where(eq(sessionTable.sessionId, sessionId));
		}

		for (const resourceId of createdResourceIds) {
			await db.delete(resourceTable).where(eq(resourceTable.resourceId, resourceId));
		}

		createdSessionIds.length = 0;
		createdResourceIds.length = 0;
	});

	test.beforeEach(async ({ authenticatedPage }) => {
		await authenticatedPage.goto('/professeur/dashboard');
	});

	test('ne doit pas afficher le QR code si le cours n\'est pas en cours', async ({ authenticatedPage }) => {
		let testedStatusCount = 0;

		for (const nonRunningStatus of ['Terminé', 'À venir'] as const) {
			const hasOpenedSession = await openCourseByStatus(authenticatedPage, nonRunningStatus);
			if (!hasOpenedSession) {
				continue;
			}

			testedStatusCount += 1;
			await expect(authenticatedPage.getByText(nonRunningStatus, { exact: true })).toBeVisible();
			await expect(getQrButton(authenticatedPage)).toHaveCount(0);
		}

		expect(testedStatusCount).toBeGreaterThan(0);
	});

	test('doit afficher le QR code si le cours est en cours', async ({ authenticatedPage }) => {
		expect(await openCourseByStatus(authenticatedPage, 'En cours')).toBeTruthy();

		const qrButton = getQrButton(authenticatedPage);

		await expect(authenticatedPage.getByText('En cours', { exact: true })).toBeVisible();
		await expect(qrButton).toBeVisible();
		await expect(qrButton).toBeEnabled();
	});

	test('doit ouvrir une nouvelle fenêtre QR avec le QR et les boutons de téléchargement quand on clique dessus', async ({ authenticatedPage }) => {
		await openCourseByStatus(authenticatedPage, 'En cours');

		const qrButton = getQrButton(authenticatedPage);
		const [popup] = await Promise.all([
			authenticatedPage.waitForEvent('popup'),
			qrButton.click(),
		]);

		await popup.waitForLoadState('domcontentloaded');

		expect(popup.url()).toContain('/api/teacher/qr-code?codePin=');
		await expect(popup.locator('main canvas')).toHaveCount(1);
		await expect(popup.getByRole('button', { name: 'Télécharger le QR code en PNG' })).toBeVisible();
		await expect(popup.getByRole('button', { name: 'Télécharger le QR code en JPG' })).toBeVisible();
	});

	test('doit télécharger le QR code en PNG quand on clique sur le bouton PNG', async ({ authenticatedPage }) => {
		await openCourseByStatus(authenticatedPage, 'En cours');

		const qrButton = getQrButton(authenticatedPage);
		const [popup] = await Promise.all([
			authenticatedPage.waitForEvent('popup'),
			qrButton.click(),
		]);

		await popup.waitForLoadState('domcontentloaded');
		await popup.locator('main canvas').waitFor({ state: 'visible' });

		await popup.evaluate(() => {
			const originalCreateElement = document.createElement.bind(document);
			(window as unknown as Record<string, unknown>).__capturedDownload = null;
			document.createElement = function <K extends keyof HTMLElementTagNameMap>(tagName: K, options?: ElementCreationOptions): HTMLElementTagNameMap[K] {
				const element = originalCreateElement(tagName, options);
				if (tagName.toLowerCase() === 'a') {
					const anchor = element as HTMLAnchorElement;
					const originalClick = anchor.click.bind(anchor);
					anchor.click = function () {
						if (anchor.download) {
							(window as unknown as Record<string, unknown>).__capturedDownload = {
								filename: anchor.download,
								mimeType: anchor.href.split(';')[0].replace('data:', ''),
							};
						} else {
							originalClick();
						}
					};
				}
				return element;
			} as typeof document.createElement;
		});

		await popup.getByRole('button', { name: 'Télécharger le QR code en PNG' }).click();

		const captured = await popup.evaluate(
			() => (window as unknown as Record<string, unknown>).__capturedDownload as { filename: string; mimeType: string } | null,
		);
		expect(captured).not.toBeNull();
		expect(captured!.filename).toBe('qr-code.png');
		expect(captured!.mimeType).toBe('image/png');
	});

	test('doit télécharger le QR code en JPG quand on clique sur le bouton JPG', async ({ authenticatedPage }) => {
		await openCourseByStatus(authenticatedPage, 'En cours');

		const qrButton = getQrButton(authenticatedPage);
		const [popup] = await Promise.all([
			authenticatedPage.waitForEvent('popup'),
			qrButton.click(),
		]);

		await popup.waitForLoadState('domcontentloaded');
		await popup.locator('main canvas').waitFor({ state: 'visible' });

		await popup.evaluate(() => {
			const originalCreateElement = document.createElement.bind(document);
			(window as unknown as Record<string, unknown>).__capturedDownload = null;
			document.createElement = function <K extends keyof HTMLElementTagNameMap>(tagName: K, options?: ElementCreationOptions): HTMLElementTagNameMap[K] {
				const element = originalCreateElement(tagName, options);
				if (tagName.toLowerCase() === 'a') {
					const anchor = element as HTMLAnchorElement;
					const originalClick = anchor.click.bind(anchor);
					anchor.click = function () {
						if (anchor.download) {
							(window as unknown as Record<string, unknown>).__capturedDownload = {
								filename: anchor.download,
								mimeType: anchor.href.split(';')[0].replace('data:', ''),
							};
						} else {
							originalClick();
						}
					};
				}
				return element;
			} as typeof document.createElement;
		});

		await popup.getByRole('button', { name: 'Télécharger le QR code en JPG' }).click();

		const captured = await popup.evaluate(
			() => (window as unknown as Record<string, unknown>).__capturedDownload as { filename: string; mimeType: string } | null,
		);
		expect(captured).not.toBeNull();
		expect(captured!.filename).toBe('qr-code.jpg');
		expect(captured!.mimeType).toBe('image/jpeg');
	});

	test('doit parcourir le cycle complet de présence au clic sur un étudiant', async ({ authenticatedPage }) => {
		expect(await openCourseByStatus(authenticatedPage, 'En cours')).toBeTruthy();

		const firstStudentCard = getStudentCards(authenticatedPage).first();
		await expect(firstStudentCard).toBeVisible();

		// Repartir d'un etat non-scanné rend le test stable quel que soit l'etat de depart.
		let resetAttemptCount = 0;
		while (await isStudentPresent(firstStudentCard)) {
			await firstStudentCard.click();
			resetAttemptCount += 1;
			if (resetAttemptCount > 6) {
				throw new Error('Impossible de remettre l\'étudiant en non-scanné.');
			}
		}

		await firstStudentCard.click();
		await expect.poll(async () => isStudentPresent(firstStudentCard)).toBe(true);
	});

	test('doit afficher des compteurs cohérents entre total, présents et non-scannés', async ({ authenticatedPage }) => {
		expect(await openCourseByStatus(authenticatedPage, 'En cours')).toBeTruthy();

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
		expect(await openCourseByStatus(authenticatedPage, 'En cours')).toBeTruthy();

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
