import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { ensureAdminApiSession } from '@/lib/actions/admin-auth';
import { groupQueries } from '@/lib/db/queries/group';
import { studentQueries } from '@/lib/db/queries/student';
import { normalizeStudentEmail } from '@/lib/utils/student-email';

type StudentImportError = {
    line: number;
    reason: string;
};

type GroupRecord = {
    groupId: number;
    promo: string;
    td: string;
    tp: string;
    department: string;
};

type StudentRecord = {
    userMail: string;
    firstName: string;
    lastName: string;
    groupId: number | null;
    picture?: string | null;
    groupCode?: string;
    deletedAt?: Date | null;
};

type HeaderIndexByField = {
    lastName: number;
    firstName: number;
    groupCode: number;
    email: number;
};

type ImportSummaryCounter = {
    createdCount: number;
    updatedCount: number;
    restoredCount: number;
    skippedCount: number;
    groupsCreatedCount: number;
    processedRows: number;
};

type ImportState = {
    existingGroups: GroupRecord[];
    groupsByKey: Map<string, GroupRecord>;
    importErrors: StudentImportError[];
    counter: ImportSummaryCounter;
};

type StudentImportAction = 'created' | 'updated' | 'restored' | 'skipped' | 'error';

type RowImportResult = {
    action: StudentImportAction;
    userMail?: string;
};

type PreviewRowState = {
    normalizedEmail: string;
    firstName: string;
    lastName: string;
    rawGroupCode: string;
    parsedGroupCode: { promo: string; td: string; tp: string };
    parsedGroupLabel: string;
    existingStudent: StudentRecord | undefined;
    existingGroup: GroupRecord | undefined;
};

type PreviewImportContext = {
    headerIndexByField: HeaderIndexByField;
    existingStudentsByEmail: Map<string, StudentRecord>;
    groupCodeById: Map<number, string>;
    groupsByKey: Map<string, GroupRecord>;
    previewStudentsByEmail: Map<string, StudentRecord>;
    previewErrors: StudentImportError[];
};

const REQUIRED_HEADERS = {
    lastName: 'nom',
    firstName: 'prenom',
    groupCode: 'groupes tp',
    email: 'mail',
};

const DEFAULT_DEPARTMENT = 'INFO';

function normalizeHeader(rawHeader: unknown): string {
    if (typeof rawHeader !== 'string') {
        return '';
    }

    return rawHeader
        .normalize('NFD')
        .replaceAll(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();
}

function toCellString(value: unknown): string {
    if (typeof value === 'string') {
        return value.trim();
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value).trim();
    }

    return '';
}

function parseGroupCode(rawGroupCode: string): { promo: string; td: string; tp: string } | null {
    const normalizedGroupCode = rawGroupCode.trim().toUpperCase().replaceAll(/[^A-Z0-9]/g, '');
    const groupCodeRegex = /^(\d)([A-Z])(\d)$/;
    const groupCodeMatch = groupCodeRegex.exec(normalizedGroupCode);

    if (!groupCodeMatch) {
        return null;
    }

    return {
        promo: groupCodeMatch[1],
        td: groupCodeMatch[2],
        tp: groupCodeMatch[3],
    };
}

function buildGroupKey(promo: string, td: string, tp: string): string {
    return `${promo}${td}${tp}`;
}

function resolveDepartmentForNewGroup(existingGroups: GroupRecord[], promo: string): string {
    const samePromoGroup = existingGroups.find((group) => group.promo === promo);

    if (samePromoGroup?.department) {
        return samePromoGroup.department;
    }

    const firstKnownDepartment = existingGroups.find((group) => group.department)?.department;
    return firstKnownDepartment ?? DEFAULT_DEPARTMENT;
}

function isRowEmpty(row: unknown[]): boolean {
    return row.every((cellValue) => toCellString(cellValue).length === 0);
}

