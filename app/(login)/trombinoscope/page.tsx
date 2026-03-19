import Logo from '@/components/general/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SettingsIcon from '@mui/icons-material/Settings';
import { StudentCard } from '@/components/general/Card';




export default function TrombinoscopePage() {
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex p-3 m-5">
                <Logo className="w-12 h-12 absolute left-15" />
                <nav className="flex-1 flex justify-start items-center gap-2 ml-20 md:ml-40 lg:ml-110">
                    <Button variant="link" className="text-sm md:text-base">Dashboard</Button>
                    <Button variant="link" className="underline text-sm md:text-base">Trombinoscope</Button>
                </nav>
                <div className="flex items-center gap-2">
                    <Input placeholder="Rechercher" className="w-48 bg-white rounded-full" />
                    <Button variant="ghost" size="icon">
                        <SettingsIcon />
                    </Button>
                </div>
            </div>
            <main className="flex-1 p-8">
                {/* Titre et recherche */}
                <div className="flex  items-start gap-4 mb-8">
                    <h1 className="text-2xl h1 font-display">Trombinoscope</h1>
                    <Input placeholder="Chercher un étudiant, un groupe, une classe,..." className="w-full   bg-white rounded-lg" />
                    <br />
                </div>


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

                    {/* Filtrer par promotion 



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
                    
                    */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <StudentCard 
                            firstName="Jean" 
                            lastName="Dupont" 
                            photoUrl="https://randomuser.me/api/portraits/men/1.jpg"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
