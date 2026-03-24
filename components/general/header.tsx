import Link from 'next/link';
import Logo, { LogoSizes, LogoVariants } from '@/components/general/logo';
import { Button } from '@/components/ui/button';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import ProfilBadge from '@/components/general/ProfilBadge';

export const Header = () => {
    return (
        <div className="flex flex-column p-4 gap-4 items-center justify-between">
            <Logo variant={LogoVariants.NAME_RIGHT} size={LogoSizes.LARGE} />
            <div className="flex items-center gap-4">
                {/* TODO: etat qui se base sur le pathname */}
                <Link href="/professeur/dashboard">
                    <Button variant="link" className="underline">
                        Dashboard
                    </Button>
                </Link>
                <Link href="/professeur/trombinoscope">
                    <Button variant="link">Trombinoscope</Button>
                </Link>
            </div>
            <div className="flex flex-column items-center gap-4 md:flex-row">
                <div className="bg-white rounded-full m-4 flex items-center gap-2 px-4 py-2">
                    <SearchIcon />
                    <p>Rechercher</p>
                </div>
                <SettingsIcon className="m-4" />
                <ProfilBadge firstName="Benoit" lastName="Tottereau" />
            </div>
        </div>
    );
};