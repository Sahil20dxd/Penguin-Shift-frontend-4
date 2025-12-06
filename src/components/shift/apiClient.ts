// src/components/shift/apiClient.ts
// API client for playlist transfers and platform OAuth
// Uses HTTP-only cookies for authentication (no token handling needed)

import { getApiBase } from '@/utils/apiConfig'
import { addCsrfToken, getCsrfToken } from '@/utils/csrf'
import { getUserFriendlyError } from '@/utils/userMessages'

const API_BASE = getApiBase()

/**
 * Generic JSON API request with CSRF token handling and automatic retry
 */
export async function apiJson(path: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)
  
  // Always try to get token from localStorage (primary method for cross-origin)
  const accessToken = localStorage.getItem("penguinshift_access_token")
  
  // Build headers - always include Authorization if token exists
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  }
  
  // CRITICAL: Always add Authorization header if token is available
  // Do this BEFORE merging with options.headers to ensure it's not overwritten
  if (accessToken) {
    baseHeaders['Authorization'] = `Bearer ${accessToken}`
    console.log(`[apiJson] ✅ Adding Authorization header for ${path}`)
  } else {
    console.warn(`[apiJson] ⚠️ No access token found in localStorage for ${path}`)
  }
  
  // Merge with any headers from options (but don't let them overwrite Authorization)
  const mergedHeaders = { ...baseHeaders, ...(options.headers as Record<string, string> || {}) }
  // Ensure Authorization is always set if we have a token
  if (accessToken && !mergedHeaders['Authorization']) {
    mergedHeaders['Authorization'] = `Bearer ${accessToken}`
  }
  
  // Convert headers to plain object to ensure they're properly serialized
  const headersObj = addCsrfToken(mergedHeaders)
  // Ensure headers is a plain object (not Headers instance) for fetch
  const finalHeaders: Record<string, string> = headersObj instanceof Headers
    ? Object.fromEntries(headersObj.entries())
    : (headersObj as Record<string, string>)
  
  // CRITICAL: Ensure Authorization header is always set if we have a token
  if (accessToken && !finalHeaders['Authorization']) {
    finalHeaders['Authorization'] = `Bearer ${accessToken}`
  }
  
  // Debug: Log if Authorization header is being sent (only in development)
  if (import.meta.env.DEV) {
    console.log(`[apiJson] Request to ${path}:`, {
      hasToken: !!accessToken,
      hasAuthHeader: !!finalHeaders['Authorization'],
      authHeaderValue: finalHeaders['Authorization'] ? finalHeaders['Authorization'].substring(0, 20) + '...' : 'none',
      method: options.method || 'GET'
    })
  }
  
  // Log final headers being sent (in dev mode)
  if (import.meta.env.DEV) {
    console.log(`[apiJson] Final headers for ${path}:`, {
      hasAuthorization: !!finalHeaders['Authorization'],
      hasContentType: !!finalHeaders['Content-Type'],
      hasCsrf: !!finalHeaders['X-CSRF-TOKEN'],
      allHeaders: Object.keys(finalHeaders)
    })
  }
  
  let res = await fetch(API_BASE + path, {
    ...options,
    credentials: 'include',
    headers: finalHeaders
  })
  
  // Log response status
  if (import.meta.env.DEV) {
    console.log(`[apiJson] Response for ${path}:`, res.status, res.statusText)
  }

  // Retry with CSRF token if 401 on state-changing operations
  if (!res.ok && res.status === 401 && isStateChanging) {
    await new Promise(resolve => setTimeout(resolve, 300))
    
    let csrfToken = getCsrfToken()
    if (!csrfToken) {
      try {
        await fetch(`${API_BASE}/auth/me`, { method: 'GET', credentials: 'include' })
        await new Promise(resolve => setTimeout(resolve, 200))
        csrfToken = getCsrfToken()
      } catch {
        // Continue without CSRF token
      }
    }

    // Retry: Get fresh token in case it was updated
    const freshToken = localStorage.getItem("penguinshift_access_token") || accessToken
    
    console.log(`[apiJson] Retrying ${path} after 401. Has token:`, !!freshToken)
    
    const retryHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    }
    
    // CRITICAL: Always add Authorization header if token exists
    if (freshToken) {
      retryHeaders['Authorization'] = `Bearer ${freshToken}`
      console.log(`[apiJson] ✅ Adding Authorization header to retry for ${path}`)
    } else {
      console.error(`[apiJson] ❌ No token available for retry on ${path}`)
    }
    
    if (csrfToken) {
      retryHeaders['X-CSRF-TOKEN'] = csrfToken
    }
    
    // Ensure headers is a plain object (not Headers instance)
    const retryFinalHeaders: Record<string, string> = retryHeaders
    
    res = await fetch(API_BASE + path, {
      ...options,
      credentials: 'include',
      headers: retryFinalHeaders
    })
  }

  if (!res.ok) {
    let errorMessage = res.statusText || 'Request failed'
    
    try {
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } else {
        const text = await res.text()
        if (text && text.length < 200) {
          try {
            const parsed = JSON.parse(text)
            errorMessage = parsed.message || parsed.error || errorMessage
          } catch {
            errorMessage = text
          }
        }
      }
    } catch {
      // Use user-friendly status-based messages if parsing fails
      errorMessage = getUserFriendlyError(res.status, errorMessage)
    }
    
    // Clean up any remaining technical terms
    errorMessage = errorMessage
      .replace(/HTTP \d{3}/gi, '')
      .replace(/\d{3} (Unauthorized|Forbidden|Not Found|Internal Server Error)/gi, '')
      .trim()
    
    const error = new Error(errorMessage) as any
    error.status = res.status
    error.statusText = res.statusText
    throw error
  }

  // Parse response
  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    try {
      return await res.json()
    } catch {
      return res.ok ? {} : new Error('Failed to parse JSON response')
    }
  }

  const text = await res.text()
  if (!text && res.ok) return {}
  
  if (text) {
    try {
      return JSON.parse(text)
    } catch {
      if (res.ok) return {}
      throw new Error(text || 'Non-JSON response from server')
    }
  }
  
  return {}
}

