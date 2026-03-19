import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "font-action inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm whitespace-nowrap transition-all outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-red aria-invalid:ring-red/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 cursor-pointer",
  {
    variants: {
      variant: {
        default: "bg-primary text-black hover:bg-primary/90",
        destructive:
          "bg-red text-white hover:bg-red/80 focus-visible:ring-red/20",
        outline:
          "border bg-background shadow-xs hover:bg-black/10 hover:text-black",
        secondary:
          "bg-black text-white hover:bg-black/80",
        ghost:
          "hover:bg-black/10 hover:text-black",
        link: "text-black underline-offset-4 decoration-3 hover:underline decoration-primary",
        big: "bg-primary hover:bg-transparent border-2 border-primary text-black hover:text-primary rounded-full !text-lg !px-8 !py-5",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
