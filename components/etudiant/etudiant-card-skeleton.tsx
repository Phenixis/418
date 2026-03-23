import EtudiantPhotoPlaceholder from './etudiant-photo-placeholder';

export default function EtudiantCardSkeleton() {

    return (
        <div className="flex flex-col items-center gap-3 p-3 bg-background-alternative border border-faded rounded-[6px] animate-pulse">
            {/* Photo carrée */}
            <EtudiantPhotoPlaceholder />

            {/* Zone noms : encadré avec bordure propre */}
            <div className="w-full flex flex-col items-center justify-center gap-1 border border-faded rounded-[6px] py-1 px-2">
                <div className="truncate w-[60%] h-6 bg-faded rounded-lg" />
                <div className="truncate w-[80%] h-8 bg-faded rounded-lg" />
            </div>
        </div>
    );
}