/**
 * Public API request (no authentication required)
 */
export async function apiJsonPublic(path: string, options: RequestInit = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    const errorMessage = getUserFriendlyError(res.status, text || res.statusText)
    
    const error = new Error(errorMessage) as any
    error.status = res.status
    error.statusText = res.statusText
    throw error
  }

  const contentType = res.headers.get('content-type') || ''
  if (contentType.includes('application/json')) return res.json()

  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(text || 'Non-JSON response from server')
  }
}

/**
 * Fetch binary data (blobs) from API
 * Includes Authorization header for secure endpoints
 */
export async function apiBlob(path: string, options: RequestInit = {}) {
  // Always try to get token from localStorage (primary method for cross-origin)
  const accessToken = localStorage.getItem("penguinshift_access_token")
  
  // Build headers - always include Authorization if token exists
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  }
  
  // CRITICAL: Always add Authorization header if token is available
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
    if (import.meta.env.DEV) {
      console.log(`[apiBlob] ✅ Adding Authorization header for ${path}`)
    }
  } else {
    if (import.meta.env.DEV) {
      console.warn(`[apiBlob] ⚠️ No access token found in localStorage for ${path}`)
    }
  }
  
  const res = await fetch(API_BASE + path, {
    ...options,
    credentials: 'include', // Always include credentials for cookie-based auth fallback
    headers
  })
  
  if (!res.ok) {
    const errorMessage = getUserFriendlyError(res.status, res.statusText)
    throw new Error(errorMessage)
  }
  
  return res.blob()
}

// Platform OAuth & Linking
export function checkLinkStatus(platform: 'spotify' | 'youtube') {
  return apiJson(`/api/platforms/link-status?platform=${platform}`)
}

export function getLinkUrl(platform: 'spotify' | 'youtube') {
  return apiJson('/api/platforms/link-url', {
    method: 'POST',
    body: JSON.stringify({ platform })
  })
}

export function forceReconnect(platform: 'spotify' | 'youtube') {
  return apiJson(`/api/platforms/force-reconnect/${platform}`, { method: 'POST' })
}

// Playlist APIs
export function fetchPlaylists(platform: 'spotify' | 'youtube') {
  return apiJson(`/api/playlists/source?platform=${platform}`)
}

export function listPlaylists(platform: 'spotify' | 'youtube') {
  return apiJson(`/api/playlists/destination?platform=${platform}`)
}

// Transfer APIs
export function startTransfer(request: any) {
  return apiJson('/api/transfer', {
    method: 'POST',
    body: JSON.stringify(request)
  })
}

export function getTransferStatus(transferId: number) {
  return apiJson(`/api/transfer/${transferId}`)
}

// Download helpers
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadFile(transferId: number, type: 'csv' | 'pdf' | 'json') {
  const blob = await apiBlob(`/api/transfer/${transferId}/download?type=${type}`)
  downloadBlob(blob, `transfer-${transferId}.${type}`)
}

export async function downloadUnmatchedCsv(transferId: number) {
  return downloadFile(transferId, 'csv')
}

export async function downloadUnmatchedPdf(transferId: number) {
  return downloadFile(transferId, 'pdf')
}

export function fetchUnmatchedJson(transferId: number) {
  return apiJson(`/api/transfer/${transferId}/unmatched.json`)
}

// Legacy CSV download
export async function downloadUnmatched(transferId: number) {
  const blob = await apiBlob(`/api/transfer/${transferId}/unmatched`)
  downloadBlob(blob, `unmatched-${transferId}.csv`)
}
