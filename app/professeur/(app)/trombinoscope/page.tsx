import Trombinoscope from '@/components/trombinoscope/trombinoscope';
import TrombinoscopeSkeleton from '@/components/trombinoscope/trombinoscope-skeleton';
import TrombinoscopeTagFilter from '@/components/trombinoscope/TrombinoscopeTagFilter';
import { tagQueries } from '@/lib/db/queries/tag';
import { teacherQueries } from '@/lib/db/queries/teacher';
import { Input } from '@/components/ui/input';
import { Suspense } from 'react';

export default async function TrombinoscopePage() {
    const teacher = await teacherQueries.getTeacher();
    const tagsResult = await tagQueries.getByTeacherMail(teacher.userMail);

    return (
        <>
            {/* Contenu principal */}
            <main className="flex-1 p-8 space-y-6">
                <div className="flex items-start gap-4">
                    <h1 className="h1">Trombinoscope</h1>
                    <Input
                        placeholder="Chercher un étudiant, un groupe, une classe,..."
                        className="w-full bg-white rounded-lg"
                    />
                </div>
                <TrombinoscopeTagFilter tags={tagsResult.entity} />
                <Suspense fallback={<TrombinoscopeSkeleton />}>
                    <Trombinoscope />
                </Suspense>
            </main>
        </>
    );
}
