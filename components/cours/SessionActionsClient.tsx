'use client';

import { useTransition } from 'react';
import CourseHeader from '@/components/cours/CourseHeader';
import type { CourseHeaderProps } from '@/components/cours/CourseHeader';

interface SessionActionsClientProps extends CourseHeaderProps {
    onDemarrerAppel?: () => Promise<void>;
    onTerminerAppel?: () => Promise<void>;
}

export default function SessionActionsClient({
    onDemarrerAppel,
    onTerminerAppel,
    ...headerProps
}: Readonly<SessionActionsClientProps>) {
    const [isPending, startTransition] = useTransition();

    const handleDemarrer = onDemarrerAppel
        ? () => startTransition(() => { onDemarrerAppel(); })
        : undefined;

    const handleTerminer = onTerminerAppel
        ? () => startTransition(() => { onTerminerAppel(); })
        : undefined;

    return (
        <fieldset disabled={isPending} className="contents">
            <CourseHeader
                {...headerProps}
                onDemarrer={handleDemarrer}
                onTerminer={handleTerminer}
            />
        </fieldset>
    );
}
