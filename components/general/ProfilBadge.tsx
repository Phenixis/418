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
                <form action="/api/teacher/deconnexion" method="POST">
                    <DropdownMenuItem variant="destructive" asChild>
                        <button type="submit">Déconnexion</button>
                    </DropdownMenuItem>
                </form>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};