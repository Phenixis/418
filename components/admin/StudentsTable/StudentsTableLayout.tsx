import { Table, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function StudentsTableLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <Table className="text-center">
            <TableHeader>
                <TableRow>
                    <TableHead className="w-full">Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Groupe</TableHead>
                </TableRow>
            </TableHeader>
            {children}
        </Table>
    );
}
