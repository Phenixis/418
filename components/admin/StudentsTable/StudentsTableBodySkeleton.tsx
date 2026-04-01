import { TableBody, TableCell, TableRow } from '@/components/ui/table';

export default function StudentsTableBodySkeleton() {
    const skeletonRowKeys = ['skeleton-row-1', 'skeleton-row-2', 'skeleton-row-3', 'skeleton-row-4', 'skeleton-row-5'];

    return (
        <TableBody>
            {skeletonRowKeys.map((skeletonRowKey) => (
                <TableRow key={skeletonRowKey} className="bg-white/80 animate-pulse">
                    <TableCell className="h-4 bg-gray-300 rounded" />
                    <TableCell className="h-4 bg-gray-300 rounded" />
                    <TableCell className="h-4 bg-gray-300 rounded" />
                </TableRow>
            ))}
        </TableBody>
    );
}
