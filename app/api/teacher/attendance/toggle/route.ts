import { NextResponse } from "next/server";
import { attendanceQueries } from "@/lib/db/queries/attendance";
import { getServerSession } from "@/lib/actions/authentication";
import { teacherQueries } from "@/lib/db/queries/teacher";
import { sessionTeacherQueries } from "@/lib/db/queries/session-teacher";
import { sessionGroupQueries } from "@/lib/db/queries/session-group";
import { studentQueries } from "@/lib/db/queries/student";
import { publishAttendanceRealtimeEvent } from "@/lib/realtime/provider-server";
import { StatutEtudiant } from "@/components/cours/course.types";
import { isEtudiantPresent, statutVersLateStatus } from "@/components/cours/course-utils";

type ToggleAttendanceBody = {
    sessionId?: string;
    studentMail?: string;
    nextStatut?: string;
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

    if (!teacherResult.entity?.isValidated) {
        return NextResponse.json({ error: "Compte enseignant non validé." }, { status: 403 });
    }
    try {
        requestBody = await request.json();
    } catch {
        return NextResponse.json({ error: "Le corps de la requête doit être un JSON valide." }, { status: 400 });
    }

    const rawSessionId = requestBody.sessionId;
    const rawStudentMail = requestBody.studentMail;

    if (typeof rawSessionId !== "string" || typeof rawStudentMail !== "string") {
        return NextResponse.json(
            { error: "Les champs sessionId et studentMail doivent être des chaînes de caractères non vides." },
            { status: 400 }
        );
    }

    const sessionId = rawSessionId.trim();
    const studentMail = rawStudentMail.trim();
    if (!sessionId || !studentMail) {
        return NextResponse.json(
            { error: "Les champs sessionId et studentMail sont requis." },
            { status: 400 }
        );
    }

    const courseTeachersResult = await sessionTeacherQueries.getBySessionId(sessionId);

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

    const courseGroupsResult = await sessionGroupQueries.getBySessionId(sessionId);

    if ("error" in courseGroupsResult) {
        return NextResponse.json({ error: "Aucun groupe associé à ce cours." }, { status: 403 });
    }

    const isStudentInCourseGroups = courseGroupsResult.entity.some(
        (courseGroup) => courseGroup.groupId === studentResult.entity.groupId
    );

    if (!isStudentInCourseGroups) {
        return NextResponse.json({ error: "L'étudiant n'appartient pas à ce cours." }, { status: 403 });
    }

    // ── Nouveau : gestion du cycle complet via nextStatut ──────────────
    const nextStatut = requestBody.nextStatut as StatutEtudiant | undefined;

    if (nextStatut) {
        // Passage à non-scanné → supprimer la présence
        if (nextStatut === StatutEtudiant["NON-SCANNE"]) {
            await attendanceQueries.markNonScanne(sessionId, studentMail);

            await publishAttendanceRealtimeEvent({
                eventId: crypto.randomUUID(),
                sessionId,
                studentMail,
                status: "non-scanne",
                lateStatus: 0,
                source: "teacher-toggle",
                occurredAt: new Date().toISOString()
            });

            return NextResponse.json({ status: StatutEtudiant["NON-SCANNE"] }, { status: 200 });
        }

        // Passage à un statut présent (présent ou retard +5/+10/+15)
        if (isEtudiantPresent(nextStatut)) {
            const lateStatus = statutVersLateStatus(nextStatut);
            const result = await attendanceQueries.markPresentAvecRetard(sessionId, studentMail, lateStatus);

            if ("error" in result) {
                return NextResponse.json({ error: result.error }, { status: 500 });
            }

            await publishAttendanceRealtimeEvent({
                eventId: crypto.randomUUID(),
                sessionId,
                studentMail,
                status: "present",
                lateStatus,
                source: "teacher-toggle",
                occurredAt: new Date().toISOString()
            });

            return NextResponse.json({ status: nextStatut }, { status: 200 });
        }

        return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
    }

    // ── Rétro-compatibilité : toggle simple (présent ↔ non-scanné) ────
    const attendanceResult = await attendanceQueries.getBySessionAndStudent(sessionId, studentMail);

    const isStudentPresent = attendanceResult.entity.length > 0;

    if (isStudentPresent) {
        await attendanceQueries.markNonScanne(sessionId, studentMail);

        await publishAttendanceRealtimeEvent({
            eventId: crypto.randomUUID(),
            sessionId,
            studentMail,
            status: "non-scanne",
            source: "teacher-toggle",
            occurredAt: new Date().toISOString()
        });

        return NextResponse.json({ status: "non-scanne" }, { status: 200 });
    }

    const markPresentResult = await attendanceQueries.markPresent(sessionId, studentMail);

    if ("error" in markPresentResult) {
        return NextResponse.json({ error: markPresentResult.error }, { status: 500 });
    }

    await publishAttendanceRealtimeEvent({
        eventId: crypto.randomUUID(),
        sessionId,
        studentMail,
        status: "present",
        source: "teacher-toggle",
        occurredAt: new Date().toISOString()
    });

    return NextResponse.json({ status: "present" }, { status: 200 });
}
