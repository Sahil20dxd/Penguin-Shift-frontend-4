// src/utils/csrf.ts
// Utility to handle CSRF tokens for Spring Security

/**
 * Gets the CSRF token from the cookie.
 * Spring Security stores CSRF token in a cookie named 'XSRF-TOKEN' by default.
 * @returns CSRF token or null if not found
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  
  // Spring Security uses 'XSRF-TOKEN' as the default cookie name
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'XSRF-TOKEN') {
      return decodeURIComponent(value);
    }
  }
  return null;
}

/**
 * Adds CSRF token to request headers if available.
 * @param headers Existing headers object
 * @returns Headers with CSRF token added
 */
export function addCsrfToken(headers: HeadersInit = {}): HeadersInit {
  const csrfToken = getCsrfToken();
  const headersObj = headers instanceof Headers ? Object.fromEntries(headers.entries()) : headers;
  
  if (csrfToken) {
    return {
      ...headersObj,
      'X-CSRF-TOKEN': csrfToken,
    };
  }
  
  return headersObj;
}

