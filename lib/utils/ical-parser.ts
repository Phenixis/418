import * as nodeIcal from 'node-ical';

export interface ParsedIcalEvent {
    uid: string;
    summary: string;
    startAt: Date;
    endAt: Date;
    groupCode: string | null;
}

function extractGroupCodeFromDescription(description: unknown): string | null {
    if (typeof description !== 'string') {
        return null;
    }

    const firstLine = description
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.length > 0);

    if (!firstLine) {
        return null;
    }

    // Le code groupe est de la forme "2D2 I", "2A I", etc.
    // On extrait la partie avant l'espace (ex: "2D2", "2A")
    const code = firstLine.split(' ')[0] ?? null;

    // Vérifie que c'est bien un code groupe valide (chiffre + lettre + chiffre optionnel)
    if (code && /^\d[A-Za-z]\d?$/.test(code)) {
        return code;
    }

    return null;
}

function extractGroupCodeFromSummary(summary: string): string | null {
    // Le groupe apparaît avant " I" en fin de summary, ex: "TP 2C2 I", "TD 2A I"
    const match = summary.match(/(\d[A-Za-z]\d?)\s+I\s*$/);
    return match ? match[1] : null;
}

export async function fetchAndParseIcalFeed(url: string): Promise<ParsedIcalEvent[]> {
    let rawEvents: nodeIcal.CalendarResponse;

    try {
        rawEvents = await nodeIcal.async.fromURL(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; CalendarSync/1.0)',
                'Accept': 'text/calendar, */*',
            },
        });
    } catch {
        throw new Error("Impossible d'accéder au flux iCal. Vérifiez l'URL.");
    }

    const events: ParsedIcalEvent[] = [];

    for (const event of Object.values(rawEvents)) {
        if (event.type !== 'VEVENT') {
            continue;
        }

        const uid = event.uid;
        const summary = event.summary;
        const startAt = event.start;
        const endAt = event.end;

        if (!uid || !summary || !startAt || !endAt) {
            continue;
        }

        const groupCode =
            extractGroupCodeFromDescription(event.description) ??
            extractGroupCodeFromSummary(String(summary));

        events.push({
            uid: String(uid),
            summary: String(summary).trim().slice(0, 50),
            startAt: new Date(startAt),
            endAt: new Date(endAt),
            groupCode,
        });
    }

    if (events.length === 0) {
        throw new Error("Le contenu retourné n'est pas un flux iCal valide ou ne contient aucun événement.");
    }

    return events;
}
