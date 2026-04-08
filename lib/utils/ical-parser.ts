import * as nodeIcal from 'node-ical';

export interface ParsedIcalEvent {
    uid: string;
    summary: string;
    startAt: Date;
    endAt: Date;
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

        events.push({
            uid: String(uid),
            summary: String(summary).trim().slice(0, 50),
            startAt: new Date(startAt),
            endAt: new Date(endAt),
        });
    }

    if (events.length === 0) {
        throw new Error("Le contenu retourné n'est pas un flux iCal valide ou ne contient aucun événement.");
    }

    return events;
}
