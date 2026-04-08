'use client'

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import { fetchSearchData, type SearchData } from '@/lib/actions/search'
import { useDialog } from '@/lib/hooks/use-dialog'
import Add from '@mui/icons-material/Add'
import CalendarToday from '@mui/icons-material/CalendarToday'
import Dashboard from '@mui/icons-material/Dashboard'
import LibraryBooks from '@mui/icons-material/LibraryBooks'
import People from '@mui/icons-material/People'
import Person from '@mui/icons-material/Person'
import School from '@mui/icons-material/School'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface GlobalSearchProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
    const router = useRouter()
    const { setIsCreateResourceDialogOpen, setCreateSessionResourceId } = useDialog()

    const [page, setPage] = useState<'home' | 'select-resource'>('home')
    const [search, setSearch] = useState('')
    const [data, setData] = useState<SearchData | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                onOpenChange(true)
            }
        }
        document.addEventListener('keydown', handleKeyDown)
        return () => document.removeEventListener('keydown', handleKeyDown)
    }, [onOpenChange])

    useEffect(() => {
        if (open && data === null) {
            setIsLoading(true)
            fetchSearchData()
                .then(setData)
                .finally(() => setIsLoading(false))
        }
    }, [open, data])

    const handleOpenChange = useCallback((value: boolean) => {
        if (!value) {
            setPage('home')
            setSearch('')
        }
        onOpenChange(value)
    }, [onOpenChange])

    const handleNavigate = useCallback((href: string) => {
        handleOpenChange(false)
        router.push(href)
    }, [handleOpenChange, router])

    const handleCreateResource = useCallback(() => {
        handleOpenChange(false)
        setIsCreateResourceDialogOpen(true)
    }, [handleOpenChange, setIsCreateResourceDialogOpen])

    const handleSelectResource = useCallback((resourceId: string) => {
        handleOpenChange(false)
        setCreateSessionResourceId(resourceId)
    }, [handleOpenChange, setCreateSessionResourceId])

    return (
        <CommandDialog
            open={open}
            onOpenChange={handleOpenChange}
            title="Recherche globale"
            description="Recherchez des ressources, séances, étudiants ou groupes"
            showCloseButton={false}
            className="max-w-xl"
        >
            <CommandInput
                placeholder={page === 'select-resource' ? 'Sélectionner une ressource...' : 'Rechercher...'}
                value={search}
                onValueChange={setSearch}
                onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !search && page !== 'home') {
                        setPage('home')
                    }
                }}
            />
            <CommandList>
                {isLoading && (
                    <CommandEmpty>Chargement...</CommandEmpty>
                )}

                {!isLoading && page === 'home' && (
                    <>
                        <CommandEmpty>Aucun résultat.</CommandEmpty>

                        {!search && (
                            <>
                                <CommandGroup heading="Actions">
                                    <CommandItem onSelect={handleCreateResource}>
                                        <Add />
                                        Créer une ressource
                                    </CommandItem>
                                    <CommandItem onSelect={() => {
                                        if (data?.resources.length) {
                                            setPage('select-resource')
                                            setSearch('')
                                        }
                                    }}>
                                        <Add />
                                        Créer une séance
                                    </CommandItem>
                                </CommandGroup>
                                <CommandSeparator />
                                <CommandGroup heading="Navigation">
                                    <CommandItem onSelect={() => handleNavigate('/professeur/dashboard')}>
                                        <Dashboard />
                                        Dashboard
                                    </CommandItem>
                                    <CommandItem onSelect={() => handleNavigate('/professeur/trombinoscope')}>
                                        <School />
                                        Trombinoscope
                                    </CommandItem>
                                </CommandGroup>
                            </>
                        )}

                        {data && search && (
                            <>
                                {data.resources.length > 0 && (
                                    <CommandGroup heading="Ressources">
                                        {data.resources.map((resource) => (
                                            <CommandItem
                                                key={resource.resourceId}
                                                value={resource.subject}
                                                onSelect={() => handleNavigate(`/professeur/resource/${resource.resourceId}`)}
                                            >
                                                <LibraryBooks />
                                                {resource.subject}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                                {data.sessions.length > 0 && (
                                    <CommandGroup heading="Séances">
                                        {data.sessions.map((session) => (
                                            <CommandItem
                                                key={session.sessionId}
                                                value={`${session.subject} ${format(new Date(session.startAt), 'dd/MM/yyyy', { locale: fr })}`}
                                                onSelect={() => handleNavigate(`/professeur/session/${session.sessionId}`)}
                                            >
                                                <CalendarToday />
                                                <span>{session.subject}</span>
                                                <span className="ml-auto text-xs opacity-50">
                                                    {format(new Date(session.startAt), 'dd/MM/yyyy', { locale: fr })}
                                                </span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                                {data.students.length > 0 && (
                                    <CommandGroup heading="Étudiants">
                                        {data.students.map((student) => (
                                            <CommandItem
                                                key={student.userMail}
                                                value={`${student.firstName} ${student.lastName} ${student.userMail}`}
                                                onSelect={() => handleNavigate(`/professeur/etudiant/${encodeURIComponent(student.userMail.split('@')[0])}`)}
                                            >
                                                <Person />
                                                <span>{student.firstName} {student.lastName}</span>
                                                <span className="ml-auto text-xs opacity-50">{student.userMail}</span>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                                {data.groups.length > 0 && (
                                    <CommandGroup heading="Groupes">
                                        {data.groups.map((group) => (
                                            <CommandItem
                                                key={group.groupId}
                                                value={`${group.department} ${group.promo}${group.td}.${group.tp}`}
                                                onSelect={() => handleNavigate('/professeur/trombinoscope')}
                                            >
                                                <People />
                                                {group.department} {group.promo}{group.td}.{group.tp}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                )}
                            </>
                        )}
                    </>
                )}

                {!isLoading && page === 'select-resource' && (
                    <>
                        <CommandEmpty>Aucune ressource trouvée.</CommandEmpty>
                        <CommandGroup heading="Sélectionner une ressource">
                            {data?.resources.map((resource) => (
                                <CommandItem
                                    key={resource.resourceId}
                                    value={resource.subject}
                                    onSelect={() => handleSelectResource(resource.resourceId)}
                                >
                                    <LibraryBooks />
                                    {resource.subject}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </>
                )}
            </CommandList>
        </CommandDialog>
    )
}
