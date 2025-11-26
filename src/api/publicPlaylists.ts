//src/api/publicPlaylists.ts

import { apiJson, apiJsonPublic } from '@/components/shift/apiClient'
import type { PublicPlaylist } from '@/types/publicPlaylist'
import { getApiBase } from '@/utils/apiConfig'

const API_BASE = getApiBase()

export type CreatePublicPlaylistPayload = {
transferId?: number
playlistId?: string
title: string
platform: string // dont need
genre?: string | null
trackCount?: number | null
totalDurationSec?: number | null
coverUrl?: string | null
}

export type UpdateVisibilityPayload = {
isPublic: boolean
}

export type ReportPlaylistPayload = {
  reason: 'OFFENSIVE' | 'SPAM' | 'WRONG_TAGS' | 'OTHER'
  details?: string
}

/**
 * Normalize backend response to ensure consistent field naming
 * Backend might use snake_case while frontend expects camelCase
 */
function normalizePublicPlaylist(playlist: any): PublicPlaylist {
  return {
    id: playlist.id,
    title: playlist.title || playlist.playlistName,
    ownerName: playlist.ownerName || playlist.owner_name,
    ownerEmail: playlist.ownerEmail || playlist.owner_email,
    platform: playlist.platform,
    genre: playlist.genre,
    trackCount: playlist.trackCount || playlist.track_count || 0,
    totalDurationSec: playlist.totalDurationSec || playlist.total_duration_sec,
    coverUrl: playlist.coverUrl || playlist.cover_url,
    isPublic: playlist.isPublic ?? playlist.is_public ?? true,
    publicUrl: playlist.publicUrl || playlist.public_url,
    publicSlug: playlist.publicSlug || playlist.public_slug,
    created_date: playlist.created_date || playlist.createdAt || playlist.created_at,
    transferId: playlist.transferId || playlist.transfer_id,
  }
}

export type PaginatedPlaylistsResponse = {
  playlists: PublicPlaylist[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type GetExplorePublicPlaylistsOptions = {
  page?: number
  limit?: number
  search?: string
  platform?: string
  genre?: string
  minTracks?: number
  maxTracks?: number
  createdFrom?: string
  sort?: 'recent' | 'tracks' | 'a-z'
}

/**
 * Get public playlists with optional pagination and filtering.
 * If no options provided, returns all playlists (backward compatible).
 */
export async function getExplorePublicPlaylists(
  options?: GetExplorePublicPlaylistsOptions
): Promise<PublicPlaylist[] | PaginatedPlaylistsResponse> {
  try {
    // Build query string
    const params = new URLSearchParams()
    if (options) {
      if (options.page) params.append('page', String(options.page))
      if (options.limit) params.append('limit', String(options.limit))
      if (options.search) params.append('search', options.search)
      if (options.platform) params.append('platform', options.platform)
      if (options.genre) params.append('genre', options.genre)
      if (options.minTracks) params.append('minTracks', String(options.minTracks))
      if (options.maxTracks) params.append('maxTracks', String(options.maxTracks))
      if (options.createdFrom) params.append('createdFrom', options.createdFrom)
      if (options.sort) params.append('sort', options.sort)
    }

    const url = '/api/public-playlists' + (params.toString() ? '?' + params.toString() : '')
    const data = await apiJsonPublic(url)

    // Check if response is paginated (has total, page, etc.) or plain array (backward compatible)
    if (data && typeof data === 'object' && 'playlists' in data && 'total' in data) {
      // Paginated response
      const paginated = data as any
      return {
        playlists: paginated.playlists.map(normalizePublicPlaylist),
        total: paginated.total,
        page: paginated.page,
        limit: paginated.limit,
        totalPages: paginated.totalPages
      }
    } else if (Array.isArray(data)) {
      // Backward compatible: plain array response
      return data.map(normalizePublicPlaylist)
    } else {
      console.warn('[getExplorePublicPlaylists] Unexpected response format:', typeof data)
      return []
    }
  } catch (err: any) {
    console.error('[getExplorePublicPlaylists] Error:', err)
    throw err
  }
}

export async function getMyPublicPlaylists(): Promise<PublicPlaylist[]> {
  const data = await apiJson('/api/public-playlists/mine')
  if (!Array.isArray(data)) return []
  return data.map(normalizePublicPlaylist)
}

export async function checkPublicPlaylistNameAvailability(
  name: string
): Promise<{ available: boolean }> {
  try {
    const { getApiBase } = await import('@/utils/apiConfig')
    const API_BASE = getApiBase()
    const response = await fetch(
      `${API_BASE}/api/public-playlists/check-name?name=${encodeURIComponent(name)}`,
      {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to check name availability' }))
      throw new Error(error.message || 'Failed to check name availability')
    }

    return response.json()
  } catch (err: any) {
    console.error('[checkPublicPlaylistNameAvailability] Error:', err)
    throw err
  }
}

export async function createPublicPlaylist(
payload: CreatePublicPlaylistPayload
): Promise<PublicPlaylist> {
const data = await apiJson('/api/public-playlists', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(payload)
})
return data as PublicPlaylist
}

export async function updateVisibility(
  id: number,
  isPublic: boolean
): Promise<PublicPlaylist> {
  const data = await apiJson('/api/public-playlists/' + id + '/visibility', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isPublic })
  })
  return data as PublicPlaylist
}

/**
 * Report a public playlist for moderation
 */
export async function reportPlaylist(
  playlistId: number,
  payload: ReportPlaylistPayload
): Promise<{ success: boolean; message: string; reportId: number }> {
  // Add CSRF token for report request
  const { addCsrfToken } = await import('@/utils/csrf')
  const headers = addCsrfToken({
    'Content-Type': 'application/json',
  })
  
  const response = await fetch(`${API_BASE}/api/public-playlists/${playlistId}/report`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to report playlist' }))
    throw new Error(error.message || 'Failed to report playlist')
  }

  return response.json()
}

// Payload for starting a public playlist transfer
// Matches backend TransferStartRequest structure
export type PublicPlaylistTransferStartPayload = {
  sourcePlatform: string
  destinationPlatform: string
  playlistIds?: string[] | null
  createNew: boolean
  newPlaylistName: string
  newPlaylistDescription?: string | null
  genre: string
  makePublic?: boolean
  publicPlaylistName?: string | null
  includeTracks?: Record<string, string> | null
  tracks?: any[] | null
  transferId?: number | null
}

/**
 * Start a transfer from a public playlist
 * POST /api/transfer/publicPlaylist
 */
export async function startPublicPlaylistTransfer(
  payload: PublicPlaylistTransferStartPayload
): Promise<{ id: number }> {
  try {
    const data = await apiJson('/api/transfer/publicPlaylist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    return data as { id: number }
  } catch (err: any) {
    console.error('[startPublicPlaylistTransfer] Error:', err)
    throw err
  }
}
