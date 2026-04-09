import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import * as XLSXNamespace from 'xlsx';

const XLSX = XLSXNamespace.default ?? XLSXNamespace;
const DEFAULT_WORKBOOK_PATH = path.resolve('upload', 'Students.xlsx');
const DEFAULT_OUTPUT_DIR = path.resolve('upload', 'generated-faces');
const DEFAULT_CONCURRENCY = 4;
const DEFAULT_RETRY_ATTEMPTS = 5;
const MAX_RETRY_ROUNDS = 3;
const REQUEST_TIMEOUT_MS = 20000;
const MIN_VALID_IMAGE_SIZE_BYTES = 3000;
const STUDENT_EMAIL_DOMAIN = 'etudiant.univ-rennes.fr';

function normalizeHeader(rawHeader) {
  if (typeof rawHeader !== 'string') {
    return '';
  }

  return rawHeader
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function toCellString(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }

  return '';
}

function normalizeEmailInput(inputEmail) {
  return inputEmail
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeStudentEmail(rawEmail) {
  const normalizedEmail = normalizeEmailInput(rawEmail);

  if (!normalizedEmail) {
    return null;
  }

  if (!normalizedEmail.includes('@')) {
    if (!/^[a-z0-9._-]+$/.test(normalizedEmail)) {
      return null;
    }

    return `${normalizedEmail}@${STUDENT_EMAIL_DOMAIN}`;
  }

  const emailParts = normalizedEmail.split('@');

  if (emailParts.length !== 2) {
    return null;
  }

  const [localPart, domainPart] = emailParts;

  if (!localPart || !domainPart) {
    return null;
  }

  if (!/^[a-z0-9._-]+$/.test(localPart)) {
    return null;
  }

  if (domainPart !== STUDENT_EMAIL_DOMAIN) {
    return null;
  }

  return `${localPart}@${domainPart}`;
}

function readStudentsFromWorkbook(workbookPath) {
  const workbook = XLSX.readFile(workbookPath, { raw: false });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error('Le fichier ne contient aucune feuille.');
  }

  const firstSheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, raw: false, defval: '' });

  if (!Array.isArray(rows) || rows.length <= 1) {
    throw new Error('Le fichier est vide ou sans lignes de données.');
  }

  const headerRow = rows[0];
  const normalizedHeaderRow = headerRow.map((headerCell) => normalizeHeader(headerCell));

  const firstNameIndex = normalizedHeaderRow.indexOf('prenom');
  const lastNameIndex = normalizedHeaderRow.indexOf('nom');
  const emailIndex = normalizedHeaderRow.indexOf('mail');

  if (firstNameIndex === -1 || lastNameIndex === -1 || emailIndex === -1) {
    throw new Error('En-tetes manquants. Requis: Nom, Prenom, Mail.');
  }

  const students = [];
  const seenEmails = new Set();

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];
    const firstName = toCellString(row[firstNameIndex]);
    const lastName = toCellString(row[lastNameIndex]);
    const rawEmail = toCellString(row[emailIndex]);

    if (!firstName && !lastName && !rawEmail) {
      continue;
    }

    const normalizedEmail = normalizeStudentEmail(rawEmail);

    if (!firstName || !lastName || !normalizedEmail) {
      continue;
    }

    if (seenEmails.has(normalizedEmail)) {
      continue;
    }

    seenEmails.add(normalizedEmail);
    students.push({
      firstName,
      lastName,
      email: normalizedEmail,
    });
  }

  return students;
}

function buildAvatarUrl(student) {
  const seedInput = `${student.firstName}-${student.lastName}-${student.email}`;
  const numericSeed = hashStringToSeed(seedInput);

  // ThisPersonDoesNotExist: portraits photorealistes. Le query param evite le cache CDN.
  return `https://thispersondoesnotexist.com/?seed=${numericSeed}&cb=${Date.now()}-${numericSeed}`;
}

function normalizeNameForFile(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'unknown';
}

function buildStudentBaseFileName(student) {
  const normalizedLastName = normalizeNameForFile(student.lastName);
  const normalizedFirstName = normalizeNameForFile(student.firstName);
  return `${normalizedLastName}-${normalizedFirstName}`;
}

function buildOutputFileNameMap(students) {
  const usedFileNameCounts = new Map();
  const outputFileNameByEmail = new Map();

  for (const student of students) {
    const baseFileName = buildStudentBaseFileName(student);
    const baseCount = usedFileNameCounts.get(baseFileName) ?? 0;
    const nextCount = baseCount + 1;
    usedFileNameCounts.set(baseFileName, nextCount);

    const uniqueFileName = nextCount === 1 ? `${baseFileName}.jpg` : `${baseFileName}-${nextCount}.jpg`;
    outputFileNameByEmail.set(student.email, uniqueFileName);
  }

  return outputFileNameByEmail;
}

function hashStringToSeed(value) {
  let hashValue = 2166136261;

  for (let characterIndex = 0; characterIndex < value.length; characterIndex += 1) {
    hashValue ^= value.charCodeAt(characterIndex);
    hashValue = Math.imul(hashValue, 16777619);
  }

  return Math.abs(hashValue >>> 0);
}

function getConcurrencyValue(rawConcurrency) {
  const parsedConcurrency = Number.parseInt(rawConcurrency ?? '', 10);

  if (Number.isNaN(parsedConcurrency) || parsedConcurrency <= 0) {
    return DEFAULT_CONCURRENCY;
  }

  return Math.min(parsedConcurrency, 64);
}

