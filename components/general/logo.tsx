import LogoIcon from "@/public/logo.svg"
import Image from "next/image"
import { cn } from "@/lib/utils"

export enum LogoVariants {
    ICON_ONLY = "icon_only",
    NAME_ALONE = "name_alone",
    NAME_BELOW = "name_below",
    NAME_RIGHT = "name_right"
}

export default function Logo({
    variant,
    className
}: Readonly<{
    variant: LogoVariants,
    className?: string
}>) {
    return (
        <div className={cn("", className)}>
            {
                variant !== LogoVariants.NAME_ALONE && (
                    <div className="flex items-center justify-center">
                        <Image src={LogoIcon} alt="Logo de soko" width={100} height={100} />
                        {
                            variant === LogoVariants.NAME_RIGHT && (
                                <h4 className="h1 font-semibold">SOKO</h4>
                            )
                        }
                    </div>
                )
            }
            {
                (variant === LogoVariants.NAME_BELOW || variant === LogoVariants.NAME_ALONE) && (
                    <h4 className="h1 text-center font-semibold w-full">SOKO</h4>
                )
            }
        </div>
    )
}