function getHeaderIndexByField(rows: unknown[][]): { value: HeaderIndexByField | null; error: string | null } {
    const headerRow = rows[0] ?? [];
    const normalizedHeaderRow = headerRow.map((headerCell) => normalizeHeader(headerCell));

    const headerIndexByField: HeaderIndexByField = {
        lastName: normalizedHeaderRow.indexOf(REQUIRED_HEADERS.lastName),
        firstName: normalizedHeaderRow.indexOf(REQUIRED_HEADERS.firstName),
        groupCode: normalizedHeaderRow.indexOf(REQUIRED_HEADERS.groupCode),
        email: normalizedHeaderRow.indexOf(REQUIRED_HEADERS.email),
    };

    const missingHeaders = Object.entries(headerIndexByField)
        .filter(([, index]) => index === -1)
        .map(([fieldName]) => fieldName);

    if (missingHeaders.length > 0) {
        return {
            value: null,
            error: `En-têtes manquants: ${missingHeaders.join(', ')}. En-têtes requis: Civ., Nom, Prénom, Parcours, Groupes TP, Statut, Etat, Mail.`,
        };
    }

    return { value: headerIndexByField, error: null };
}

function createInitialImportState(existingGroups: GroupRecord[]): ImportState {
    const groupsByKey = new Map<string, GroupRecord>();

    for (const group of existingGroups) {
        groupsByKey.set(buildGroupKey(group.promo, group.td, group.tp), group);
    }

    return {
        existingGroups,
        groupsByKey,
        importErrors: [],
        counter: {
            createdCount: 0,
            updatedCount: 0,
            restoredCount: 0,
            skippedCount: 0,
            groupsCreatedCount: 0,
            processedRows: 0,
        },
    };
}

function addImportError(importState: ImportState, line: number, reason: string): void {
    importState.importErrors.push({ line, reason });
    importState.counter.skippedCount += 1;
}

function normalizePreviewOnlyFlag(rawPreviewValue: FormDataEntryValue | null): boolean {
    return typeof rawPreviewValue === 'string' && rawPreviewValue.toLowerCase() === 'true';
}

function buildPreviewRowState(
    row: unknown[],
    context: Pick<PreviewImportContext, 'headerIndexByField' | 'existingStudentsByEmail' | 'groupCodeById' | 'groupsByKey'>
): { value: PreviewRowState | null; error: string | null } {
    const lastName = toCellString(row[context.headerIndexByField.lastName]);
    const firstName = toCellString(row[context.headerIndexByField.firstName]);
    const rawGroupCode = toCellString(row[context.headerIndexByField.groupCode]);
    const rawEmail = toCellString(row[context.headerIndexByField.email]);

    if (!lastName || !firstName || !rawGroupCode || !rawEmail) {
        return { value: null, error: 'Données obligatoires manquantes (Nom, Prénom, Groupes TP, Mail).' };
    }

    const normalizedEmail = normalizeStudentEmail(rawEmail);

    if (!normalizedEmail) {
        return { value: null, error: 'Adresse email invalide.' };
    }

    const parsedGroupCode = parseGroupCode(rawGroupCode);

    if (!parsedGroupCode) {
        return { value: null, error: `Groupe invalide (${rawGroupCode}). Format attendu: 3A1.` };
    }

    const parsedGroupLabel = `${parsedGroupCode.promo}${parsedGroupCode.td}${parsedGroupCode.tp}`;
    const groupKey = buildGroupKey(parsedGroupCode.promo, parsedGroupCode.td, parsedGroupCode.tp);

    return {
        value: {
            normalizedEmail,
            firstName,
            lastName,
            rawGroupCode,
            parsedGroupCode,
            parsedGroupLabel,
            existingStudent: context.existingStudentsByEmail.get(normalizedEmail),
            existingGroup: context.groupsByKey.get(groupKey),
        },
        error: null,
    };
}

function getPreviewStudentOutcome(
    previewRowState: PreviewRowState,
    groupCodeById: Map<number, string>
): 'created' | 'updated' | 'restored' | 'skipped' {
    if (!previewRowState.existingStudent) {
        return 'created';
    }

    const existingGroupCode = typeof previewRowState.existingStudent.groupId === 'number'
        ? groupCodeById.get(previewRowState.existingStudent.groupId) ?? null
        : null;

    const hasChanges = previewRowState.existingStudent.firstName !== previewRowState.firstName
        || previewRowState.existingStudent.lastName !== previewRowState.lastName
        || existingGroupCode !== previewRowState.parsedGroupLabel;

    if (previewRowState.existingStudent.deletedAt === null && !hasChanges) {
        return 'skipped';
    }

    const wasDeleted = previewRowState.existingStudent.deletedAt !== null;

    return wasDeleted ? 'restored' : 'updated';
}

