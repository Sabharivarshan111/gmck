
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generate a random ID string
 * @returns A random string ID
 */
export function getRandomId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Normalize a string for comparison (lowercase, trim, replace hyphens)
 * @param str String to normalize
 * @returns Normalized string
 */
export function normalizeString(str: string): string {
  return str.toLowerCase().trim().replace(/-/g, ' ');
}

/**
 * Check if two strings match, accounting for variations in format
 * @param str1 First string
 * @param str2 Second string
 * @returns Boolean indicating if strings match
 */
export function isStringMatch(str1: string, str2: string): boolean {
  if (!str1 || !str2) return false;
  
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);
  
  // Direct match
  if (normalized1 === normalized2) return true;
  
  // Partial match - only if strings are at least 4 characters long
  if (normalized1.length >= 4 && normalized2.length >= 4) {
    if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
      return true;
    }
  }
  
  return false;
}
