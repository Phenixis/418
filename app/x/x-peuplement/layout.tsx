export const dynamic = "force-dynamic"

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
            <main className="container mx-auto">{children}</main>
    );
}
