'use server';

import { revalidatePath } from 'next/cache';
import { sessionQueries } from '@/lib/db/queries/session';

/**
 * Marks the manual roll-call as started for the given session.
 *
 * Sets `manualCallStartAt` to the current timestamp and clears any previous
 * `manualCallEndAt`, then revalidates the session page cache.
 *
 * @param sessionId - UUID of the session to start the roll-call for.
 */
export async function demarrerAppel(sessionId: string): Promise<void> {
    await sessionQueries.update(sessionId, { manualCallStartAt: new Date(), manualCallEndAt: null });
    revalidatePath(`/professeur/session/${sessionId}`);
}

/**
 * Marks the manual roll-call as ended for the given session.
 *
 * Sets `manualCallEndAt` to the current timestamp and revalidates the
 * session page cache.
 *
 * @param sessionId - UUID of the session to close the roll-call for.
 */
export async function terminerAppel(sessionId: string): Promise<void> {
    await sessionQueries.update(sessionId, { manualCallEndAt: new Date() });
    revalidatePath(`/professeur/session/${sessionId}`);
}
