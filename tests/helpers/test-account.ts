import bcrypt from 'bcrypt';
import { and, eq, or } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { table as teacherTable } from '@/lib/db/schema/teacher';
import { table as studentTable } from '@/lib/db/schema/student';
import { table as groupTable } from '@/lib/db/schema/group';
import { table as resetPasswordSessionTable } from '@/lib/db/schema/reset-password-session';

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

async function getOrCreateDefaultTestGroup(): Promise<number> {
    const existing = await db.select({ groupId: groupTable.groupId })
        .from(groupTable)
        .where(and(
            eq(groupTable.promo, '1'),
            eq(groupTable.td, 'A'),
            eq(groupTable.tp, '1'),
            eq(groupTable.department, 'TEST'),
        ))
        .limit(1);

    if (existing.length > 0) {
        return existing[0].groupId;
    }

    const [created] = await db.insert(groupTable).values({
        promo: '1',
        td: 'A',
        tp: '1',
        department: 'TEST',
    }).returning({ groupId: groupTable.groupId });

    return created.groupId;
}

export async function ensureStudentAccountByEmail(
    studentEmail: string,
    plainPassword: string,
    options: StudentAccountOptions = {},
): Promise<void> {
    const studentFirstName = options.firstName ?? 'Test';
    const studentLastName = options.lastName ?? 'Student';
    const studentPasswordHash = await bcrypt.hash(plainPassword, 12);
    const groupId = options.groupId ?? await getOrCreateDefaultTestGroup();

    await db.insert(studentTable).values({
        userMail: studentEmail,
        firstName: studentFirstName,
        lastName: studentLastName,
        password: studentPasswordHash,
        isTeacher: false,
        groupId,
    }).onConflictDoUpdate({
        target: studentTable.userMail,
        set: {
            firstName: studentFirstName,
            lastName: studentLastName,
            password: studentPasswordHash,
            isTeacher: false,
            groupId,
        },
    });
}

export async function deleteStudentAccountByEmail(studentEmail: string): Promise<void> {
    await db.delete(studentTable).where(eq(studentTable.userMail, studentEmail));
}

type ResetSessionTarget = 'teacher' | 'student';

export async function createResetPasswordSessionInDb(
    userEmail: string,
    target: ResetSessionTarget,
    expiresInMinutes = 60,
): Promise<string> {
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    await db.insert(resetPasswordSessionTable).values({
        id: sessionId,
        userMailTeacher: target === 'teacher' ? userEmail : null,
        userMailStudent: target === 'student' ? userEmail : null,
        expiresAt,
    });

    return sessionId;
}

export async function createExpiredResetPasswordSessionInDb(
    userEmail: string,
    target: ResetSessionTarget,
): Promise<string> {
    return createResetPasswordSessionInDb(userEmail, target, -1);
}

export async function deleteResetPasswordSessionsByEmail(userEmail: string): Promise<void> {
    await db
        .delete(resetPasswordSessionTable)
        .where(
            or(
                eq(resetPasswordSessionTable.userMailTeacher, userEmail),
                eq(resetPasswordSessionTable.userMailStudent, userEmail),
            ),
        );
}
