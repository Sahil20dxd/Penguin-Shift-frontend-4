// src/components/shift/apiClient.ts
// API client for playlist transfers and platform OAuth
// Uses HTTP-only cookies for authentication (no token handling needed)

import { getApiBase } from '@/utils/apiConfig'
import { addCsrfToken, getCsrfToken } from '@/utils/csrf'

const API_BASE = getApiBase()

/**
 * Generic JSON API request with CSRF token handling and automatic retry
 */
export async function apiJson(path: string, options: RequestInit = {}) {
  const method = (options.method || 'GET').toUpperCase()
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)
  
  const headers = addCsrfToken({
    'Content-Type': 'application/json',
    ...(options.headers || {})
  })
  
  let res = await fetch(API_BASE + path, {
    ...options,
    credentials: 'include',
    headers
  })

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

    const retryHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    }
    if (csrfToken) {
      retryHeaders['X-CSRF-TOKEN'] = csrfToken
    }
    
    res = await fetch(API_BASE + path, {
      ...options,
      credentials: 'include',
      headers: retryHeaders
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
      // Use status-based messages if parsing fails
      const statusMessages: Record<number, string> = {
        401: 'Authentication required. Please log in again.',
        403: 'Access denied. You do not have permission to perform this action.',
        404: 'Resource not found.',
      }
      errorMessage = statusMessages[res.status] || (res.status >= 500 ? 'Server error. Please try again later.' : errorMessage)
    }
    
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
    const statusMessages: Record<number, string> = {
      401: 'Authentication required',
      403: 'Access forbidden',
      404: 'Resource not found',
    }
    const errorMessage = statusMessages[res.status] || (res.status >= 500 ? 'Server error' : text || res.statusText)
    
    const error = new Error(`HTTP ${res.status}: ${errorMessage}`) as any
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
 */
export async function apiBlob(path: string, options: RequestInit = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    credentials: 'include',
    headers: options.headers || {}
  })
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
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
