"use client"

import Color from "@/components/charte-graphique/color"
import Logo, { LogoVariants } from "@/components/general/logo"
import { ColorVariants } from "@/components/charte-graphique/color.types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import LockIcon from '@mui/icons-material/Lock';
import { Badge } from "@/components/ui/badge";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator
} from "@/components/ui/command"
import {
    useState
} from "react"
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

export default function Page() {
    const [commandDialogOpen, setCommandDialogOpen] = useState(false);
    return (
        <section className="container mx-auto flex flex-col py-10 gap-16">
            <h1 className="h1 text-center">Charte Graphique</h1>
            <article>
                <h2 className="h2">
                    Logo
                </h2>
                <div className="flex items-center justify-between">
                    <Logo variant={LogoVariants.ICON_ONLY} />
                    <Logo variant={LogoVariants.NAME_BELOW} />
                    <Logo variant={LogoVariants.NAME_RIGHT} />
                    <Logo variant={LogoVariants.NAME_ALONE} />
                </div>
            </article>
            <article>
                <h2 className="h2">
                    Couleurs
                </h2>
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="h3">
                            Principales
                        </h3>
                        <div className="flex items-start gap-4">
                            <Color variant={ColorVariants.PRIMARY} />
                            <Color variant={ColorVariants.NOIR} className="text-white" />
                            <Color variant={ColorVariants.BLANC} />
                        </div>
                    </div>
                    <div>
                        <h3 className="h3">
                            Secondaires
                        </h3>
                        <div className="flex items-start gap-4">
                            <Color variant={ColorVariants.ROUGE} />
                            <Color variant={ColorVariants.ORANGE} />
                            <Color variant={ColorVariants.VERT} />
                            <Color variant={ColorVariants.BLEU} />
                        </div>
                    </div>
                    <div>
                        <h3 className="h3">
                            Autres
                        </h3>
                        <div className="flex items-start gap-4">
                            <Color variant={ColorVariants.BACKGROUND_ALTERNATIVE} />
                            <Color variant={ColorVariants.FADED} className="text-white" />
                        </div>
                    </div>
                </div>
            </article>
            <article>
                <h2 className="h2">
                    Icônes
                </h2>
                <div className="flex items-start justify-between">
                    <LockIcon />
                </div>
            </article>
            <article>
                <h2 className="h2">
                    Polices
                </h2>
                <div>
                    <h3 className="h3">
                        Types
                    </h3>
                    <div className="flex items-start justify-around text-lg">
                        <div className="text-center">
                            Inter<br />
                            The quick brown fox jumps over the lazy dog<br />
                            A B C D E F G H I J K L M N O P Q R S T U V W X Y Z<br />
                            a b c d e f g h i j k l m n o p q r s t u v w x y z é è ç à ù<br />
                            0 1 2 3 4 5 6 7 8 9<br />
                            ( )      { }      + - % * =      &lt; &gt;      _ : ; , . ! ?      ‘ ”<br />
                        </div>
                        <div className="font-display text-center">
                            Gildas Display<br />
                            The quick brown fox jumps over the lazy dog<br />
                            A B C D E F G H I J K L M N O P Q R S T U V W X Y Z<br />
                            a b c d e f g h i j k l m n o p q r s t u v w x y z é è ç à ù<br />
                            0 1 2 3 4 5 6 7 8 9<br />
                            ( )      { }      + - % * =      &lt; &gt;      _ : ; , . ! ?      ‘ ”<br />
                        </div>
                    </div>
                    <div>
                        <h3 className="h3">
                            Tailles
                        </h3>
                        <div className="flex flex-col items-start justify-between">
                            <p className="h1">
                                h1 : Page title (36px ; 2 rem ; Regular)
                            </p>
                            <p className="h2">
                                h2 : Section headings, card titles (30px ; 1.75 rem ; Regular )
                            </p>
                            <p className="h3">
                                h3 : Subsection headings (24px ; 1.5 rem ; Regular )
                            </p>
                            <p>
                                Base text : Standard body text, table content (18px ; 1.125 rem ; Regular)
                            </p>
                            <p className="font-action">
                                Action text : Text for CTA, buttons, interactions (18px ; 1.125 rem ; Bold)
                            </p>
                            <p className="font-faded">
                                Faded text : faded information along a main idea (14px ; 0.875 rem ; Bold ; uppercase forced)
                            </p>
                            <p className="text-sm">
                                Small text : Captions, metadata, helper text (14px ; 0.875 rem ; Regular)
                            </p>
                        </div>
                    </div>
                </div>
            </article>
            <article>
                <h2 className="h2">
                    Composants UI
                </h2>
                <div className="space-y-2">
                    <h3 className="h3">
                        Interactions
                    </h3>
                    <div className="flex items-start justify-between gap-2">
                        <Button>Primary</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="link">Link</Button>
                        <Button variant="big">Big</Button>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                        <Input placeholder="Input" />
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent position="item-aligned">
                                <SelectGroup>
                                    <SelectItem value="o1">Option 1</SelectItem>
                                    <SelectItem value="o2">Option 2</SelectItem>
                                    <SelectItem value="o3">Option 3</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-2">
                            <Checkbox id="checkbox" />
                            <Label htmlFor="checkbox" className="cursor-pointer">Checkbox</Label>
                        </div>
                        <Button onClick={() => setCommandDialogOpen(true)}>
                            Command Dialog
                        </Button>
                        <CommandDialog open={commandDialogOpen} onOpenChange={setCommandDialogOpen}>
                            <CommandInput placeholder="Type a command or search..." />
                            <CommandList>
                                <CommandEmpty>No results found.</CommandEmpty>
                                <CommandGroup heading="Suggestions">
                                    <CommandItem>Calendar</CommandItem>
                                    <CommandItem>Search Emoji</CommandItem>
                                    <CommandItem>Calculator</CommandItem>
                                </CommandGroup>
                                <CommandSeparator />
                                <CommandGroup heading="Settings">
                                    <CommandItem>Profile</CommandItem>
                                    <CommandItem>Billing</CommandItem>
                                    <CommandItem>Settings</CommandItem>
                                </CommandGroup>
                            </CommandList>
                        </CommandDialog>
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="h3">
                        Badge
                    </h3>
                    <div className="flex items-center justify-between gap-2">
                        <Badge variant="default">Default</Badge>
                        <Badge variant="secondary">Secondary</Badge>
                        <Badge variant="destructive">Destructive</Badge>
                        <Badge variant="outline">Outline</Badge>
                        <Badge variant="ghost">Ghost</Badge>
                        <Badge variant="link">Link</Badge>
                    </div>
                </div>
                <div className="space-y-2">
                    <h3 className="h3">
                        Carte
                    </h3>
                    <div className="flex items-center justify-between gap-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Titre de la carte</CardTitle>
                                <CardDescription>
                                    Ceci est la description de la carte. Elle sert à décrire l'utilité de la carte, son objectif ou à donner plus d'informations sur le contenu.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-4">
                                <p>Ceci est le contenu de la carte.</p>
                                <div>
                                    <p>Il peut contenir des inputs:</p>
                                    <Input placeholder="Input" />
                                </div>
                                <div>
                                    <p>Il peut contenir des boutons:</p>
                                    <Button variant="big" className="w-full">Big</Button>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <p>Ceci est le footer de la carte. Il est automatique placé en bas de la carte, et peut permettre de mettre des boutons ou autre.</p>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </article>
        </section>
    )
}
