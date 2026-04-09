'use client';

import { Button } from '@/components/ui/button';
import { useDialog } from '@/lib/hooks/use-dialog';

export default function CreateSessionButton({ resourceId }: Readonly<{ resourceId: string }>) {
    const { setCreateSessionResourceId } = useDialog();

    return (
        <Button variant="default" onClick={() => setCreateSessionResourceId(resourceId)}>
            Créer une séance
        </Button>
    );
}
