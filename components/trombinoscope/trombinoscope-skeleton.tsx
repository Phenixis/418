import ChevronDownIcon from '@mui/icons-material/ExpandMore';

export default function TrombinoscopeSkeleton() {
    return (
        <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="animate-pulse flex w-full items-center gap-2">
                    <ChevronDownIcon className="shrink-0" />
                    <p>
                        Chargement...
                    </p>
                </div>
            ))}
        </div>
    );
}