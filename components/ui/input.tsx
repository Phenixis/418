import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-md border border-faded bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-black file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-black placeholder:text-black/70 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/50",
        "aria-invalid:border-red aria-invalid:ring-red/20",
        className
      )}
      {...props}
    />
  )
}

export { Input }
