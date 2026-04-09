import { cn } from '@/lib/utils';
import PersonIcon from '@mui/icons-material/Person';

export default function EtudiantPhotoPlaceholder({
    className,
}: Readonly<{ className?: string }>) {
        return (
            <div className={cn("w-full aspect-square rounded-[6px] bg-faded/20 flex items-center justify-center", className)}>
                <PersonIcon className="text-faded" style={{ fontSize: '4rem' }} />
            </div>
        );
}