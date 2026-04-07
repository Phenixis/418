"use client";

import Logo, { LogoSizes, LogoVariants } from '@/components/general/logo';
import ProfilBadge from '@/components/general/ProfilBadge';
import { Button } from '@/components/ui/button';
import { useTeacher } from '@/lib/hooks/useTeacher';
import SearchIcon from '@mui/icons-material/Search';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SettingsMenu from '../admin/SettingsMenu';

const ROUTES = {
    Dashboard: '/professeur/dashboard',
    Trombinoscope: '/professeur/trombinoscope'
};

export default function TeacherHeader() {
    const { teacher } = useTeacher();
    const pathname = usePathname();

    return (
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-3 sm:flex-none">
                <Link href="/professeur/dashboard">
                    <Logo variant={LogoVariants.NAME_RIGHT} size={LogoSizes.MEDIUM} />
                </Link>

                <div className="flex items-center gap-3 sm:hidden">
                    {
                        teacher.isAdmin && <SettingsMenu />
                    }
                    <ProfilBadge firstName={teacher.firstName} lastName={teacher.lastName} />
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 sm:flex-1 justify-center sm:gap-4">
                {Object.entries(ROUTES).map(([name, route]) => (
                    <Button
                        key={name}
                        variant="link"
                        size="sm"
                        className={pathname.startsWith(route) ? 'underline' : ''}
                        asChild
                    >
                        <Link href={route}>
                            {name}
                        </Link>
                    </Button>
                ))}
            </div>

            <div className="hidden items-center gap-4 sm:flex">
                <div className="hidden items-center gap-2 rounded-full bg-white mx-4 pl-4 pr-12 py-2 text-sm">
                    <SearchIcon />
                    <p>Rechercher</p>
                </div>
                {
                    teacher.isAdmin && <SettingsMenu />
                }
                <ProfilBadge firstName={teacher.firstName} lastName={teacher.lastName} />
            </div>
        </div>
    );
};
