import { Header } from '@/components/general/header';

export default function ProfesseurLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <Header />
            <main className="container mx-auto">{children}</main>
        </>
    );
}
