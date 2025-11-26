// src/components/shift/apiClient.ts
// --------------------------------------------------------------------
// API client wrapper for PenguinShift.
// Handles both Spotify ↔ YouTube directions (OAuth, playlists, transfer).
// --------------------------------------------------------------------

import { getApiBase } from '@/utils/apiConfig'

const API_BASE = getApiBase()

function getAuthToken(): string {
  return localStorage.getItem('authToken') || localStorage.getItem('jwt') || ''
}

// Generic JSON fetch
export async function apiJson(path: string, options: RequestInit = {}) {
  const token = getAuthToken()
  const res = await fetch(API_BASE + path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(options.headers || {})
    }
  })

  if (!res.ok) {
    let errorMessage = res.statusText || 'Request failed'
    
    // Try to parse error response for better error messages
    try {
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const errorData = await res.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } else {
        const text = await res.text()
        if (text) {
          try {
            const parsed = JSON.parse(text)
            errorMessage = parsed.message || parsed.error || errorMessage
          } catch {
            // If not JSON, use the text if it's meaningful
            if (text.length < 200) {
              errorMessage = text
            }
          }
        }
      }
    } catch {
      // If parsing fails, use status-based messages
      if (res.status === 401) {
        errorMessage = 'Authentication required. Please log in again.'
      } else if (res.status === 403) {
        errorMessage = 'Access denied. You do not have permission to perform this action.'
      } else if (res.status === 404) {
        errorMessage = 'Resource not found.'
      } else if (res.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      }
    }
    
    const error = new Error(errorMessage) as any
    error.status = res.status
    error.statusText = res.statusText
    throw error
  }

  // Handle successful responses (200-299)
  const ct = res.headers.get('content-type') || ''
  const contentLength = res.headers.get('content-length')
  
  // If content-length is 0 or response is empty, return empty object for success
  if (contentLength === '0' || (!ct.includes('application/json') && !ct.includes('text') && !ct)) {
    // For successful requests with no body, return empty object
    return {}
  }
  
  if (ct.includes('application/json')) {
    try {
      const jsonData = await res.json()
      return jsonData
    } catch {
      // If JSON parsing fails but status is OK, return empty object
      if (res.ok) {
        return {}
      }
      throw new Error('Failed to parse JSON response')
    }
  }

  const text = await res.text()
  // If there's no text content, return empty object for success responses
  if (!text && res.ok) {
    return {}
  }
  
  // Try to parse as JSON if there's text
  if (text) {
    try {
      return JSON.parse(text)
    } catch {
      // For successful responses with non-JSON content, return empty object
      if (res.ok) {
        return {}
      }
      throw new Error(text || 'Non-JSON response from server')
    }
  }
  
  // Default: return empty object for successful empty responses
  return {}
}

// Generic JSON fetch for PUBLIC endpoints (no auth required)
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

    // Better error messages based on status code
    let errorMessage: string
    if (res.status === 401) {
      errorMessage = 'Authentication required'
    } else if (res.status === 403) {
      errorMessage = 'Access forbidden'
    } else if (res.status === 404) {
      errorMessage = 'Resource not found'
    } else if (res.status >= 500) {
      errorMessage = 'Server error'
    } else {
      errorMessage = text || res.statusText
    }

    const error = new Error(`HTTP ${res.status}: ${errorMessage}`) as any
    error.status = res.status
    error.statusText = res.statusText
    throw error
  }

  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json()

  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(text || 'Non-JSON response from server')
  }
}

// Generic blob fetch
export async function apiBlob(path: string, options: RequestInit = {}) {
  const token = getAuthToken()
  const res = await fetch(API_BASE + path, {
    ...options,
    credentials: 'include',
    headers: {
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
      ...(options.headers || {})
    }
  })
  if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + res.statusText)
  return res.blob()
}

// --------------------------------------------------------------------
// Platform OAuth + Linking
// --------------------------------------------------------------------
export function checkLinkStatus(platform: 'spotify' | 'youtube') {
  return apiJson('/api/platforms/link-status?platform=' + platform)
}

export function getLinkUrl(platform: 'spotify' | 'youtube') {
  return apiJson('/api/platforms/link-url', {
    method: 'POST',
    body: JSON.stringify({ platform })
  })
}

export function forceReconnect(platform: 'spotify' | 'youtube') {
  // helper for manual reconnect (optional)
  return apiJson('/api/platforms/force-reconnect/' + platform, {
    method: 'POST'
  })
}

// --------------------------------------------------------------------
// Playlist APIs
// --------------------------------------------------------------------

// Get source playlists (Spotify or YouTube)
export function fetchPlaylists(platform: 'spotify' | 'youtube') {
  return apiJson('/api/playlists/source?platform=' + platform)
}

// Get destination playlists for either Spotify or YouTube
export function listPlaylists(platform: 'spotify' | 'youtube') {
  return apiJson('/api/playlists/destination?platform=' + platform)
}

// --------------------------------------------------------------------
// Transfer APIs (works for both directions)
// --------------------------------------------------------------------
export function startTransfer(request: any) {
  // backend auto-detects direction via sourcePlatform + destinationPlatform
  return apiJson('/api/transfer', {
    method: 'POST',
    body: JSON.stringify(request)
  })
}

export function getTransferStatus(transferId: number) {
  return apiJson('/api/transfer/' + transferId)
}

// --------------------------------------------------------------------
// Unmatched Downloads (CSV, PDF, JSON)
// --------------------------------------------------------------------
export async function downloadFile(
  transferId: number,
  type: 'csv' | 'pdf' | 'json'
) {
  const blob = await apiBlob(
    '/api/transfer/' + transferId + '/download?type=' + type
  )
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'transfer-' + transferId + '.' + type
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function downloadUnmatchedCsv(transferId: number) {
  return downloadFile(transferId, 'csv')
}

export async function downloadUnmatchedPdf(transferId: number) {
  return downloadFile(transferId, 'pdf')
}

export function fetchUnmatchedJson(transferId: number) {
  return apiJson('/api/transfer/' + transferId + '/unmatched.json')
}

// Simple CSV-only shortcut (legacy)
export async function downloadUnmatched(transferId: number) {
  const blob = await apiBlob('/api/transfer/' + transferId + '/unmatched')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'unmatched-' + transferId + '.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
