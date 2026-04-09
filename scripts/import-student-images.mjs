import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { File } from 'node:buffer';
import * as XLSXNamespace from 'xlsx';
import { del, put } from '@vercel/blob';

import * as studentModule from '../lib/db/queries/student.ts';

const XLSX = XLSXNamespace.default ?? XLSXNamespace;
const DEFAULT_WORKBOOK_PATH = path.resolve('upload', 'Students.xlsx');
const DEFAULT_IMAGES_DIR = path.resolve('upload', 'generated-faces');
const STUDENT_EMAIL_DOMAIN = 'etudiant.univ-rennes.fr';
const { studentQueries } = studentModule.default ?? studentModule;

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function normalizeTokenForFileName(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeEmail(rawEmail) {
  const normalizedEmail = normalizeText(rawEmail);

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

  const headerRow = rows[0].map((headerCell) => normalizeText(headerCell));
  const firstNameIndex = headerRow.indexOf('prenom');
  const lastNameIndex = headerRow.indexOf('nom');
  const emailIndex = headerRow.indexOf('mail');

  if (firstNameIndex === -1 || lastNameIndex === -1 || emailIndex === -1) {
    throw new Error('En-têtes manquants. Requis: Nom, Prenom, Mail.');
  }

  const students = [];

  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex] ?? [];
    const firstName = String(row[firstNameIndex] ?? '').trim();
    const lastName = String(row[lastNameIndex] ?? '').trim();
    const email = normalizeEmail(row[emailIndex]);

    if (!firstName || !lastName || !email) {
      continue;
    }

    students.push({ firstName, lastName, email });
  }

  return students;
}

function buildExpectedFileNameMap(students) {
  const baseNameCounts = new Map();
  const expectedFileNameByEmail = new Map();

  for (const student of students) {
    const baseName = `${normalizeTokenForFileName(student.lastName)}-${normalizeTokenForFileName(student.firstName)}`;
    const nextCount = (baseNameCounts.get(baseName) ?? 0) + 1;
    baseNameCounts.set(baseName, nextCount);

    const fileName = nextCount === 1 ? `${baseName}.jpg` : `${baseName}-${nextCount}.jpg`;
    expectedFileNameByEmail.set(student.email, fileName);
  }

  return expectedFileNameByEmail;
}

function detectImageMimeType(fileBytes) {
  if (fileBytes.length < 12) {
    return null;
  }

  if (fileBytes[0] === 0xff && fileBytes[1] === 0xd8 && fileBytes[2] === 0xff) {
    return 'image/jpeg';
  }

  if (
    fileBytes[0] === 0x89 && fileBytes[1] === 0x50 && fileBytes[2] === 0x4e && fileBytes[3] === 0x47
    && fileBytes[4] === 0x0d && fileBytes[5] === 0x0a && fileBytes[6] === 0x1a && fileBytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  if (
    fileBytes[0] === 0x47 && fileBytes[1] === 0x49 && fileBytes[2] === 0x46 && fileBytes[3] === 0x38
    && (fileBytes[4] === 0x37 || fileBytes[4] === 0x39) && fileBytes[5] === 0x61
  ) {
    return 'image/gif';
  }

  if (
    fileBytes[0] === 0x52 && fileBytes[1] === 0x49 && fileBytes[2] === 0x46 && fileBytes[3] === 0x46
    && fileBytes[8] === 0x57 && fileBytes[9] === 0x45 && fileBytes[10] === 0x42 && fileBytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
}

function buildBlobFileName(student, mimeType) {
  const localPart = student.email.split('@')[0] ?? 'student';
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/webp' ? 'webp' : mimeType === 'image/gif' ? 'gif' : 'jpg';
  const timestamp = Date.now();
  return `students/${localPart}-${timestamp}.${extension}`;
}

function isBlobReference(value) {
  return typeof value === 'string' && (value.startsWith('students/') || value.includes('blob.vercel-storage.com'));
}

async function deletePreviousPictureIfNeeded(picture) {
  if (!isBlobReference(picture) || !process.env.BLOB_READ_WRITE_TOKEN) {
    return;
  }

  try {
    await del(picture, { token: process.env.BLOB_READ_WRITE_TOKEN });
  } catch (error) {
    console.error('Impossible de supprimer l\'ancienne image Blob:', error);
  }
}

async function importStudentImages(workbookPath, imagesDir) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error('BLOB_READ_WRITE_TOKEN manquant.');
  }

  const students = readStudentsFromWorkbook(workbookPath);
  const expectedFileNameByEmail = buildExpectedFileNameMap(students);
  const studentListResult = await studentQueries.getAll();

  if ('error' in studentListResult) {
    throw new Error('Aucun étudiant trouvé dans la base.');
  }

  const studentsByEmail = new Map(studentListResult.entity.map((student) => [student.userMail, student]));

  let updatedCount = 0;
  let skippedCount = 0;

  for (const student of students) {
    const expectedFileName = expectedFileNameByEmail.get(student.email);

    if (!expectedFileName) {
      skippedCount += 1;
      console.log(`SKIP ${student.email}: fichier attendu introuvable.`);
      continue;
    }

    const imagePath = path.join(imagesDir, expectedFileName);

    try {
      await fs.access(imagePath);
    } catch {
      skippedCount += 1;
      console.log(`SKIP ${student.email}: image absente (${expectedFileName}).`);
      continue;
    }

    const imageBuffer = await fs.readFile(imagePath);
    const mimeType = detectImageMimeType(imageBuffer);

    if (!mimeType) {
      skippedCount += 1;
      console.log(`SKIP ${student.email}: type d'image invalide (${expectedFileName}).`);
      continue;
    }

    const currentStudent = studentsByEmail.get(student.email);

    if (!currentStudent) {
      skippedCount += 1;
      console.log(`SKIP ${student.email}: étudiant introuvable en base.`);
      continue;
    }

    const uploadedBlob = await put(buildBlobFileName(student, mimeType), new File([imageBuffer], expectedFileName, { type: mimeType }), {
      token: process.env.BLOB_READ_WRITE_TOKEN,
      access: 'private',
      addRandomSuffix: true,
    });

    const updateResult = await studentQueries.updateByEmail(student.email, {
      picture: uploadedBlob.pathname,
    });

    if ('error' in updateResult) {
      await del(uploadedBlob.pathname, { token: process.env.BLOB_READ_WRITE_TOKEN });
      skippedCount += 1;
      console.log(`SKIP ${student.email}: mise à jour base échouée.`);
      continue;
    }

    await deletePreviousPictureIfNeeded(currentStudent.picture);
    updatedCount += 1;
    console.log(`OK ${student.email} <- ${expectedFileName}`);
  }

  return { totalStudents: students.length, updatedCount, skippedCount };
}

async function main() {
  const workbookPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_WORKBOOK_PATH;
  const imagesDir = process.argv[3] ? path.resolve(process.argv[3]) : DEFAULT_IMAGES_DIR;

  const result = await importStudentImages(workbookPath, imagesDir);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});