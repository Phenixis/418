'use client';

import { CourseStatus } from '@/components/cours/course.types';
import CourseHeader from '@/components/cours/CourseHeader';
import { demarrerAppel, terminerAppel } from '@/lib/actions/cours';
import type { Select as Course } from '@/lib/db/schema/course';
import type { Select as Group } from '@/lib/db/schema/group';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

interface CourseActionsClientProps {
    cours: Course;
    groups: Group[];
    status: CourseStatus;
}

export default function CourseActionsClient({ cours, groups, status }: Readonly<CourseActionsClientProps>) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const now = new Date();
    const isAppelActif =
        cours.calledStartAt !== null &&
        (cours.calledEndAt === null || cours.calledEndAt > now);
    const isAppelNonDemarre = cours.calledStartAt === null;

    const handleDemarrer = status !== CourseStatus.TERMINE && isAppelNonDemarre
        ? () => {
              startTransition(async () => {
                  const result = await demarrerAppel(cours.courseId);
                  if ('error' in result) {
                      toast.error("Erreur", { description: result.message });
                  } else {
                      router.refresh();
                  }
              });
          }
        : undefined;

    const handleTerminer = isAppelActif
        ? () => {
              startTransition(async () => {
                  const result = await terminerAppel(cours.courseId);
                  if ('error' in result) {
                      toast.error("Erreur", { description: result.message });
                  } else {
                      router.refresh();
                  }
              });
          }
        : undefined;

    return (
        <CourseHeader
            cours={cours}
            groups={groups}
            status={status}
            onDemarrer={isPending ? undefined : handleDemarrer}
            onTerminer={isPending ? undefined : handleTerminer}
        />
    );
}
