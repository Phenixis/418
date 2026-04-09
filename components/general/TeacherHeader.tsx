"use client";

import Logo, { LogoSizes, LogoVariants } from '@/components/general/logo';
import ProfilBadge from '@/components/general/ProfilBadge';
import { Button } from '@/components/ui/button';
import { useDialog } from '@/lib/hooks/use-dialog';
import { useTeacher } from '@/lib/hooks/useTeacher';
import SearchIcon from '@mui/icons-material/Search';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SettingsMenu from '../admin/SettingsMenu';

const ROUTES = {
    Dashboard: '/professeur/dashboard',
    Trombinoscope: '/professeur/trombinoscope',
    Tags: '/professeur/tags'
};

export default function TeacherHeader() {
    const { teacher } = useTeacher();
    const pathname = usePathname();
    const { setIsGlobalSearchOpen } = useDialog();

    return (
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-3 sm:flex-none">
                <Link href="/professeur/dashboard" id="nav-logo">
                    <Logo variant={LogoVariants.NAME_RIGHT} size={LogoSizes.MEDIUM} />
                </Link>

                <div className="flex items-center gap-3 sm:hidden">
                    {
                        teacher.isAdmin && <SettingsMenu />
                    }
                    <ProfilBadge firstName={teacher.firstName} lastName={teacher.lastName} />
                </div>
            </div>

            <div id="nav-links" className="flex flex-wrap items-center gap-1 sm:flex-1 justify-center sm:gap-4">
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
                <button
                    onClick={() => setIsGlobalSearchOpen(true)}
                    className="hidden items-center gap-2 rounded-full bg-white mx-4 pl-4 pr-4 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors sm:flex"
                >
                    <SearchIcon className="opacity-50" fontSize="small" />
                    <span className="text-gray-500">Rechercher</span>
                    <kbd className="ml-4 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        Ctrl K
                    </kbd>
                </button>
                {
                    teacher.isAdmin && <SettingsMenu/>
                }
                <ProfilBadge firstName={teacher.firstName} lastName={teacher.lastName} />
            </div>
        </div>
    );
};
