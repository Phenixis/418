import { connection } from 'next/server'

export default async function QrCodeLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
    // truc obscur qui ne fait pas planté la page qr-code
    await connection()
    return <div>{children}</div>
}