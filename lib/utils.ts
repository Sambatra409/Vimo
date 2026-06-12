import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine plusieurs classes Tailwind en gérant les conflits.
 * Ex: cn("p-4", isActive && "bg-primary", "p-6") => "bg-primary p-6"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
