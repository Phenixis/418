import Trombinoscope from '@/components/trombinoscope/trombinoscope';
import TrombinoscopeSkeleton from '@/components/trombinoscope/trombinoscope-skeleton';
import { Input } from '@/components/ui/input';
import { Suspense } from 'react';

export default function TrombinoscopePage() {
    return (
        <>
            {/* Contenu principal */}
            <main className="flex-1 p-8">
                <div className="flex items-start gap-4 mb-8">
                    <h1 className="h1">Trombinoscope</h1>
                    <Input
                        placeholder="Chercher un étudiant, un groupe, une classe,..."
                        className="w-full bg-white rounded-lg"
                    />
                </div>
                <Suspense fallback={<TrombinoscopeSkeleton />}>
                    <Trombinoscope />
                </Suspense>
            </main>
        </>
    );
}
