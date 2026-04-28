import * as nodeIcal from 'node-ical';

/**
 * Normalised representation of a single VEVENT from an iCal feed.
 *
 * Produced by {@link fetchAndParseIcalFeed} and consumed by
 * `runIcalImport` in `lib/ical/runner.ts`.
 */
export interface ParsedIcalEvent {
    /** ADE-assigned unique identifier for the event. */
    uid: string;
    /** Event title, trimmed and capped at 50 characters. */
    summary: string;
    /** Session start time in UTC. */
    startAt: Date;
    /** Session end time in UTC. */
    endAt: Date;
    /**
     * Student group code extracted from the event description or summary
     * (e.g. `"2D2"`, `"2A"`). `null` when no recognisable code is found.
     */
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

/**
 * Fetches an iCal feed from a URL and returns normalised VEVENT entries.
 *
 * Only `VEVENT` components that carry a UID, summary, start time, and end time
 * are included in the result. The group code is extracted from the description
 * first, then from the summary (ADE-specific heuristics).
 *
 * @param url - Public URL of the iCal feed to fetch.
 * @returns Array of parsed events. Never empty — throws if the feed is
 *   unreachable or contains no events.
 * @throws {Error} If the URL is unreachable or the response contains no valid
 *   VEVENT entries.
 */
export async function fetchAndParseIcalFeed(url: string): Promise<ParsedIcalEvent[]> {
    let rawEvents: nodeIcal.CalendarResponse;

    try {
        rawEvents = await nodeIcal.async.fromURL(url);
    } catch {
        throw new Error("Impossible d'accéder au flux iCal. Vérifiez l'URL.");
    }

    const events: ParsedIcalEvent[] = [];

    for (const event of Object.values(rawEvents)) {
        if (!event || event.type !== 'VEVENT') {
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