function sleep(delayMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

async function fetchImageWithRetry(url, attempts = DEFAULT_RETRY_ATTEMPTS) {
  let lastError = null;

  for (let attemptIndex = 0; attemptIndex < attempts; attemptIndex += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Accept: 'image/jpeg,image/*;q=0.8,*/*;q=0.1',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) face-generator/1.0',
        },
      });

      if (response.ok) {
        const contentTypeHeader = response.headers.get('content-type') ?? '';

        if (!contentTypeHeader.toLowerCase().startsWith('image/')) {
          throw new Error(`INVALID_CONTENT_TYPE_${contentTypeHeader || 'unknown'}`);
        }

        const imageBuffer = Buffer.from(await response.arrayBuffer());

        if (imageBuffer.length < MIN_VALID_IMAGE_SIZE_BYTES) {
          throw new Error(`IMAGE_TOO_SMALL_${imageBuffer.length}`);
        }

        return imageBuffer;
      }

      const shouldRetry = response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500;

      if (!shouldRetry) {
        throw new Error(`HTTP ${response.status}`);
      }

      throw new Error(`RETRY_HTTP_${response.status}`);
    } catch (error) {
      lastError = error;

      if (attemptIndex < attempts - 1) {
        const retryDelayMs = Math.min(8000, 1000 + attemptIndex * 1200 + Math.floor(Math.random() * 400));

        await sleep(retryDelayMs);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Requete image echouee.');
}

async function generateSingleFace(student, outputDir, outputFileNameByEmail) {
  const outputFileName = outputFileNameByEmail.get(student.email) ?? `${buildStudentBaseFileName(student)}.jpg`;
  const outputFilePath = path.join(outputDir, outputFileName);

  try {
    await fs.access(outputFilePath);
    return { outputFilePath, skipped: true };
  } catch {
    // File does not exist yet, generation is required.
  }

  // Petit lissage de debit reseau.
  await sleep(120 + Math.floor(Math.random() * 260));

  const avatarUrl = buildAvatarUrl(student);
  const imageBuffer = await fetchImageWithRetry(avatarUrl, DEFAULT_RETRY_ATTEMPTS);

  await fs.writeFile(outputFilePath, imageBuffer);
  return { outputFilePath, skipped: false };
}

async function runWithConcurrency(items, concurrency, worker) {
  const queue = [...items];
  const results = [];

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const nextItem = queue.shift();

      if (!nextItem) {
        continue;
      }

      const nextResult = await worker(nextItem);
      results.push(nextResult);
    }
  });

  await Promise.all(workers);
  return results;
}

async function generateFaces(workbookPath, outputDir, concurrency) {
  await fs.mkdir(outputDir, { recursive: true });

  const students = readStudentsFromWorkbook(workbookPath);

  if (students.length === 0) {
    throw new Error('Aucun etudiant valide trouve dans le fichier.');
  }

  const outputFileNameByEmail = buildOutputFileNameMap(students);

  let generatedCount = 0;
  let skippedCount = 0;
  let pendingStudents = [...students];
  const failedItems = [];

  for (let retryRoundIndex = 1; retryRoundIndex <= MAX_RETRY_ROUNDS && pendingStudents.length > 0; retryRoundIndex += 1) {
    const currentRoundStudents = pendingStudents;
    pendingStudents = [];

    console.log(`Passe ${retryRoundIndex}/${MAX_RETRY_ROUNDS} sur ${currentRoundStudents.length} images restantes...`);

    const roundResults = await runWithConcurrency(currentRoundStudents, concurrency, async (student) => {
      try {
        const generationResult = await generateSingleFace(student, outputDir, outputFileNameByEmail);

        if (generationResult.skipped) {
          skippedCount += 1;
        } else {
          generatedCount += 1;
        }

        const progressedCount = generatedCount + skippedCount;
        if (progressedCount % 10 === 0 || progressedCount === students.length) {
          console.log(`Progression: ${progressedCount}/${students.length} (nouveaux: ${generatedCount}, deja presents: ${skippedCount})`);
        }

        return {
          email: student.email,
          student,
          status: 'success',
        };
      } catch (error) {
        return {
          email: student.email,
          student,
          status: 'failed',
          reason: error instanceof Error ? error.message : String(error),
        };
      }
    });

    for (const roundResult of roundResults) {
      if (roundResult.status === 'failed') {
        pendingStudents.push(roundResult.student);
      }
    }

    if (pendingStudents.length > 0 && retryRoundIndex < MAX_RETRY_ROUNDS) {
      await sleep(2000);
    }
  }

  for (const failedStudent of pendingStudents) {
    failedItems.push({
      email: failedStudent.email,
      status: 'failed',
      reason: 'FAILED_AFTER_MAX_RETRY_ROUNDS',
    });
  }

  const failedCount = failedItems.length;

  return {
    generatedCount,
    skippedCount,
    failedCount,
    totalStudents: students.length,
    outputDir,
    failedItems,
  };
}

async function main() {
  const workbookPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_WORKBOOK_PATH;
  const outputDir = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_OUTPUT_DIR;
  const concurrency = getConcurrencyValue(process.argv[4] ?? process.env.FACE_GENERATION_CONCURRENCY);

  const result = await generateFaces(workbookPath, outputDir, concurrency);
  console.log(`Images generees (nouvelles): ${result.generatedCount}/${result.totalStudents}`);
  console.log(`Images deja presentes: ${result.skippedCount}`);
  console.log(`Echecs: ${result.failedCount}`);
  console.log(`Concurrence: ${concurrency}`);
  console.log(`Dossier de sortie: ${result.outputDir}`);

  if (result.failedItems.length > 0) {
    const previewFailures = result.failedItems.slice(0, 10);
    console.log('Exemples d\'echecs:');
    for (const failedItem of previewFailures) {
      console.log(`- ${failedItem.email}: ${failedItem.reason}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
