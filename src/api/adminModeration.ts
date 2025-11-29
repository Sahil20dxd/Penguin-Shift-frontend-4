// src/api/adminModeration.ts
// Admin moderation API functions

import { apiJson } from '@/components/shift/apiClient'

export interface ReportDetail {
  id: number
  reporterUserId?: number | null
  reason: string
  details?: string | null
  createdAt: string
}

export interface FlaggedPlaylist {
  id: number
  playlistName: string
  ownerUsername: string
  ownerEmail: string
  platform: 'spotify' | 'youtube'
  status: 'PENDING' | 'APPROVED' | 'HIDDEN'
  reportCount: number
  flagReasons: string[]
  reportDetails?: ReportDetail[]
  createdAt: string
  lastFlaggedAt: string
  description?: string
  genre?: string
  isUserRestricted?: boolean
}

export interface FlaggedPlaylistsResponse {
  playlists: FlaggedPlaylist[]
  total: number
}

/**
 * Helper to create user-friendly error messages
 */
function handleError(err: any, defaultMessage: string): never {
  const statusMessages: Record<number, string> = {
    401: 'Your session has expired. Please log in again to continue.',
    403: 'You do not have permission. Admin access required.',
    404: 'Resource not found.',
  }
  
  throw new Error(statusMessages[err.status] || err.message || defaultMessage)
}

export async function getFlaggedPlaylists(
  status?: 'PENDING' | 'APPROVED' | 'HIDDEN'
): Promise<FlaggedPlaylistsResponse> {
  const url = status 
    ? `/api/admin/flagged-playlists?status=${encodeURIComponent(status)}`
    : '/api/admin/flagged-playlists'
  
  try {
    const data = await apiJson(url)
    return data.playlists ? data : { playlists: [], total: 0 }
  } catch (err: any) {
    handleError(err, 'Failed to fetch flagged playlists')
  }
}

export async function getPlaylistDetails(playlistId: number): Promise<FlaggedPlaylist> {
  try {
    const data = await apiJson(`/api/admin/playlists/${playlistId}`)
    return {
      id: data.id,
      playlistName: data.playlistName || data.title,
      ownerUsername: data.ownerUsername || data.ownerName,
      ownerEmail: data.ownerEmail,
      platform: data.platform,
      status: data.status || 'PENDING',
      reportCount: data.reportCount || 0,
      flagReasons: data.flagReasons || [],
      reportDetails: data.reportDetails || [],
      createdAt: data.createdAt,
      lastFlaggedAt: data.lastFlaggedAt,
      description: data.description,
      genre: data.genre,
      isUserRestricted: data.isUserRestricted,
    }
  } catch (err: any) {
    handleError(err, 'Failed to fetch playlist details')
  }
}

export async function approvePlaylist(playlistId: number): Promise<void> {
  try {
    await apiJson(`/api/admin/playlists/${playlistId}/approve`, { method: 'POST' })
  } catch (err: any) {
    handleError(err, 'Failed to approve playlist. Please try again.')
  }
}

export async function hidePlaylist(playlistId: number, reason?: string): Promise<void> {
  try {
    await apiJson(`/api/admin/playlists/${playlistId}/hide`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  } catch (err: any) {
    handleError(err, 'Failed to hide playlist. Please try again.')
  }
}

export async function restrictUser(userId: number | string, reason?: string): Promise<void> {
  try {
    await apiJson(`/api/admin/users/${userId}/restrict`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  } catch (err: any) {
    handleError(err, 'Failed to restrict user. Please try again.')
  }
}

export async function unrestrictUser(userId: number | string): Promise<void> {
  try {
    await apiJson(`/api/admin/users/${userId}/unrestrict`, { method: 'POST' })
  } catch (err: any) {
    handleError(err, 'Failed to unrestrict user. Please try again.')
  }
}

