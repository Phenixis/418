import { NextResponse } from "next/server";
import { tagQueries } from "@/lib/db/queries/tag";
import { studentTagQueries } from "@/lib/db/queries/student-tag";
import { sessionTagQueries } from "@/lib/db/queries/session-tag";
import { teacherQueries } from "@/lib/db/queries/teacher";

function parseTagId(params: { tag_id: string }): number | null {
    const tagId = Number(params.tag_id);
    return Number.isInteger(tagId) && tagId > 0 ? tagId : null;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ tag_id: string }> }) {
    const teacher = await teacherQueries.getTeacher();

    const tagId = parseTagId(await params);

    if (tagId === null) {
        return NextResponse.json({ error: "ID de tag invalide." }, { status: 400 });
    }

    const tagResult = await tagQueries.getById(tagId);

    if ("error" in tagResult) {
        return NextResponse.json({ error: "Tag introuvable." }, { status: 404 });
    }

    if (tagResult.entity.teacherMail !== teacher.userMail) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const body = await request.json();
    const { name, color } = body;

    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0 || name.length > 50)) {
        return NextResponse.json({ error: "Le nom du tag est invalide." }, { status: 400 });
    }

    if (color !== undefined && color !== null && (typeof color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(color))) {
        return NextResponse.json({ error: "La couleur du tag est invalide." }, { status: 400 });
    }

    const updateResult = await tagQueries.updateById(tagId, {
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
    });

    if ("error" in updateResult) {
        return NextResponse.json({ error: "Erreur lors de la modification du tag." }, { status: 500 });
    }

    return NextResponse.json(updateResult.entity, { status: 200 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ tag_id: string }> }) {
    const teacher = await teacherQueries.getTeacher();

    const tagId = parseTagId(await params);

    if (tagId === null) {
        return NextResponse.json({ error: "ID de tag invalide." }, { status: 400 });
    }

    const tagResult = await tagQueries.getById(tagId);

    if ("error" in tagResult) {
        return NextResponse.json({ error: "Tag introuvable." }, { status: 404 });
    }

    if (tagResult.entity.teacherMail !== teacher.userMail) {
        return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    await studentTagQueries.deleteByTagId(tagId);
    await sessionTagQueries.deleteByTagId(tagId);

    const deleteResult = await tagQueries.deleteById(tagId);

    if ("error" in deleteResult) {
        return NextResponse.json({ error: "Erreur lors de la suppression du tag." }, { status: 500 });
    }

    return NextResponse.json(deleteResult.entity, { status: 200 });
}
