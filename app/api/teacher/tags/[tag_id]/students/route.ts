import { NextResponse } from "next/server";
import { tagQueries } from "@/lib/db/queries/tag";
import { studentTagQueries } from "@/lib/db/queries/student-tag";
import { teacherQueries } from "@/lib/db/queries/teacher";

function parseTagId(params: { tag_id: string }): number | null {
    const tagId = Number(params.tag_id);
    return Number.isInteger(tagId) && tagId > 0 ? tagId : null;
}

async function authorizeTag(tagId: number, teacherMail: string): Promise<boolean> {
    const tagResult = await tagQueries.getById(tagId);
    return !("error" in tagResult) && tagResult.entity.teacherMail === teacherMail;
}

export async function GET(_request: Request, { params }: { params: Promise<{ tag_id: string }> }) {
    const teacher = await teacherQueries.getTeacher();

    const tagId = parseTagId(await params);

    if (tagId === null) {
        return NextResponse.json({ error: "ID de tag invalide." }, { status: 400 });
    }

    if (!await authorizeTag(tagId, teacher.userMail)) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const studentsResult = await studentTagQueries.getStudentsByTag(tagId);

    return NextResponse.json(studentsResult.entity, { status: 200 });
}

export async function POST(request: Request, { params }: { params: Promise<{ tag_id: string }> }) {
    const teacher = await teacherQueries.getTeacher();

    const tagId = parseTagId(await params);

    if (tagId === null) {
        return NextResponse.json({ error: "ID de tag invalide." }, { status: 400 });
    }

    if (!await authorizeTag(tagId, teacher.userMail)) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const body = await request.json();
    const { studentMail } = body;

    if (typeof studentMail !== "string" || studentMail.trim().length === 0) {
        return NextResponse.json({ error: "L'email de l'étudiant est invalide." }, { status: 400 });
    }

    const createResult = await studentTagQueries.create({ tagId, studentMail: studentMail.trim() });

    if ("error" in createResult) {
        return NextResponse.json({ error: "Erreur lors de l'assignation de l'étudiant au tag." }, { status: 500 });
    }

    return NextResponse.json(createResult.entity, { status: 201 });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ tag_id: string }> }) {
    const teacher = await teacherQueries.getTeacher();

    const tagId = parseTagId(await params);

    if (tagId === null) {
        return NextResponse.json({ error: "ID de tag invalide." }, { status: 400 });
    }

    if (!await authorizeTag(tagId, teacher.userMail)) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const body = await request.json();
    const { studentMail } = body;

    if (typeof studentMail !== "string" || studentMail.trim().length === 0) {
        return NextResponse.json({ error: "L'email de l'étudiant est invalide." }, { status: 400 });
    }

    const deleteResult = await studentTagQueries.deleteByTagAndStudent(tagId, studentMail.trim());

    if ("error" in deleteResult) {
        return NextResponse.json({ error: "Liaison étudiant-tag introuvable." }, { status: 404 });
    }

    return NextResponse.json(deleteResult.entity, { status: 200 });
}
