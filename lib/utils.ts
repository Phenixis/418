import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS class names, resolving conflicts with `tailwind-merge`.
 *
 * Combines {@link https://github.com/lukeed/clsx clsx} for conditional class
 * building with `tailwind-merge` so that conflicting utility classes are
 * correctly deduplicated (e.g. `p-2` wins over `p-4` when both are passed).
 *
 * @param inputs - Any number of class values accepted by `clsx`.
 * @returns A single merged class string safe to pass to `className`.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
