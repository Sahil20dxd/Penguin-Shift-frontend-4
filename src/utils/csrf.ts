// src/utils/csrf.ts
// CSRF token handling for Spring Security

/**
 * Gets CSRF token from cookie (Spring Security stores it as 'XSRF-TOKEN')
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  
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
 * Adds CSRF token to request headers if available
 */
export function addCsrfToken(headers: HeadersInit = {}): HeadersInit {
  const csrfToken = getCsrfToken();
  const headersObj = headers instanceof Headers 
    ? Object.fromEntries(headers.entries()) 
    : headers;
  
  return csrfToken 
    ? { ...headersObj, 'X-CSRF-TOKEN': csrfToken }
    : headersObj;
}

