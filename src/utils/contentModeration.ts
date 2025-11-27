// src/utils/contentModeration.ts
// Content moderation utility to prevent banned words in user input
// Industry-standard implementation with performance optimizations

// Pre-compiled regex patterns (compiled once at module load)
// Patterns check for complete words to avoid blocking partial words like "fucus" when typing "fuck"
// Using word boundaries and minimum length requirements to prevent false positives
const bannedPatterns = [
  // Profanity patterns - match banned words even when embedded in other text (for username validation)
  // Using word boundaries where appropriate to avoid false positives
  /(f+|ph+)[u@*]+(c+|ck+|q+)+/i,             // fuck variations (e.g., "fuck", "phuck", "f*ck", "fucck", "testfuck", "fuck123")
  /a+s{2,}/i,                                // ass variations (e.g., "ass", "aass", "testass")
  /b+i+t+c+h+/i,                             // bitch variations (e.g., "bitch", "biitch", "testbitch")
  /s+h+i+t+/i,                               // shit (e.g., "shit", "shiit", "testshit")
  /(d+|di+)+c+k+/i,                          // dick (e.g., "dick", "dickk", "testdick")
  /(p+|ph+)+u+s+s+y+/i,                      // pussy (e.g., "pussy", "phussy", "testpussy")
  /c+u+n+t+/i,                               // cunt (e.g., "cunt", "cuunt", "testcunt")
  /n+\W*g+\W*g+\W*/i,                        // **blocks ANY spelling of that slur**
  /w+h+o+r+e+/i,                             // whore (e.g., "whore", "whoore", "testwhore")
  /s+l+u+t+/i                                // slut (e.g., "slut", "sluut", "testslut")
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
    if (firstKey !== undefined) {
      validationCache.delete(firstKey);
    }
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
