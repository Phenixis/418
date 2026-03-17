import * as LogoIcon from "@/public/logo.svg"
import Image from "next/image"

export enum LogoVariants {
    ICON_ONLY="icon_only",
    NAME_BELOW="name_below"
}

export default function Logo({
    variant
} : Readonly<{
    variant: LogoVariants
}>) {
    return (
        <div className="">
            <Image src={LogoIcon} alt="Logo de soko" width={100} height={100} />
        </div>
    )
}