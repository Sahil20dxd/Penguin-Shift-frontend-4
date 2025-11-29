// src/utils/apiConfig.ts
// API base URL configuration and OAuth helpers

/**
 * Gets API base URL with fallback priority:
 * 1. VITE_API_BASE env variable
 * 2. Production URL (if not localhost)
 * 3. Local development URL
 */
export function getApiBase(): string {
  // Check environment variable first
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE) {
    return (import.meta as any).env.VITE_API_BASE
  }
  
  // Fallback for older setups
  if (typeof process !== 'undefined' && (process.env as any)?.REACT_APP_API_URL) {
    return (process.env as any).REACT_APP_API_URL
  }
  
  // Determine URL based on hostname
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '0.0.0.0') {
      // Check if local network IP
      const isLocalNetwork = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(hostname)
      
      if (isLocalNetwork) {
        return `http://${hostname}:8080` // Mobile/network device
      } else {
        return 'https://penguinshift-backend.up.railway.app' // Production
      }
    }
  }
  
  return 'http://127.0.0.1:8080' // Local development
}

/**
 * Gets current frontend origin for OAuth redirects
 */
export function getFrontendOrigin(): string {
  return typeof window !== 'undefined' 
    ? window.location.origin 
    : 'http://localhost:5173'
}

/**
 * Sets OAuth intent cookie with appropriate SameSite attribute
 * Production: SameSite=None; Secure (cross-domain)
 * Development: SameSite=Lax (same-domain)
 */
export function setOAuthIntentCookie(intent: 'login' | 'register'): void {
  if (typeof window === 'undefined') return;
  
  const hostname = window.location.hostname
  const isProduction = hostname !== 'localhost' && 
                       hostname !== '127.0.0.1' &&
                       !hostname.match(/^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/)
  const isHttps = window.location.protocol === 'https:' || getApiBase().startsWith('https://')
  
  const sameSite = isProduction && isHttps ? 'SameSite=None; Secure' : 'SameSite=Lax'
  document.cookie = `PS_OAUTH_INTENT=${intent}; Path=/; Max-Age=300; ${sameSite}`
}

