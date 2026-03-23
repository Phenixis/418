import { connection } from 'next/server'
 
export default async function QrCodeLayout({
    children
}: Readonly<{
    children: React.ReactNode
}>) {
  await connection()
  return <div>{children}</div>
}