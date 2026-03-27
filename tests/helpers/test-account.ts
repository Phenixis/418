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

export async function ensureTestTeacherAccount(): Promise<void> {
    const testAccountEmail = getTestAccountEmail();
    const testAccountPasswordHash = await bcrypt.hash(getTestAccountPassword(), 12);

    const existingTeacher = await db
        .select({ userMail: teacherTable.userMail })
        .from(teacherTable)
        .where(eq(teacherTable.userMail, testAccountEmail))
        .limit(1);

    if (existingTeacher.length > 0) {
        await db
            .update(teacherTable)
            .set({
                password: testAccountPasswordHash,
                isTeacher: true,
            })
            .where(eq(teacherTable.userMail, testAccountEmail));

        return;
    }

    await db.insert(teacherTable).values({
        userMail: testAccountEmail,
        firstName: 'Test',
        lastName: 'Teacher',
        password: testAccountPasswordHash,
        isTeacher: true,
    });
}
