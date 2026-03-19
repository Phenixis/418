import { connection } from 'next/server'
 
export default async function Page({
    children
}: {
    children: React.ReactNode
}) {
  await connection()
  return <div>{children}</div>
}