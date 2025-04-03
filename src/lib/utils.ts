
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
  if (!str) return '';
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
  
  // Check if one string contains the other completely
  if (normalized1.includes(normalized2) || normalized2.includes(normalized1)) {
    return true;
  }
  
  // Check for word match (useful for multi-word topics)
  const words1 = normalized1.split(' ');
  const words2 = normalized2.split(' ');
  
  // If both strings are multi-word and have at least one matching word
  if (words1.length > 1 && words2.length > 1) {
    for (const word1 of words1) {
      if (word1.length > 3 && words2.some(word2 => word2.length > 3 && word1 === word2)) {
        return true;
      }
    }
  }
  
  return false;
}

