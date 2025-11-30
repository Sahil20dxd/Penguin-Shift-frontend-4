// src/utils/apiConfig.ts
// API base URL configuration and OAuth helpers

/**
 * Gets API base URL with fallback priority:
 * 1. VITE_API_BASE env variable (if set, use it - allows override)
 * 2. In development mode: use empty string to leverage Vite proxy (same-origin, cookies work)
 * 3. Production URL (if not localhost)
 * 4. Local development URL (fallback)
 * 
 * Note: In development, using empty string makes requests go through Vite proxy,
 * which makes them appear same-origin, allowing cookies to work properly.
 */
export function getApiBase(): string {
  // Check environment variable first (allows override for production or network access)
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE) {
    return (import.meta as any).env.VITE_API_BASE
  }
  
  // Fallback for older setups
  if (typeof process !== 'undefined' && (process.env as any)?.REACT_APP_API_URL) {
    return (process.env as any).REACT_APP_API_URL
  }
  
  // In development mode, use empty string to leverage Vite proxy
  // This makes requests same-origin, so cookies work without CORS issues
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) {
    // Check if we're on localhost/127.0.0.1 (use proxy)
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
        return '' // Use Vite proxy - requests will be same-origin
      }
      
      // Check if local network IP - use full URL (proxy won't work across network)
      const isLocalNetwork = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(hostname)
      if (isLocalNetwork) {
        return `http://${hostname}:8080` // Mobile/network device - need full URL
      }
    }
  }
  
  // Determine URL based on hostname for production
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '0.0.0.0') {
      // Check if local network IP
      const isLocalNetwork = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/.test(hostname)
      
      if (isLocalNetwork) {
        return `http://${hostname}:8080` // Mobile/network device
      } else {
        return 'https://penguinshift-backend-v5.onrender.com' // Production
      }
    }
  }
  
  // Fallback: if not in dev mode or can't determine, use local backend
  // But if we're in dev mode and on localhost, we should have returned '' above
  return 'http://127.0.0.1:8080' // Local development fallback
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

