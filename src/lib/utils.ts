import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Checks if a string represents an image avatar (data URL, http/https, blob, or raw base64)
 */
export function isAvatarImage(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  return (
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("/9j/") ||
    trimmed.startsWith("iVBORw") ||
    trimmed.startsWith("R0lGOD") ||
    trimmed.startsWith("UklGR")
  );
}

/**
 * Normalizes raw base64 strings if missing the data URI prefix
 */
export function normalizeAvatarSrc(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (
    trimmed.startsWith("/9j/") ||
    trimmed.startsWith("iVBORw") ||
    trimmed.startsWith("R0lGOD") ||
    trimmed.startsWith("UklGR")
  ) {
    return `data:image/jpeg;base64,${trimmed}`;
  }
  return trimmed;
}
