import Logo, { LogoVariants } from "@/components/general/logo"

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
        </section>
    )
}