function addPreviewStudentRow(
    previewStudentsByEmail: Map<string, StudentRecord>,
    previewRowState: PreviewRowState
): void {
    previewStudentsByEmail.set(previewRowState.normalizedEmail, {
        userMail: previewRowState.normalizedEmail,
        firstName: previewRowState.firstName,
        lastName: previewRowState.lastName,
        groupId: previewRowState.existingGroup?.groupId ?? null,
        picture: null,
        groupCode: previewRowState.parsedGroupLabel,
    });
}

function processPreviewWorkbookRow(
    row: unknown[],
    excelLineNumber: number,
    context: PreviewImportContext
): { created: number; updated: number; restored: number; skipped: number } {
    const rowStateResult = buildPreviewRowState(row, context);

    if (rowStateResult.error || !rowStateResult.value) {
        context.previewErrors.push({ line: excelLineNumber, reason: rowStateResult.error ?? 'Erreur de prévisualisation.' });
        return { created: 0, updated: 0, restored: 0, skipped: 1 };
    }

    const previewRowState = rowStateResult.value;
    const outcome = getPreviewStudentOutcome(previewRowState, context.groupCodeById);

    if (outcome === 'skipped') {
        return { created: 0, updated: 0, restored: 0, skipped: 1 };
    }

    addPreviewStudentRow(context.previewStudentsByEmail, previewRowState);

    if (outcome === 'created') {
        return { created: 1, updated: 0, restored: 0, skipped: 0 };
    }

    if (outcome === 'restored') {
        return { created: 0, updated: 0, restored: 1, skipped: 0 };
    }

    return { created: 0, updated: 1, restored: 0, skipped: 0 };
}

async function ensureGroupExistsForRow(importState: ImportState, rawGroupCode: string, excelLineNumber: number): Promise<GroupRecord | null> {
    const parsedGroupCode = parseGroupCode(rawGroupCode);

    if (!parsedGroupCode) {
        const errorMsg = `Groupe invalide (${rawGroupCode}). Format attendu: 3A1.`;
        addImportError(importState, excelLineNumber, errorMsg);
        return null;
    }

    const groupKey = buildGroupKey(parsedGroupCode.promo, parsedGroupCode.td, parsedGroupCode.tp);
    const existingGroup = importState.groupsByKey.get(groupKey);

    if (existingGroup) {
        return existingGroup;
    }

    const department = resolveDepartmentForNewGroup(importState.existingGroups, parsedGroupCode.promo);
    const groupCreationResult = await groupQueries.create({
        promo: parsedGroupCode.promo,
        td: parsedGroupCode.td,
        tp: parsedGroupCode.tp,
        department,
        codePath: null,
        descriptionPath: null,
    });

    if ('error' in groupCreationResult) {
        const errorMsg = `Création du groupe impossible (${groupKey}): ${groupCreationResult.error}`;
        addImportError(importState, excelLineNumber, errorMsg);
        return null;
    }

    const newGroup = groupCreationResult.entity as GroupRecord;
    importState.existingGroups.push(newGroup);
    importState.groupsByKey.set(groupKey, newGroup);
    importState.counter.groupsCreatedCount += 1;

    return newGroup;
}

