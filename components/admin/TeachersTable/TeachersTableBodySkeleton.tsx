
import { TableBody, TableCell, TableRow } from '@/components/ui/table';

export default function TeachersTableBodySkeleton() {
    return (
        <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="bg-white/80 animate-pulse">
                    <TableCell className="h-4 bg-gray-300 rounded col-span-2" />
                    <TableCell className="h-4 bg-gray-300 rounded col-span-1" />
                    <TableCell className="h-4 bg-gray-300 rounded col-span-1" />
                    <TableCell className="h-4 bg-gray-300 rounded col-span-1" />
                    <TableCell className="h-4 bg-gray-300 rounded col-span-1" />
                </TableRow>
            ))}
        </TableBody>
    );
}