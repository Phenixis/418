import { NextResponse } from "next/server";
import { groupQueries } from "@/lib/db/queries/group";

export async function GET() {
    const groupsResult = await groupQueries.getAll();

    if ("error" in groupsResult) {
        return NextResponse.json([], { status: 200 });
    }

    return NextResponse.json(groupsResult.entity, { status: 200 });
}