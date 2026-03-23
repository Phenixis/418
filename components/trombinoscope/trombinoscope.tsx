import { groupQueries } from "@/lib/db/queries/group";
import type { Select as Group } from "@/lib/db/schema/group";
import CollapsibleYear from "./collapsible-year";

const YEAR_LABELS: Record<number, string> = {
    1: "1ère année",
    2: "2ème année",
    3: "3ème année",
};

export default async function Trombinoscope() {
    const groups = await groupQueries.getAll();

    if ("error" in groups) {
        return <div>Erreur lors du chargement des groupes: {groups.error}</div>;
    }

    const yearsToGroups: Record<string, Group[]> = (groups.entity as Group[]).reduce((acc, group) => {
        const year = group.promo;
        if (!acc[year]) {
            acc[year] = [];
        }
        acc[year].push(group);
        return acc;
    }, {} as Record<string, Group[]>);

    return (
        <div className="space-y-4">
            {Object.entries(yearsToGroups).sort(([yearA], [yearB]) => Number.parseInt(yearA, 10) - Number.parseInt(yearB, 10)).map(([year, groups]) => (
                <CollapsibleYear key={year} label={YEAR_LABELS[Number.parseInt(year)] || year} groups={groups} />
            ))}
        </div>
    );
}