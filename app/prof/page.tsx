import QRCode from '@/components/appel/QrCode';

const ENT_PAGE_URL = 'https://ent.univ-rennes1.fr/f/bureau/normal/render.uP';

export default function ProfPage() {
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-12">Professeurs</h1>

            <div className="flex flex-col items-start gap-4 relative">
                <QRCode codePin={ENT_PAGE_URL} />
            </div>
        </div>
    );
}