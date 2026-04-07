import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/actions/authentication";
import { sessionTeacherQueries } from "@/lib/db/queries/session-teacher";
import { teacherQueries } from "@/lib/db/queries/teacher";
import { authorizePrivateChannel } from "@/lib/realtime/provider-server";

const SESSION_CHANNEL_PREFIX = "private-session-attendance-";

export async function POST(request: Request) {
    const session = await getServerSession();
    if (!session?.teacherEmail) {
        return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const teacherResult = await teacherQueries.getByEmail(session.teacherEmail);
    if ("error" in teacherResult) {
        return NextResponse.json({ error: "Enseignant non autorisé." }, { status: 403 });
    }

    const requestFormData = await request.formData();
    const rawSocketId = requestFormData.get("socket_id");
    const rawChannelName = requestFormData.get("channel_name");

    if (typeof rawSocketId !== "string" || typeof rawChannelName !== "string") {
        return NextResponse.json({ error: "Paramètres d'authentification invalides." }, { status: 400 });
    }

    if (!rawChannelName.startsWith(SESSION_CHANNEL_PREFIX)) {
        return NextResponse.json({ error: "Canal non autorisé." }, { status: 403 });
    }

    const sessionId = rawChannelName.slice(SESSION_CHANNEL_PREFIX.length).trim();
    if (!sessionId) {
        return NextResponse.json({ error: "Identifiant de séance invalide." }, { status: 400 });
    }

    const courseTeachersResult = await sessionTeacherQueries.getBySessionId(sessionId);
    if ("error" in courseTeachersResult) {
        return NextResponse.json({ error: "Cours introuvable ou non autorisé." }, { status: 403 });
    }

    const isTeacherLinkedToCourse = courseTeachersResult.entity.some((courseTeacher) => (
        courseTeacher.teacherMail.toLowerCase() === teacherResult.entity.userMail.toLowerCase()
    ));

    if (!isTeacherLinkedToCourse) {
        return NextResponse.json({ error: "Vous n'êtes pas autorisé à écouter ce cours." }, { status: 403 });
    }

    try {
        const authPayload = authorizePrivateChannel(rawSocketId, rawChannelName);
        return NextResponse.json(authPayload, { status: 200 });
    } catch {
        return NextResponse.json({ error: "Le service realtime n'est pas configuré." }, { status: 503 });
    }
}
