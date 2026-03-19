import { connection } from 'next/server'
 
export default async function QrCodeLayout({
    children
}: {
    children: React.ReactNode
}) {
  await connection()
  return <div>{children}</div>
}