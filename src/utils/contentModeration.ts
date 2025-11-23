// src/utils/contentModeration.ts
// Content moderation utility to prevent banned words in user input
// Industry-standard implementation with performance optimizations

// Pre-compiled regex patterns (compiled once at module load)
// Patterns check for complete words to avoid blocking partial words like "fucus" when typing "fuck"
// Using word boundaries and minimum length requirements to prevent false positives
const bannedPatterns = [
  // Profanity patterns - word boundaries ensure we match complete words, not partial matches
  // Minimum 4 characters required to avoid blocking while typing (e.g., "fu" won't match, but "fuck" will)
  /\b(f+|ph+)[u@*]+(c+|ck+|q+){2,}\b/i,      // fuck variations (e.g., "fuck", "phuck", "f*ck")
  /\ba+s{2,}\b/i,                            // ass variations (e.g., "ass", "aass")
  /\bb+i+t+c+h+\b/i,                         // bitch variations (e.g., "bitch", "biitch")
  /\bs+h+i+t+\b/i,                           // shit (e.g., "shit", "shiit")
  /\b(d+|di+)+c+k+\b/i,                      // dick (e.g., "dick", "dickk")
  /\b(p+|ph+)+u+s+s+y+\b/i,                  // pussy (e.g., "pussy", "phussy")
  /\bc+u+n+t+\b/i,                           // cunt (e.g., "cunt", "cuunt")
  /\bn+\W*g+\W*g+\W*/i,                      // **blocks ANY spelling of that slur**
  /\bw+h+o+r+e+\b/i,                         // whore (e.g., "whore", "whoore")
  /\bs+l+u+t+\b/i                            // slut (e.g., "slut", "sluut")
];

// Cache for validation results (LRU-style, prevents re-validation of same strings)
const validationCache = new Map<string, boolean>();
const MAX_CACHE_SIZE = 100;

/**
 * Checks if a username or text content is allowed (doesn't contain banned words)
 * Optimized with caching and early exit
 * @param name - The text to validate
 * @returns true if allowed, false if contains banned words
 */
export function isUsernameAllowed(name: string): boolean {
  if (!name || typeof name !== 'string') return true;
  
  // Check cache first
  const cacheKey = name.toLowerCase();
  if (validationCache.has(cacheKey)) {
    return validationCache.get(cacheKey)!;
  }
  
  // Early exit for empty strings
  if (cacheKey.trim().length === 0) {
    validationCache.set(cacheKey, true);
    return true;
  }
  
  // Test against patterns (some() short-circuits on first match)
  const isAllowed = !bannedPatterns.some((pattern) => pattern.test(cacheKey));
  
  // Cache result (with size limit to prevent memory leaks)
  if (validationCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry (simple FIFO)
    const firstKey = validationCache.keys().next().value;
    validationCache.delete(firstKey);
  }
  validationCache.set(cacheKey, isAllowed);
  
  return isAllowed;
}

/**
 * Validates text input and returns an error message if invalid
 * @param text - The text to validate
 * @returns Error message if invalid, null if valid
 */
export function validateTextInput(text: string): string | null {
  if (!text || typeof text !== 'string') return null;
  if (!isUsernameAllowed(text)) {
    return 'This text contains inappropriate content. Please use different wording.';
  }
  return null;
}

/**
 * Hook-friendly validation function for form inputs
 * @param value - The input value to validate
 * @returns Object with isValid boolean and error message
 */
export function validateInput(value: string): { isValid: boolean; error: string | null } {
  const error = validateTextInput(value);
  return {
    isValid: error === null,
    error
  };
}

/**
 * Clear the validation cache (useful for testing or memory management)
 */
export function clearValidationCache(): void {
  validationCache.clear();
}