async function upsertStudentForRow(importState: ImportState, excelLineNumber: number, studentData: StudentRecord): Promise<RowImportResult> {
    const activeStudentResult = await studentQueries.getByEmail(studentData.userMail);

    if ('success' in activeStudentResult) {
        const currentStudent = activeStudentResult.entity as StudentRecord;
        const hasChanges = currentStudent.firstName !== studentData.firstName
            || currentStudent.lastName !== studentData.lastName
            || currentStudent.groupId !== studentData.groupId;

        if (!hasChanges) {
            importState.counter.skippedCount += 1;
            importState.counter.processedRows += 1;
            return { action: 'skipped', userMail: studentData.userMail };
        }

        const updateResult = await studentQueries.updateByEmail(studentData.userMail, {
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            groupId: studentData.groupId,
            isTeacher: false,
            deletedAt: null,
        });

        if ('error' in updateResult) {
            const errorMsg = `Mise à jour impossible: ${updateResult.error}`;
            addImportError(importState, excelLineNumber, errorMsg);
            return { action: 'error', userMail: studentData.userMail };
        }
        importState.counter.updatedCount += 1;
        importState.counter.processedRows += 1;
        return { action: 'updated', userMail: studentData.userMail };
    }
    const deletedStudentResult = await studentQueries.getByEmailIncludingDeleted(studentData.userMail);

    if ('success' in deletedStudentResult && deletedStudentResult.entity.deletedAt !== null) {
        const restoreResult = await studentQueries.restoreByEmail(studentData.userMail, {
            firstName: studentData.firstName,
            lastName: studentData.lastName,
            groupId: studentData.groupId,
            isTeacher: false,
            password: null,
            picture: null,
        });

        if ('error' in restoreResult) {
            const errorMsg = `Restauration impossible: ${restoreResult.error}`;
            addImportError(importState, excelLineNumber, errorMsg);
            return { action: 'error', userMail: studentData.userMail };
        }
        importState.counter.restoredCount += 1;
        importState.counter.processedRows += 1;
        return { action: 'restored', userMail: studentData.userMail };
    }
    const createResult = await studentQueries.create({
        userMail: studentData.userMail,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        password: null,
        isTeacher: false,
        groupId: studentData.groupId,
        picture: null,
    });

    if ('error' in createResult) {
        const errorMsg = `Création impossible: ${createResult.error}`;
        addImportError(importState, excelLineNumber, errorMsg);
        return { action: 'error', userMail: studentData.userMail };
    }
    importState.counter.createdCount += 1;
    importState.counter.processedRows += 1;
    return { action: 'created', userMail: studentData.userMail };
}

async function processSpreadsheetRow(
    importState: ImportState,
    row: unknown[],
    excelLineNumber: number,
    headerIndexByField: HeaderIndexByField
): Promise<RowImportResult> {
    const lastName = toCellString(row[headerIndexByField.lastName]);
    const firstName = toCellString(row[headerIndexByField.firstName]);
    const rawGroupCode = toCellString(row[headerIndexByField.groupCode]);
    const rawEmail = toCellString(row[headerIndexByField.email]);

    if (!lastName || !firstName || !rawGroupCode || !rawEmail) {
        const errorMsg = 'Données obligatoires manquantes (Nom, Prénom, Groupes TP, Mail).';
        addImportError(importState, excelLineNumber, errorMsg);
        return { action: 'error' };
    }

    const normalizedEmail = normalizeStudentEmail(rawEmail);

    if (!normalizedEmail) {
        const errorMsg = 'Adresse email invalide.';
        addImportError(importState, excelLineNumber, errorMsg);
        return { action: 'error' };
    }

    const targetGroup = await ensureGroupExistsForRow(importState, rawGroupCode, excelLineNumber);

    if (!targetGroup) {
        return { action: 'error', userMail: normalizedEmail };
    }

    return upsertStudentForRow(importState, excelLineNumber, {
        userMail: normalizedEmail,
        firstName,
        lastName,
        groupId: targetGroup.groupId,
    });
}

