// src/utils/contentModeration.ts
// Content moderation utility to prevent banned words in user input

const bannedPatterns = [
  /(f+|ph+)[u@*]+(c+|ck+|q+)+/i,          // fuck variations
  /a+s+s+/i,                             // ass variations
  /b+i+t+c*h*/i,                         // bitch variations
  /s+h+i+t+/i,                           // shit
  /(d+|di+)ck+/i,                        // dick
  /(p+|ph+)uss+y+/i,                     // pussy
  /c+u+n+t+/i,                           // cunt
  /n+\W*g+\W*g+\W*/i,                    // **blocks ANY spelling of that slur**
  /wh+o+r+e+/i,                          // whore
  /s+l+u+t+/i                            // slut
];

/**
 * Checks if a username or text content is allowed (doesn't contain banned words)
 * @param name - The text to validate
 * @returns true if allowed, false if contains banned words
 */
export function isUsernameAllowed(name: string): boolean {
  if (!name || typeof name !== 'string') return true;
  const lower = name.toLowerCase();
  return !bannedPatterns.some((pattern) => pattern.test(lower));
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

