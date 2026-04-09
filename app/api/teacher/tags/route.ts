import { NextResponse } from "next/server";
import { tagQueries } from "@/lib/db/queries/tag";
import { teacherQueries } from "@/lib/db/queries/teacher";

export async function GET() {
    const teacher = await teacherQueries.getTeacher();

    const tagsResult = await tagQueries.getByTeacherMail(teacher.userMail);

    return NextResponse.json(tagsResult.entity, { status: 200 });
}

export async function POST(request: Request) {
    const teacher = await teacherQueries.getTeacher();

    const body = await request.json();
    const { name, color } = body;

    if (typeof name !== "string" || name.trim().length === 0 || name.length > 50) {
        return NextResponse.json({ error: "Le nom du tag est invalide." }, { status: 400 });
    }

    if (color !== undefined && color !== null && (typeof color !== "string" || !/^#[0-9A-Fa-f]{6}$/.test(color))) {
        return NextResponse.json({ error: "La couleur du tag est invalide." }, { status: 400 });
    }

    const tagResult = await tagQueries.create({
        teacherMail: teacher.userMail,
        name: name.trim(),
        color: color ?? null,
    });

    if ("error" in tagResult) {
        return NextResponse.json({ error: "Erreur lors de la création du tag." }, { status: 500 });
    }

    return NextResponse.json(tagResult.entity, { status: 201 });
}
