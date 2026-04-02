
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
                    <TableHead className="text-left w-1/12 text-center">Statut</TableHead>
                    <TableHead className="text-left px-6">Nom</TableHead>
                    <TableHead className="text-left w-1/4 px-6">Email</TableHead>
                    <TableHead className="text-left w-1/9 px-6">Rôle</TableHead>
                    <TableHead className="w-px" />
                </TableRow>
            </TableHeader>
            {children}
        </Table>
    );
}