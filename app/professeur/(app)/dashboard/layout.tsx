import CreerCours from '@/components/cours/creation/creer-cours';

export default function DashboardLayout({
    children
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h1 className="h1">Dashboard</h1>
                <CreerCours />
            </div>
            {children}
        </>
    );
}
