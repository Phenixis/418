import { NextResponse } from "next/server";
import { attendanceQueries } from "@/lib/db/queries/attendance";

type ToggleAttendanceBody = {
    courseId?: string;
    studentMail?: string;
};

export async function PATCH(request: Request) {
    let requestBody: ToggleAttendanceBody;

    try {
        requestBody = await request.json();
    } catch {
        return NextResponse.json({ error: "Le corps de la requête doit être un JSON valide." }, { status: 400 });
    }

    const courseId = requestBody.courseId?.trim();
    const studentMail = requestBody.studentMail?.trim();

    if (!courseId || !studentMail) {
        return NextResponse.json(
            { error: "Les champs courseId et studentMail sont requis." },
            { status: 400 }
        );
    }

    const attendanceResult = await attendanceQueries.getByCourseAndStudent(courseId, studentMail);

    if ("error" in attendanceResult) {
        return NextResponse.json({ error: attendanceResult.error }, { status: 500 });
    }

    const isStudentPresent = attendanceResult.entity.length > 0;

    if (isStudentPresent) {
        const markNonScanneResult = await attendanceQueries.markNonScanne(courseId, studentMail);

        if ("error" in markNonScanneResult) {
            return NextResponse.json({ error: markNonScanneResult.error }, { status: 500 });
        }

        return NextResponse.json({ status: "non-scanne" }, { status: 200 });
    }

    const markPresentResult = await attendanceQueries.markPresent(courseId, studentMail);

    if ("error" in markPresentResult) {
        return NextResponse.json({ error: markPresentResult.error }, { status: 500 });
    }

    return NextResponse.json({ status: "present" }, { status: 200 });
}
