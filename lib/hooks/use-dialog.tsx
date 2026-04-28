'use client';

import ResourceModal from '@/components/cours/creation/ResourceModal';
import SessionModal from '@/components/cours/creation/SessionModal';
import AnnotationModal, { type AnnotationData } from '@/components/etudiant/AnnotationModal';
import GlobalSearch from '@/components/search/GlobalSearch';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { deleteResource } from '@/lib/actions/resource';
import { deleteCourse } from '@/lib/actions/cours';
import type { ActionResult } from '@/lib/actions/types';
import { formatInTimeZone } from 'date-fns-tz';
import { fr } from 'date-fns/locale/fr';
import { useRouter } from 'next/navigation';
import { createContext, ReactNode, useActionState, useContext, useEffect, useState } from 'react';

const PARIS_TIME_ZONE = 'Europe/Paris';

export interface InitialSession {
    sessionId: string;
    subject: string;
    startAt: Date;
    endAt: Date;
    groups: Array<{ groupId: number }>;
    tags?: Array<{ tagId: number }>;
}

export interface EditSessionData {
    resourceId: string;
    session: InitialSession;
}

export interface DeleteResourceData {
    resourceId: string;
    subject: string;
}

export interface DeleteSessionData {
    sessionId: string;
    subject: string;
    startAt: Date;
}

export interface DialogContextType {
    // Créer une ressource
    isCreateResourceDialogOpen: boolean;
    setIsCreateResourceDialogOpen: (open: boolean) => void;

    // Modifier une ressource (null = fermé)
    editResourceData: { resourceId: string; subject: string } | null;
    setEditResourceData: (data: { resourceId: string; subject: string } | null) => void;

    // Créer une session (null = fermé)
    createSessionResourceId: string | null;
    setCreateSessionResourceId: (resourceId: string | null) => void;

    // Modifier une session (null = fermé)
    editSessionData: EditSessionData | null;
    setEditSessionData: (data: EditSessionData | null) => void;

    // Supprimer une ressource (null = fermé)
    deleteResourceData: DeleteResourceData | null;
    setDeleteResourceData: (data: DeleteResourceData | null) => void;

    // Supprimer une session (null = fermé)
    deleteSessionData: DeleteSessionData | null;
    setDeleteSessionData: (data: DeleteSessionData | null) => void;

    // Créer/modifier une annotation (null = fermé)
    annotationData: AnnotationData | null;
    setAnnotationData: (data: AnnotationData | null) => void;

