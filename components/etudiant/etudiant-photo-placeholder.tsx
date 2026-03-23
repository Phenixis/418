import PersonIcon from '@mui/icons-material/Person';

export default function EtudiantPhotoPlaceholder() {
        return (
            <div className="w-full aspect-square rounded-[6px] bg-faded/20 flex items-center justify-center">
                <PersonIcon className="text-faded" style={{ fontSize: '4rem' }} />
            </div>
        );
}