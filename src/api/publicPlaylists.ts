//src/api/publicPlaylists.ts

import { apiJson, apiJsonPublic } from '@/components/shift/apiClient'
import type { PublicPlaylist } from '@/types/publicPlaylist'

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

/**
 * Normalize backend response to ensure consistent field naming
 * Backend might use snake_case while frontend expects camelCase
 */
function normalizePublicPlaylist(playlist: any): PublicPlaylist {
  return {
    id: playlist.id,
    title: playlist.title,
    ownerName: playlist.ownerName || playlist.owner_name || 'Anonymous',
    ownerEmail: playlist.ownerEmail || playlist.owner_email,
    platform: playlist.platform,
    genre: playlist.genre,
    trackCount: playlist.trackCount ?? playlist.track_count,
    totalDurationSec: playlist.totalDurationSec ?? playlist.total_duration_sec,
    isPublic: playlist.isPublic ?? playlist.is_public ?? true,
    publicSlug: playlist.publicSlug || playlist.public_slug,
    publicUrl: playlist.publicUrl || playlist.public_url,
    coverUrl: playlist.coverUrl || playlist.cover_url,
    created_date: playlist.created_date || playlist.createdDate,
    transferId: playlist.transferId ?? playlist.transfer_id,
    tracks: playlist.tracks,
  }
}

export async function getExplorePublicPlaylists(): Promise<PublicPlaylist[]> {
  try {
    // Use apiJsonPublic since this is a public endpoint (no auth required)
    const data = await apiJsonPublic('/api/public-playlists', {
      method: 'GET'
    })

    // Normalize the response
    const playlists = Array.isArray(data) ? data : [];
    console.log('[API] Fetched public playlists:', playlists.length);
    return playlists.map(normalizePublicPlaylist);
  } catch (error: any) {
    console.error('[API] Error fetching public playlists:', error);

    // Provide more specific error messages
    if (error.status === 404) {
      throw new Error('Public playlists endpoint not found. Please check backend configuration.');
    } else if (error.status === 500) {
      throw new Error('Server error while loading playlists. Please try again later.');
    } else if (error.status === 401) {
      throw new Error('Authentication required. This endpoint should be public.');
    }

    throw error;
  }
}

export async function getMyPublicPlaylists(): Promise<PublicPlaylist[]> {
  const data = await apiJson('/api/public-playlists/mine', {
    method: 'GET'
  })

  // Normalize the response
  const playlists = Array.isArray(data) ? data : [];
  return playlists.map(normalizePublicPlaylist);
}

export async function checkPublicPlaylistNameAvailability(
  name: string
): Promise<{ available: boolean }> {
  try {
    // Use apiJson since this endpoint requires authentication
    const data = await apiJson(
      '/api/public-playlists/check-name?name=' + encodeURIComponent(name),
      {
        method: 'GET'
      }
    )
    console.log('[API] Name availability check for "' + name + '":', data);
    return data as { available: boolean }
  } catch (error: any) {
    console.error('[API] Error checking name availability:', error);

    // Handle 401 - authentication required
    if (error.status === 401 || error.message?.includes('401')) {
      throw new Error('Authentication required. Please log in again.');
    }

    // On error, assume name is not available to be safe
    if (error.status === 404) {
      throw new Error('Name check endpoint not found. Please check backend configuration.');
    }

    // Return unavailable on error to prevent user from proceeding
    return { available: false };
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

// Payload for starting a public playlist transfer
// Matches backend TransferStartRequest structure
export type PublicPlaylistTransferStartPayload = {
  // Source and destination platforms
  sourcePlatform: 'spotify' | 'youtube'
  destinationPlatform: 'spotify' | 'youtube'

  // Playlist creation settings
  playlistIds: null  // Not used for public playlist transfers
  createNew: boolean  // Should be false for public playlist transfers
  newPlaylistName: string | null  // Can be null or the public playlist name
  newPlaylistDescription: string | null  // Optional description

  // Track inclusion - backend expects Record<string, string> (map of track IDs)
  includeTracks: Record<string, string> | null

  // Public playlist settings
  makePublic: boolean  // Should be false for transfers (already public)
  publicPlaylistName: string | null  // Not used for public playlist transfers

  // Genre (required)
  genre: string

  // Tracks data - array of track objects
  tracks: Array<{
    id?: number
    sourceTrackId: string
    sourceTrackTitle: string
    sourceTrackArtist: string
    sourceTrackAlbum?: string
    destinationTrackId?: string
    destinationTrackTitle?: string
    destinationTrackArtist?: string
    matchedAt?: string
  }> | null

  // Transfer ID to identify the public playlist (optional but recommended)
  transferId?: number | null
}

/**
 * Start a transfer for a shared public playlist.
 */
export async function startPublicPlaylistTransfer(
  payload: PublicPlaylistTransferStartPayload
): Promise<{ id: number }> {
  try {
    console.log('[API] Starting public playlist transfer:', payload);
    const data = await apiJson('/api/transfer/publicPlaylist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    console.log('[API] Public playlist transfer started:', data);
    return data as { id: number }
  } catch (error: any) {
    console.error('[API] Error starting public playlist transfer:', error);
    
    // Handle 401 - authentication required
    if (error.status === 401 || error.message?.includes('401')) {
      throw new Error('Authentication required. Please log in again.');
    }
    
    // Re-throw other errors
    throw error;
  }
}
