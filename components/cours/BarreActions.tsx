'use client';

import Search from '@mui/icons-material/Search';
import ViewModuleRoundedIcon from '@mui/icons-material/ViewModuleRounded';
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/** Filtres disponibles sur la liste des étudiants */
export type FiltrePresence = 'tous' | 'absents' | 'presents';

/** Modes d'affichage de la liste */
export type ModeAffichage = 'grille' | 'liste';

const FILTRES: { valeur: FiltrePresence; label: string }[] = [
    { valeur: 'tous', label: 'Tous' },
    { valeur: 'absents', label: 'Absents' },
    { valeur: 'presents', label: 'Présents' }
];

interface BarreActionsProps {
    /** Valeur actuelle du champ de recherche */
    recherche: string;
    /** Callback déclenché à chaque saisie dans le champ de recherche */
    onRechercheChange: (valeur: string) => void;
    /** Filtre de présence actuellement sélectionné */
    filtreActif: FiltrePresence;
    /** Callback déclenché au clic sur un badge de filtre */
    onFiltreChange: (filtre: FiltrePresence) => void;
    /** Mode d'affichage actuel */
    modeAffichage: ModeAffichage;
    /** Callback déclenché au changement de mode */
    onModeAffichageChange: (mode: ModeAffichage) => void;
}

export default function BarreActions({
    recherche,
    onRechercheChange,
    filtreActif,
    onFiltreChange,
    modeAffichage,
    onModeAffichageChange
}: Readonly<BarreActionsProps>) {
    return (
        <div className="flex items-center gap-3">
            {/* Barre de recherche */}
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 !size-5 text-faded pointer-events-none" />
                <Input
                    type="text"
                    placeholder="Rechercher un étudiant…"
                    value={recherche}
                    onChange={e => onRechercheChange(e.target.value)}
                    className="pl-10 h-10 bg-white rounded-lg"
                />
            </div>

            {/* Badges de filtrage */}
            <div className="flex items-center gap-2">
                {FILTRES.map(({ valeur, label }) => {
                    const isActif = filtreActif === valeur;

                    return (
                        <Badge
                            key={valeur}
                            variant={isActif ? 'default' : 'outline'}
                            className={cn('cursor-pointer select-none px-3 py-1', !isActif && 'hover:bg-black/5')}
                            onClick={() => onFiltreChange(valeur)}
                        >
                            {label}
                        </Badge>
                    );
                })}
            </div>

            {/* Toggle grille / liste (poussé à droite) */}
            <div className="ml-auto flex items-center rounded-md border border-faded">
                <Button
                    variant={modeAffichage === 'grille' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => onModeAffichageChange('grille')}
                    className="rounded-r-none"
                    aria-label="Affichage en grille"
                >
                    <ViewModuleRoundedIcon className="!size-5" />
                </Button>
                <Button
                    variant={modeAffichage === 'liste' ? 'default' : 'ghost'}
                    size="icon"
                    onClick={() => onModeAffichageChange('liste')}
                    className="rounded-l-none"
                    aria-label="Affichage en liste"
                >
                    <ViewListRoundedIcon className="!size-5" />
                </Button>
            </div>
        </div>
    );
}
