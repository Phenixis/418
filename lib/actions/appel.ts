'use server';

import { revalidatePath } from 'next/cache';
import { sessionQueries } from '@/lib/db/queries/session';

export async function demarrerAppel(sessionId: string): Promise<void> {
    await sessionQueries.update(sessionId, { manualCallStartAt: new Date(), manualCallEndAt: null });
    revalidatePath(`/professeur/session/${sessionId}`);
}

export async function terminerAppel(sessionId: string): Promise<void> {
    await sessionQueries.update(sessionId, { manualCallEndAt: new Date() });
    revalidatePath(`/professeur/session/${sessionId}`);
}
