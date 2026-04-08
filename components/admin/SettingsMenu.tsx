import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import SettingsIcon from '@mui/icons-material/Settings';
import Link from "next/link";

export default function SettingsMenu() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="cursor-pointer p-2 hidden sm:block" title="Menu administrateur">
                <SettingsIcon />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem asChild>
                    <Link href="/administrateur/gestion-comptes">Gestion des comptes</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};