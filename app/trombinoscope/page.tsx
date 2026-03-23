import Logo, { LogoSizes } from '@/components/general/logo';
import Trombinoscope from '@/components/trombinoscope/trombinoscope';
import TrombinoscopeSkeleton from '@/components/trombinoscope/trombinoscope-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SettingsIcon from '@mui/icons-material/Settings';
import { Suspense } from 'react';

export default function TrombinoscopePage() {
    return (
        <div className="flex flex-col min-h-screen">
            {/* Header avec logo et navigation */}
            <div className="flex items-center justify-between p-3 m-5 ">
                <Logo size={LogoSizes.LARGE} />
                <nav className="flex justify-start items-center gap-2">
                    <Button variant="link" className="text-sm md:text-base">
                        Dashboard
                    </Button>
                    <Button variant="link" className="underline text-sm md:text-base">
                        Trombinoscope
                    </Button>
                </nav>
                <div className="flex items-center gap-2">
                    <Input placeholder="Rechercher" className="w-48 bg-white rounded-full" />
                    <Button variant="ghost" size="icon">
                        <SettingsIcon />
                    </Button>
                </div>
            </div>

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
        </div>
    );
}
