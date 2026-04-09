import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';
import * as XLSXNamespace from 'xlsx';

import * as studentModule from '../lib/db/queries/student.ts';

const XLSX = XLSXNamespace.default ?? XLSXNamespace;
const DEFAULT_OUTPUT_PATH = path.resolve('upload', 'Students.xlsx');
const { studentQueries } = studentModule.default ?? studentModule;

async function exportStudentsWorkbook(outputPath) {
  const studentsResult = await studentQueries.getAll();

  if ('error' in studentsResult) {
    throw new Error(studentsResult.error);
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const rows = studentsResult.entity.map((student) => ({
    'Civ.': student.civ ?? '',
    Nom: student.lastName ?? '',
    'Prénom': student.firstName ?? '',
    Parcours: student.parcours ?? '',
    'Groupes TP': student.groupId ?? '',
    Statut: student.status ?? '',
    Etat: student.state ?? '',
    Mail: student.userMail ?? '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: ['Civ.', 'Nom', 'Prénom', 'Parcours', 'Groupes TP', 'Statut', 'Etat', 'Mail'],
  });

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Etudiants');
  XLSX.writeFile(workbook, outputPath);

  return { totalStudents: rows.length, outputPath };
}

async function main() {
  const outputPath = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_OUTPUT_PATH;
  const result = await exportStudentsWorkbook(outputPath);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});