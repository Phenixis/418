import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

interface ProfilBadgeProps {
    firstName: string;
    lastName: string;
}

export default function ProfilBadge({ firstName, lastName }: Readonly<ProfilBadgeProps>) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center rounded-full bg-white w-10 h-10 border border-color-black">
                <p className="">{firstName.charAt(0)}{lastName.charAt(0)}</p>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <Link href="/api/teacher/deconnexion">
                    <DropdownMenuItem variant="destructive">Déconnexion</DropdownMenuItem>
                </Link>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};