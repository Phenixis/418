import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { table as teacherTable } from '@/lib/db/schema/teacher';

export function getTestAccountEmail(): string {
    return process.env.TEST_ACCOUNT_EMAIL ?? 'test@univ-rennes.fr';
}

export function getTestAccountLocalPart(): string {
    return getTestAccountEmail().split('@')[0];
}

export function getTestAccountPassword(): string {
    return process.env.TEST_ACCOUNT_PASSWORD ?? 'MotDePasse1';
}

export async function ensureTeacherAccountByEmail(teacherEmail: string, plainPassword: string): Promise<void> {
    const teacherPasswordHash = await bcrypt.hash(plainPassword, 12);

    const existingTeacher = await db
        .select({ userMail: teacherTable.userMail })
        .from(teacherTable)
        .where(eq(teacherTable.userMail, teacherEmail))
        .limit(1);

    if (existingTeacher.length > 0) {
        await db
            .update(teacherTable)
            .set({
                password: teacherPasswordHash,
                isTeacher: true,
            })
            .where(eq(teacherTable.userMail, teacherEmail));

        return;
    }

    await db.insert(teacherTable).values({
        userMail: teacherEmail,
        firstName: 'Test',
        lastName: 'Teacher',
        password: teacherPasswordHash,
        isTeacher: true,
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
