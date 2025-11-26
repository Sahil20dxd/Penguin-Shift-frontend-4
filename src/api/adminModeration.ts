// src/api/adminModeration.ts
// API functions for admin moderation dashboard
// Note: Admin and Curator roles are treated the same

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
 * Get all flagged playlists for admin moderation
 */
export async function getFlaggedPlaylists(
  status?: 'PENDING' | 'APPROVED' | 'HIDDEN'
): Promise<FlaggedPlaylistsResponse> {
  let url = '/api/admin/flagged-playlists'
  if (status) {
    url += `?status=${encodeURIComponent(status)}`
  }

  try {
    const data = await apiJson(url)
    // Ensure response has the expected structure
    if (!data.playlists) {
      return { playlists: [], total: 0 }
    }
    return data
  } catch (err: any) {
    let errorMessage = 'Failed to fetch flagged playlists'
    if (err.message) {
      errorMessage = err.message
    }
    throw new Error(errorMessage)
  }
}

/**
 * Get details of a specific flagged playlist
 */
export async function getPlaylistDetails(playlistId: number): Promise<FlaggedPlaylist> {
  try {
    const data = await apiJson(`/api/admin/playlists/${playlistId}`)
    // Map the response to FlaggedPlaylist format
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
    let errorMessage = 'Failed to fetch playlist details'
    if (err.message) {
      errorMessage = err.message
    }
    throw new Error(errorMessage)
  }
}

/**
 * Approve a flagged playlist (clear flags, keep it public)
 */
export async function approvePlaylist(playlistId: number): Promise<void> {
  try {
    await apiJson(`/api/admin/playlists/${playlistId}/approve`, { method: 'POST' })
  } catch (err: any) {
    // Provide user-friendly error messages
    if (err.status === 401) {
      throw new Error('Your session has expired. Please log in again to continue.')
    } else if (err.status === 403) {
      throw new Error('You do not have permission to approve this playlist. Admin access required.')
    } else if (err.status === 404) {
      throw new Error('Playlist not found. It may have been deleted.')
    } else {
      throw new Error(err.message || 'Failed to approve playlist. Please try again.')
    }
  }
}

/**
 * Hide/unpublish a playlist (remove from public explore)
 */
export async function hidePlaylist(playlistId: number, reason?: string): Promise<void> {
  try {
    await apiJson(`/api/admin/playlists/${playlistId}/hide`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  } catch (err: any) {
    // Provide user-friendly error messages
    if (err.status === 401) {
      throw new Error('Your session has expired. Please log in again to continue.')
    } else if (err.status === 403) {
      throw new Error('You do not have permission to hide this playlist. Admin access required.')
    } else if (err.status === 404) {
      throw new Error('Playlist not found. It may have been deleted.')
    } else {
      throw new Error(err.message || 'Failed to hide playlist. Please try again.')
    }
  }
}

/**
 * Restrict a user from creating public playlists
 */
export async function restrictUser(userId: number | string, reason?: string): Promise<void> {
  try {
    await apiJson(`/api/admin/users/${userId}/restrict`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    })
  } catch (err: any) {
    // Provide user-friendly error messages
    if (err.status === 401) {
      throw new Error('Your session has expired. Please log in again to continue.')
    } else if (err.status === 403) {
      throw new Error('You do not have permission to restrict users. Admin access required.')
    } else if (err.status === 404) {
      throw new Error('User not found.')
    } else {
      throw new Error(err.message || 'Failed to restrict user. Please try again.')
    }
  }
}

/**
 * Unrestrict a user (allow them to create public playlists again)
 */
export async function unrestrictUser(userId: number | string): Promise<void> {
  try {
    await apiJson(`/api/admin/users/${userId}/unrestrict`, {
      method: 'POST',
    })
  } catch (err: any) {
    // Provide user-friendly error messages
    if (err.status === 401) {
      throw new Error('Your session has expired. Please log in again to continue.')
    } else if (err.status === 403) {
      throw new Error('You do not have permission to unrestrict users. Admin access required.')
    } else if (err.status === 404) {
      throw new Error('User not found.')
    } else {
      throw new Error(err.message || 'Failed to unrestrict user. Please try again.')
    }
  }
}

