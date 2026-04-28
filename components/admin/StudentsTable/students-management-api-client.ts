import type { Select as Student } from '@/lib/db/schema/student';
import type { Select as Group } from '@/lib/db/schema/group';

export type JsonErrorPayload = {
    error?: string;
};

export type StudentUploadResponse = {
    url: string;
    pathname: string;
    success: boolean;
};

export type StudentResponse = {
    student: Student;
};

export type StudentImportError = {
    line: number;
    reason: string;
};

export type StudentImportSummary = {
    totalRows: number;
    processedRows: number;
    createdCount: number;
    updatedCount: number;
    restoredCount: number;
    skippedCount: number;
    groupsCreatedCount: number;
    errors: StudentImportError[];
};

export type StudentImportResponse = {
    summary: StudentImportSummary;
    students: Student[];
    groups: Group[];
    initializationStudents: Student[];
};

export type StudentWritePayload = {
    currentEmail?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    groupId?: number | null;
    picture?: string | null;
};


async function parseJsonResponse<T>(response: Response): Promise<T> {
    const responseBody = await response.json() as T & JsonErrorPayload;

    if (!response.ok) {
        throw new Error(responseBody.error ?? 'Une erreur est survenue.');
    }

    return responseBody;
}

export async function uploadStudentPicture(file: File): Promise<StudentUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/admin/students/upload', {
        method: 'POST',
        body: formData,
    });

    return parseJsonResponse<StudentUploadResponse>(response);
}

export async function deleteTemporaryUploadedPicture(pathname: string): Promise<void> {
    const response = await fetch('/api/admin/students/upload', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pathname }),
    });

    await parseJsonResponse<JsonErrorPayload>(response);
}

export async function createStudent(payload: StudentWritePayload): Promise<Student> {
    const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const responseBody = await parseJsonResponse<StudentResponse>(response);
    return responseBody.student;
}

export async function updateStudent(payload: StudentWritePayload): Promise<Student> {
    const response = await fetch('/api/admin/students', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const responseBody = await parseJsonResponse<StudentResponse>(response);
    return responseBody.student;
}

export async function deleteStudentByEmail(email: string): Promise<Student> {
    const response = await fetch('/api/admin/students', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
    });

    const responseBody = await parseJsonResponse<StudentResponse>(response);
    return responseBody.student;
}

export async function importStudentsFromSpreadsheet(file: File, previewOnly: boolean = false): Promise<StudentImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (previewOnly) {
        formData.append('preview', 'true');
    }

    const response = await fetch('/api/admin/students/import', {
        method: 'POST',
        body: formData,
    });

    return parseJsonResponse<StudentImportResponse>(response);
}

type DeleteByGroupResponse = {
    message: string;
    studentsDeleted: number;
};

export async function deleteStudentsByGroup(groupId: number): Promise<{ message: string; studentsDeleted: number }> {
    const response = await fetch('/api/admin/students/delete-by-group', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ groupId }),
    });

    return parseJsonResponse<DeleteByGroupResponse>(response);
}

type DeleteByPromoResponse = {
    message: string;
    studentsDeleted: number;
};

export async function deleteStudentsByPromo(promo: string): Promise<{ message: string; studentsDeleted: number }> {
    const response = await fetch('/api/admin/students/delete-by-promo', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promo }),
    });

    return parseJsonResponse<DeleteByPromoResponse>(response);
}
