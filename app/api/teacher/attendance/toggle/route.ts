import { NextResponse } from "next/server";
import { attendanceQueries } from "@/lib/db/queries/attendance";
import { getServerSession } from "@/lib/actions/authentication";
import { teacherQueries } from "@/lib/db/queries/teacher";
import { courseTeacherQueries } from "@/lib/db/queries/course-teacher";
import { courseGroupQueries } from "@/lib/db/queries/course-group";
import { studentQueries } from "@/lib/db/queries/student";

type ToggleAttendanceBody = {
    courseId?: string;
    studentMail?: string;
};

export async function PATCH(request: Request) {
    let requestBody: ToggleAttendanceBody;

    const session = await getServerSession();

    if (!session?.teacherEmail) {
        return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const teacherResult = await teacherQueries.getByEmail(session.teacherEmail);

    if ("error" in teacherResult) {
        return NextResponse.json({ error: "Enseignant non autorisé." }, { status: 403 });
    }

    try {
        requestBody = await request.json();
    } catch {
        return NextResponse.json({ error: "Le corps de la requête doit être un JSON valide." }, { status: 400 });
    }

    const rawCourseId = requestBody.courseId;
    const rawStudentMail = requestBody.studentMail;

    if (typeof rawCourseId !== "string" || typeof rawStudentMail !== "string") {
        return NextResponse.json(
            { error: "Les champs courseId et studentMail doivent être des chaînes de caractères non vides." },
            { status: 400 }
        );
    }

    const courseId = rawCourseId.trim();
    const studentMail = rawStudentMail.trim();
    if (!courseId || !studentMail) {
        return NextResponse.json(
            { error: "Les champs courseId et studentMail sont requis." },
            { status: 400 }
        );
    }

    const courseTeachersResult = await courseTeacherQueries.getByCourseId(courseId);

    if ("error" in courseTeachersResult) {
        return NextResponse.json({ error: "Cours introuvable ou non autorisé." }, { status: 403 });
    }

    const isTeacherLinkedToCourse = courseTeachersResult.entity.some(
        (courseTeacher) =>
            courseTeacher.teacherMail.toLowerCase() === teacherResult.entity.userMail.toLowerCase()
    );

    if (!isTeacherLinkedToCourse) {
        return NextResponse.json({ error: "Vous n'êtes pas autorisé à modifier ce cours." }, { status: 403 });
    }

    const studentResult = await studentQueries.getByEmail(studentMail);

    if ("error" in studentResult) {
        return NextResponse.json({ error: "Étudiant introuvable." }, { status: 404 });
    }

    const courseGroupsResult = await courseGroupQueries.getByCourseId(courseId);

    if ("error" in courseGroupsResult) {
        return NextResponse.json({ error: "Aucun groupe associé à ce cours." }, { status: 403 });
    }

    const isStudentInCourseGroups = courseGroupsResult.entity.some(
        (courseGroup) => courseGroup.groupId === studentResult.entity.groupId
    );

    if (!isStudentInCourseGroups) {
        return NextResponse.json({ error: "L'étudiant n'appartient pas à ce cours." }, { status: 403 });
    }

    const attendanceResult = await attendanceQueries.getByCourseAndStudent(courseId, studentMail);

    const isStudentPresent = attendanceResult.entity.length > 0;

    if (isStudentPresent) {
        await attendanceQueries.markNonScanne(courseId, studentMail);
        return NextResponse.json({ status: "non-scanne" }, { status: 200 });
    }

    const markPresentResult = await attendanceQueries.markPresent(courseId, studentMail);

    if ("error" in markPresentResult) {
        return NextResponse.json({ error: markPresentResult.error }, { status: 500 });
    }

    return NextResponse.json({ status: "present" }, { status: 200 });
}
