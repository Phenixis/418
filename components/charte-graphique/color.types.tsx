export enum ColorVariants {
    PRIMARY = "primary",
    NOIR = "black",
    BLANC = "white",
    ROUGE = "red",
    ORANGE = "orange",
    VERT = "green",
    BLEU = "blue",
    BACKGROUND_ALTERNATIVE = "background-alternative",
    FADED = "faded"
}

export const colorBgs: Record<ColorVariants, string> = {
    [ColorVariants.PRIMARY]: "bg-primary",
    [ColorVariants.NOIR]: "bg-black",
    [ColorVariants.BLANC]: "bg-white",
    [ColorVariants.ROUGE]: "bg-red",
    [ColorVariants.ORANGE]: "bg-orange",
    [ColorVariants.VERT]: "bg-green",
    [ColorVariants.BLEU]: "bg-blue",
    [ColorVariants.BACKGROUND_ALTERNATIVE]: "bg-background-alternative",
    [ColorVariants.FADED]: "bg-faded"
}
