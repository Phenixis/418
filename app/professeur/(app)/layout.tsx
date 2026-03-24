"use client";
import { Header } from '@/components/general/header';

export const dynamic = "force-dynamic"

export default function ProfesseurLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <>
            <Header />
            <main className="container mx-auto">{children}</main>
        </>
    );
}
