"use client";

import { cn } from "@/lib/utils";
import { ColorVariants, colorBgs } from "./color.types";

export default function Color({
    variant,
    className
}: Readonly<{
    variant: ColorVariants
    className?: string
}>) {
    return (
        <div className={cn(
            colorBgs[variant],
            "size-24 hover:w-96 hover:h-48 rounded border border-faded flex flex-col justify-between items-start p-1 duration-200 group/color",
            className
        )}>
            <p>
                {variant.charAt(0).toUpperCase() + variant.slice(1).replaceAll("-", " ")}
            </p>
            <div className="hidden duration-200 group-hover/color:block">
                <span className="uppercase font-bold">
                    Usage
                </span>
                <p>
                    background: {colorBgs[variant]}
                </p>
                <p>
                    border: border-{variant}
                </p>
                <p>
                    text: text-{variant}
                </p>
            </div>
        </div>
    )
}