async function parseWorkbookRows(file: File): Promise<{ value: unknown[][] | null; error: string | null }> {
    const fileName = file.name.toLowerCase();
    const isAcceptedFile = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');

    if (!isAcceptedFile) {
        return { value: null, error: 'Formats acceptés: .xlsx, .xls, .csv.' };
    }

    const fileBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(fileBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) {
        return { value: null, error: 'Le fichier ne contient aucune feuille.' };
    }

    const firstSheet = workbook.Sheets[firstSheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(firstSheet, { header: 1, raw: false, defval: '' });

    if (rows.length === 0) {
        return { value: null, error: 'Le fichier est vide.' };
    }

    return { value: rows, error: null };
}

export async function POST(request: Request) {
    const unauthorizedResponse = await ensureAdminApiSession();

    if (unauthorizedResponse) {
        return unauthorizedResponse;
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const previewOnly = normalizePreviewOnlyFlag(formData.get('preview'));

    if (!(file instanceof File)) {
        return NextResponse.json({ error: 'Le fichier est requis.' }, { status: 400 });
    }

    const parsedWorkbook = await parseWorkbookRows(file);

    if (parsedWorkbook.error || !parsedWorkbook.value) {
        return NextResponse.json({ error: parsedWorkbook.error ?? 'Fichier invalide.' }, { status: 400 });
    }

    const rows = parsedWorkbook.value;
    const headerResolution = getHeaderIndexByField(rows);

    if (headerResolution.error || !headerResolution.value) {
        return NextResponse.json({ error: headerResolution.error ?? 'En-têtes invalides.' }, { status: 400 });
    }

    const headerIndexByField = headerResolution.value;

    if (previewOnly) {
        return handlePreviewImport(rows, headerIndexByField);
    }

    return handleLiveImport(rows, headerIndexByField);
}

async function handlePreviewImport(rows: unknown[][], headerIndexByField: HeaderIndexByField) {
    const groupsResult = await groupQueries.getAll();
    const existingGroups = 'success' in groupsResult ? (groupsResult.entity as GroupRecord[]) : [];
    const existingStudentsResult = await studentQueries.getAllIncludingDeleted();
    const existingStudentsIncludingDeleted = 'success' in existingStudentsResult ? existingStudentsResult.entity : [];

    const groupsByKey = new Map<string, GroupRecord>();
    const groupCodeById = new Map<number, string>();

    for (const group of existingGroups) {
        groupsByKey.set(buildGroupKey(group.promo, group.td, group.tp), group);
        groupCodeById.set(group.groupId, buildGroupKey(group.promo, group.td, group.tp));
    }

    const existingStudentsByEmail = new Map(existingStudentsIncludingDeleted.map((student) => [student.userMail, student]));
    const previewStudentsByEmail = new Map<string, StudentRecord>();
    const previewErrors: StudentImportError[] = [];
    const previewContext: PreviewImportContext = {
        headerIndexByField,
        existingStudentsByEmail,
        groupCodeById,
        groupsByKey,
        previewStudentsByEmail,
        previewErrors,
    };
    let createdCount = 0;
    let updatedCount = 0;
    let restoredCount = 0;
    let skippedCount = 0;

    for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
        const currentRow = rows[rowIndex] ?? [];
        const excelLineNumber = rowIndex + 1;

        if (isRowEmpty(currentRow)) {
            continue;
        }

        const rowOutcome = processPreviewWorkbookRow(currentRow, excelLineNumber, previewContext);

        createdCount += rowOutcome.created;
        updatedCount += rowOutcome.updated;
        restoredCount += rowOutcome.restored;
        skippedCount += rowOutcome.skipped;
    }

    return NextResponse.json(
        {
            summary: {
                totalRows: Math.max(rows.length - 1, 0),
                processedRows: createdCount + updatedCount + restoredCount + skippedCount,
                createdCount,
                updatedCount,
                restoredCount,
                skippedCount,
                groupsCreatedCount: 0,
                errors: previewErrors,
            },
            students: [],
            groups: existingGroups,
            initializationStudents: Array.from(previewContext.previewStudentsByEmail.values()),
        },
        { status: 200 }
    );
}

async function handleLiveImport(rows: unknown[][], headerIndexByField: HeaderIndexByField) {
    const groupsResult = await groupQueries.getAll();
    const existingGroups = 'success' in groupsResult ? (groupsResult.entity as GroupRecord[]) : [];
    const importState = createInitialImportState(existingGroups);
    const initializedStudentEmails = new Set<string>();
    for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
        const currentRow = rows[rowIndex] ?? [];
        const excelLineNumber = rowIndex + 1;

        if (isRowEmpty(currentRow)) {
            continue;
        }

        const rowResult = await processSpreadsheetRow(importState, currentRow, excelLineNumber, headerIndexByField);

        if ((rowResult.action === 'created' || rowResult.action === 'restored') && rowResult.userMail) {
            initializedStudentEmails.add(rowResult.userMail);
        }
    }

    const studentsResult = await studentQueries.getAll();
    const groupsAfterImportResult = await groupQueries.getAll();

    const students = 'success' in studentsResult ? studentsResult.entity : [];
    const groups = 'success' in groupsAfterImportResult ? groupsAfterImportResult.entity : [];
    const initializationStudents = students.filter((student) => initializedStudentEmails.has(student.userMail));

    return NextResponse.json(
        {
            summary: {
                totalRows: Math.max(rows.length - 1, 0),
                processedRows: importState.counter.processedRows,
                createdCount: importState.counter.createdCount,
                updatedCount: importState.counter.updatedCount,
                restoredCount: importState.counter.restoredCount,
                skippedCount: importState.counter.skippedCount,
                groupsCreatedCount: importState.counter.groupsCreatedCount,
                errors: importState.importErrors,
            },
            students,
            groups,
            initializationStudents,
        },
        { status: 200 }
    );
}

