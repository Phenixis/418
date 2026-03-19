import Logo from '@/components/general/logo.tsx';

export default function TrombinoscopePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex p-4">
                <Logo className="w-12 h-12" />
            </div>
            
            <main className="flex-1 p-8">
                {/* Contenu de la page */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Filtrer par classe</label>
                    <select className="w-full px-4 py-2 border rounded-lg">
                        <option>Tous</option>
                        <option>1ère année</option>
                        <option>2ème année</option>
                        <option>3ème année</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-2">Filtrer par promotion</label>
                    <select className="w-full px-4 py-2 border rounded-lg">
                        <option>Toutes</option>
                        <option>2022</option>
                        <option>2023</option>
                        <option>2024</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-medium mb-2">Trier par</label>
                    <select className="w-full px-4 py-2 border rounded-lg">
                        <option>Nom (A-Z)</option>
                        <option>Nom (Z-A)</option>
                        <option>Date d'inscription</option>
                    </select>
                </div>
            </div>
            </main>
        </div>
    );
}