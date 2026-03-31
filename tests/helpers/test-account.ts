import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { table as teacherTable } from '@/lib/db/schema/teacher';
import { table as studentTable } from '@/lib/db/schema/student';

export function getTestAccountEmail(): string {
    return process.env.TEST_ACCOUNT_EMAIL ?? 'test@univ-rennes.fr';
}

export function getTestAccountLocalPart(): string {
    return getTestAccountEmail().split('@')[0];
}

export function getTestAccountPassword(): string {
    return process.env.TEST_ACCOUNT_PASSWORD ?? 'MotDePasse1';
}

type TeacherAccountOptions = {
    isValidated?: boolean;
    isAdmin?: boolean;
    firstName?: string;
    lastName?: string;
};

export async function ensureTeacherAccountByEmail(
    teacherEmail: string,
    plainPassword: string,
    options: TeacherAccountOptions = {},
): Promise<void> {
    const isTeacherValidated = options.isValidated ?? true;
    const isTeacherAdmin = options.isAdmin ?? false;
    const teacherFirstName = options.firstName ?? 'Test';
    const teacherLastName = options.lastName ?? 'Teacher';
    const teacherPasswordHash = await bcrypt.hash(plainPassword, 12);

    await db.insert(teacherTable).values({
        userMail: teacherEmail,
        firstName: teacherFirstName,
        lastName: teacherLastName,
        password: teacherPasswordHash,
        isTeacher: true,
        isValidated: isTeacherValidated,
        isAdmin: isTeacherAdmin,
    }).onConflictDoUpdate({
        target: teacherTable.userMail,
        set: {
            firstName: teacherFirstName,
            lastName: teacherLastName,
            password: teacherPasswordHash,
            isTeacher: true,
            isValidated: isTeacherValidated,
            isAdmin: isTeacherAdmin,
        },
    });
}

export async function deleteTeacherAccountByEmail(teacherEmail: string): Promise<void> {
    await db.delete(teacherTable).where(eq(teacherTable.userMail, teacherEmail));
}

export async function ensureTestTeacherAccount(): Promise<void> {
    const testAccountEmail = getTestAccountEmail();
    const testAccountPassword = getTestAccountPassword();

    await ensureTeacherAccountByEmail(testAccountEmail, testAccountPassword);
}

type StudentAccountOptions = {
    firstName?: string;
    lastName?: string;
    groupId?: number | null;
};

export async function ensureStudentAccountByEmail(
    studentEmail: string,
    plainPassword: string,
    options: StudentAccountOptions = {},
): Promise<void> {
    const studentFirstName = options.firstName ?? 'Test';
    const studentLastName = options.lastName ?? 'Student';
    const studentGroupId = options.groupId ?? null;
    const studentPasswordHash = await bcrypt.hash(plainPassword, 12);

    await db.insert(studentTable).values({
        userMail: studentEmail,
        firstName: studentFirstName,
        lastName: studentLastName,
        password: studentPasswordHash,
        groupId: studentGroupId,
    }).onConflictDoUpdate({
        target: studentTable.userMail,
        set: {
            firstName: studentFirstName,
            lastName: studentLastName,
            password: studentPasswordHash,
            groupId: studentGroupId,
        },
    });
}

export async function deleteStudentAccountByEmail(studentEmail: string): Promise<void> {
    await db.delete(studentTable).where(eq(studentTable.userMail, studentEmail));
}

