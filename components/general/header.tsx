"use client";

import Link from 'next/link';
import Logo, { LogoSizes, LogoVariants } from '@/components/general/logo';
import { Button } from '@/components/ui/button';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import ProfilBadge from '@/components/general/ProfilBadge';
import { usePathname } from 'next/navigation';
import { useTeacher } from '@/lib/hooks/UseTeacher';

const ROUTES = {
    Dashboard: '/professeur/dashboard',
    Trombinoscope: '/professeur/trombinoscope'
};

export const Header = () => {
    const { teacher } = useTeacher();
    const pathname = usePathname();

    return (
        <div className="flex flex-column p-4 gap-4 items-center justify-between">
            <Link href="/professeur/dashboard">
                <Logo variant={LogoVariants.NAME_RIGHT} size={LogoSizes.LARGE} />
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
                <div className="bg-white rounded-full m-4 flex items-center gap-2 px-4 py-2">
                    <SearchIcon />
                    <p>Rechercher</p>
                </div>
                <SettingsIcon className="m-4" />
                <ProfilBadge firstName={teacher.firstName} lastName={teacher.lastName} />
            </div>
        </div>
    );
};