    // Recherche globale
    isGlobalSearchOpen: boolean;
    setIsGlobalSearchOpen: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextType | null>(null);

export function useDialog(): DialogContextType {
    const context = useContext(DialogContext);
    if (context === null) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
}

export function DialogProvider({ children }: Readonly<{ children: ReactNode }>) {
    const router = useRouter();

    const [isCreateResourceDialogOpen, setIsCreateResourceDialogOpen] = useState(false);
    const [editResourceData, setEditResourceData] = useState<{ resourceId: string; subject: string } | null>(null);
    const [createSessionResourceId, setCreateSessionResourceId] = useState<string | null>(null);
    const [editSessionData, setEditSessionData] = useState<EditSessionData | null>(null);
    const [deleteResourceData, setDeleteResourceData] = useState<DeleteResourceData | null>(null);
    const [deleteSessionData, setDeleteSessionData] = useState<DeleteSessionData | null>(null);
    const [annotationData, setAnnotationData] = useState<AnnotationData | null>(null);
    const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

    const [deleteResourceState, deleteResourceAction] = useActionState<ActionResult, FormData>(
        async (prevState, formData) => await deleteResource(prevState, formData),
        { pending: true }
    );

    const [deleteSessionState, deleteSessionAction] = useActionState<ActionResult, FormData>(
        async (prevState, formData) => await deleteCourse(formData),
        { pending: true }
    );

    useEffect(() => {
        if ('success' in deleteResourceState) {
            setDeleteResourceData(null);
            router.refresh();
        }
    }, [deleteResourceState, router]);

    useEffect(() => {
        if ('success' in deleteSessionState) {
            setDeleteSessionData(null);
            router.refresh();
        }
    }, [deleteSessionState, router]);

    return (
        <DialogContext.Provider value={{
            isCreateResourceDialogOpen,
            setIsCreateResourceDialogOpen,
            editResourceData,
            setEditResourceData,
            createSessionResourceId,
            setCreateSessionResourceId,
            editSessionData,
            setEditSessionData,
            deleteResourceData,
            setDeleteResourceData,
            deleteSessionData,
            setDeleteSessionData,
            annotationData,
            setAnnotationData,
            isGlobalSearchOpen,
            setIsGlobalSearchOpen,
        }}>
            {children}

            {/* Créer une ressource */}
            <ResourceModal
                open={isCreateResourceDialogOpen}
                onOpenChange={setIsCreateResourceDialogOpen}
            />

            {/* Modifier une ressource */}
            {editResourceData && (
                <ResourceModal
                    open={true}
                    onOpenChange={(open) => { if (!open) setEditResourceData(null); }}
                    initResource={editResourceData}
                />
            )}

            {/* Créer une session */}
            {createSessionResourceId && (
                <SessionModal
                    resourceId={createSessionResourceId}
                    open={true}
                    onOpenChange={(open) => { if (!open) setCreateSessionResourceId(null); }}
                />
            )}

            {/* Modifier une session */}
            {editSessionData && (
                <SessionModal
                    resourceId={editSessionData.resourceId}
                    initSession={editSessionData.session}
                    open={true}
                    onOpenChange={(open) => { if (!open) setEditSessionData(null); }}
                />
            )}

            {/* Supprimer une ressource */}
            <AlertDialog
                open={deleteResourceData !== null}
                onOpenChange={(open) => { if (!open) setDeleteResourceData(null); }}
            >
                <AlertDialogContent size="sm">
                    <form action={deleteResourceAction}>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cette ressource ?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogDescription>
                            Cette action supprimera la ressource{' '}
                            <strong>{deleteResourceData?.subject}</strong> ainsi que toutes ses séances.
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <input type="hidden" name="resourceId" value={deleteResourceData?.resourceId ?? ''} />
                            <Button variant="destructive" type="submit">
                                Supprimer
                            </Button>
                        </AlertDialogFooter>
                    </form>
                </AlertDialogContent>
            </AlertDialog>

            {/* Supprimer une session */}
            <AlertDialog
                open={deleteSessionData !== null}
                onOpenChange={(open) => { if (!open) setDeleteSessionData(null); }}
            >
                <AlertDialogContent size="sm">
                    <form action={deleteSessionAction}>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer ce cours ?</AlertDialogTitle>
                        </AlertDialogHeader>
                        <AlertDialogDescription>
                            Cette action supprimera le cours{' '}
                            <strong>{deleteSessionData?.subject}</strong> programmé pour{' '}
                            {deleteSessionData && formatInTimeZone(deleteSessionData.startAt, PARIS_TIME_ZONE, 'EEEE dd/MM/yyyy', { locale: fr })}.
                        </AlertDialogDescription>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <input type="hidden" name="courseId" value={deleteSessionData?.sessionId ?? ''} />
                            <Button variant="destructive" type="submit">
                                Supprimer
                            </Button>
                        </AlertDialogFooter>
                    </form>
                </AlertDialogContent>
            </AlertDialog>
            {/* Créer/modifier une annotation */}
            <AnnotationModal
                data={annotationData}
                open={annotationData !== null}
                onOpenChange={(open) => { if (!open) setAnnotationData(null); }}
            />

            {/* Recherche globale */}
            <GlobalSearch
                open={isGlobalSearchOpen}
                onOpenChange={setIsGlobalSearchOpen}
            />
        </DialogContext.Provider>
    );
}
