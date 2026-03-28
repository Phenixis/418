
import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function TeachersTableLayout({
    children,
}:  Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <Table className="text-center">
            <TableHeader>
                <TableRow>
                    <TableHead className="">Statut</TableHead>
                    <TableHead className="w-full">Nom</TableHead>
                    <TableHead className="">Email</TableHead>
                    <TableHead className="">Rôle</TableHead>
                    <TableHead className="w-px" />
                </TableRow>
            </TableHeader>
            {children}
        </Table>
    );
}