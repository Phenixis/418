"use client";

import Search from "@mui/icons-material/Search";
import { Input } from "@/components/ui/input";

interface BarreActionsProps {
    /** Valeur actuelle du champ de recherche */
    recherche: string;
    /** Callback déclenché à chaque saisie dans le champ de recherche */
    onRechercheChange: (valeur: string) => void;
}

export default function BarreActions({
    recherche,
    onRechercheChange,
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
                    onChange={(e) => onRechercheChange(e.target.value)}
                    className="pl-10 h-10 bg-white rounded-lg"
                />
            </div>
        </div>
    );
}
