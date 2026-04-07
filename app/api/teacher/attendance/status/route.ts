import { NextResponse } from "next/server";
import { attendanceQueries } from "@/lib/db/queries/attendance";
import { getServerSession } from "@/lib/actions/authentication";
import { teacherQueries } from "@/lib/db/queries/teacher";
import { courseTeacherQueries } from "@/lib/db/queries/course-teacher";

export async function GET(request: Request) {
    const session = await getServerSession();

    if (!session?.teacherEmail) {
        return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const teacherResult = await teacherQueries.getByEmail(session.teacherEmail);

    if ("error" in teacherResult) {
        return NextResponse.json({ error: "Enseignant non autorisé." }, { status: 403 });
    }

    const url = new URL(request.url);
    const rawCourseId = url.searchParams.get("courseId");

    if (!rawCourseId?.trim()) {
        return NextResponse.json({ error: "Le paramètre courseId est requis." }, { status: 400 });
    }

    const courseId = rawCourseId.trim();

    const courseTeachersResult = await courseTeacherQueries.getByCourseId(courseId);

    if ("error" in courseTeachersResult) {
        return NextResponse.json({ error: "Cours introuvable ou non autorisé." }, { status: 403 });
    }

    const isTeacherLinkedToCourse = courseTeachersResult.entity.some(
        (courseTeacher) => courseTeacher.teacherMail.toLowerCase() === teacherResult.entity.userMail.toLowerCase()
    );

    if (!isTeacherLinkedToCourse) {
        return NextResponse.json({ error: "Vous n'êtes pas autorisé à consulter ce cours." }, { status: 403 });
    }

    const attendanceResult = await attendanceQueries.getByCourseId(courseId);
    const presentStudentMails = attendanceResult.entity.map((attendance) => attendance.studentMail);

    // Nouveau format incluant le niveau de retard pour chaque présence
    const attendanceStatuts = attendanceResult.entity.map((attendance) => ({
        studentMail: attendance.studentMail,
        lateStatus: attendance.lateStatus ?? 0
    }));

    return NextResponse.json(
        {
            courseId,
            presentStudentMails,
            attendanceStatuts,
            syncedAt: new Date().toISOString()
        },
        { status: 200 }
    );
}
