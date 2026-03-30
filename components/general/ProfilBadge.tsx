import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

interface ProfilBadgeProps {
    firstName: string;
    lastName: string;
}

export default function ProfilBadge({ firstName, lastName }: Readonly<ProfilBadgeProps>) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center justify-center rounded-full bg-white w-10 h-10 border border-color-black uppercase">
                <p className="">{firstName.charAt(0)}{lastName.charAt(0)}</p>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem variant="destructive">
                    <form action="/api/teacher/deconnexion" method="POST">
                        <button type="submit" aria-label="Se déconnecter">Déconnexion</button>
                    </form>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};