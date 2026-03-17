import Color from "@/components/charte_graphique/color"
import Logo, { LogoVariants } from "@/components/general/logo"
import { ColorVariants } from "@/components/charte_graphique/color.types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function Page() {
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
                    ...
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
                    <div className="flex items-start justify-start gap-2">
                        <Button>Primary</Button>
                        <Button variant="secondary">Secondary</Button>
                        <Button variant="destructive">Destructive</Button>
                        <Button variant="outline">Outline</Button>
                        <Button variant="ghost">Ghost</Button>
                        <Button variant="link">Link</Button>
                        <Button variant="big">Big</Button>
                    </div>
                    <Input placeholder="Input" className="w-[30%]" />
                    <div className="flex items-center gap-2">
                        <Checkbox id="checkbox" />
                        <Label htmlFor="checkbox" className="cursor-pointer">Checkbox</Label>
                    </div>
                </div>
            </article>
        </section>
    )
}