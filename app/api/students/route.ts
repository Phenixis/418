import { NextResponse } from "next/server";
import { studentQueries } from "@/lib/db/queries/student";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const groupIdParam = requestUrl.searchParams.get("groupId");

    if (!groupIdParam) {
        return NextResponse.json({ error: "Le paramètre groupId est requis." }, { status: 400 });
    }

    const groupId = Number(groupIdParam);

    if (!Number.isInteger(groupId) || groupId <= 0) {
        return NextResponse.json({ error: "Le paramètre groupId doit être un entier positif." }, { status: 400 });
    }

    const studentsResult = await studentQueries.getByGroupId(groupId);

    if ("error" in studentsResult) {
        return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(studentsResult.entity, { status: 200 });
}
