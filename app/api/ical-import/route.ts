import { teacherQueries } from '@/lib/db/queries/teacher';
import { getAuthenticatedTeacher } from '@/lib/ical/teacher-auth';
import { runIcalImport } from '@/lib/ical/runner';

const SSE_HEADERS = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
};

function encodeEvent(type: string, data: object): Uint8Array {
    return new TextEncoder().encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function GET(request: Request) {
    const { teacher, errorResponse } = await getAuthenticatedTeacher();

    if (errorResponse) {
        return errorResponse;
    }

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode');
    const icalUrlParam = searchParams.get('icalUrl');

    let icalUrl: string;

    if (mode === 'sync') {
        if (!teacher.icalUrl) {
            return new Response(
                JSON.stringify({ error: "Aucune URL iCal enregistrée. Veuillez d'abord importer vos ressources." }),
                { status: 400 }
            );
        }
        icalUrl = teacher.icalUrl;
    } else if (mode === 'import') {
        if (!icalUrlParam) {
            return new Response(JSON.stringify({ error: "URL iCal manquante." }), { status: 400 });
        }
        icalUrl = icalUrlParam;
    } else {
        return new Response(JSON.stringify({ error: "Paramètre mode invalide." }), { status: 400 });
    }

    const teacherMail = teacher.userMail;

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const result = await runIcalImport(icalUrl, teacherMail, (current, total) => {
                    controller.enqueue(encodeEvent('progress', { current, total }));
                });

                if (mode === 'import') {
                    await teacherQueries.saveIcalUrl(teacherMail, icalUrl);
                }

                controller.enqueue(encodeEvent('done', {
                    resourceCount: result.resourceCount,
                    sessionCount: result.sessionCount,
                }));
            } catch (error) {
                controller.enqueue(encodeEvent('error', {
                    message: error instanceof Error ? error.message : "Erreur inconnue.",
                }));
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, { headers: SSE_HEADERS });
}
