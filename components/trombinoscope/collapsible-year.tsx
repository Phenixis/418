"use client";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { Select as Group } from "@/lib/db/schema/group";
import { useState } from 'react';
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import CollapsibleGroup from './collapsible-group';

export default function CollapsibleYear({
    label,
    groups
}: Readonly<{
    label: string;
    groups: Group[];
}>) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="cursor-pointer flex w-full items-center gap-2 h2">
                {isOpen ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
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