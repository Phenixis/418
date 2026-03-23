"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Select as Group } from "@/lib/db/schema/group";
import ChevronUpIcon from '@mui/icons-material/ExpandLess';
import ChevronDownIcon from '@mui/icons-material/ExpandMore';
import { useState } from "react";
import CollapsibleGroup from './collapsible-group';

export default function CollapsibleYear({
    label,
    groups
}: Readonly<{
    label: string;
    groups: Group[];
}>) {
    const [open, setOpen] = useState(false);

    return (
        <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="cursor-pointer flex w-full items-center gap-2 h2">
                {open ? (
                    <ChevronUpIcon className="shrink-0" />
                ) : (
                    <ChevronDownIcon className="shrink-0" />
                )}
                {label}
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-2">
                {groups.map(group => (
                    <CollapsibleGroup key={group.groupId} group={group} />
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
}