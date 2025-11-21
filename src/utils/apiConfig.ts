// src/utils/apiConfig.ts
// --------------------------------------------------------------------
// Centralized API base URL configuration.
// Supports both local development and production deployments.
// --------------------------------------------------------------------

/**
 * Get the API base URL.
 * Priority:
 * 1. VITE_API_BASE environment variable (if set)
 * 2. Production URL (https://penguinshift-backend.up.railway.app)
 * 3. Local development URL (http://127.0.0.1:8080)
 * 
 * In development, you can create a .env.local file with:
 * VITE_API_BASE=http://127.0.0.1:8080
 * 
 * Or use the production URL by default when deployed.
 */
export function getApiBase(): string {
  // Check for explicit environment variable first
  if (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE) {
    return (import.meta as any).env.VITE_API_BASE
  }
  
  // Check process.env (fallback for older setups)
  if (typeof process !== 'undefined' && (process.env as any)?.REACT_APP_API_URL) {
    return (process.env as any).REACT_APP_API_URL
  }
  
  // Check if we're in production (deployed)
  // In production, use Railway URL
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    // If not localhost or 127.0.0.1, assume production
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://penguinshift-backend.up.railway.app'
    }
  }
  
  // Default to local development
  return 'http://127.0.0.1:8080'
}

// Export the API base URL as a constant
export const API_BASE = getApiBase()

