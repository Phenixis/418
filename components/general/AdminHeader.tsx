"use client";

import Logo, { LogoSizes, LogoVariants } from '@/components/general/logo';
import ProfilBadge from '@/components/general/ProfilBadge';
import { Button } from '@/components/ui/button';
import { useAdmin } from '@/lib/hooks/useAdmin';
import SearchIcon from '@mui/icons-material/Search';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SettingsMenu from '../admin/SettingsMenu';

const ROUTES = {
    "Gestion des comptes": '/administrateur/gestion-comptes',
};

export default function AdminHeader() {
    const { admin } = useAdmin();
    const pathname = usePathname();

    return (
        <div className="flex flex-column p-4 gap-4 items-center justify-between">
            <Link href="/administrateur/">
                <Logo variant={LogoVariants.ICON_ONLY} size={LogoSizes.MEDIUM} />
            </Link>
            <div className="flex items-center gap-4">
                {Object.entries(ROUTES).map(([name, route]) => (
                    <Button key={name} variant="link" className={pathname.startsWith(route) ? 'underline' : ''} asChild>
                        <Link href={route}>
                            {name}
                        </Link>
                    </Button>
                ))}
            </div>
            <div className="flex flex-column items-center gap-4 md:flex-row">
                <div className="hidden bg-white rounded-full mx-4 flex items-center gap-2 pl-4 pr-12 py-2 text-sm">
                    <SearchIcon />
                    <p>Rechercher</p>
                </div>
                <SettingsMenu />
                <ProfilBadge firstName={admin.firstName} lastName={admin.lastName} />
            </div>
        </div>
    );
};
