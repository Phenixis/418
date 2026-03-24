"use client";
import { Header } from '@/components/general/header';
import { useTeacher } from '@/lib/hooks/UseTeacher';

export const dynamic = "force-dynamic"

export default function ProfesseurLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    const { teacher } = useTeacher();

    if (!teacher) {
        

    return (
        <>
            <Header />
            <main className="container mx-auto">{children}</main>
        </>
    );
}
