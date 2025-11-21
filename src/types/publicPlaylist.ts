//src/types/publicPlaylist.ts

export type PublicPlaylist = {
  id: number
  title: string
  ownerName: string
  owner_name?: string // Backend might use snake_case
  ownerEmail?: string | null
  owner_email?: string | null // Backend might use snake_case

  // platform + basic metadata
  platform: string
  genre?: string | null
  trackCount?: number | null
  track_count?: number | null // Backend might use snake_case
  totalDurationSec?: number | null
  total_duration_sec?: number | null // Backend might use snake_case

  // visibility + sharing
  isPublic: boolean
  is_public?: boolean // Backend might use snake_case
  publicSlug?: string | null
  public_slug?: string | null // Backend might use snake_case
  publicUrl?: string | null
  public_url?: string | null // Backend might use snake_case

  // optional artwork
  coverUrl?: string | null
  cover_url?: string | null // Backend might use snake_case

  // ISO string from backend (created_at on the row)
  created_date: string
  createdDate?: string // Backend might use camelCase

  // Transfer relationship
  transferId?: number | null
  transfer_id?: number | null // Backend might use snake_case

  // optional preview of tracks (not required by backend yet)
  tracks?: {
  title: string
  artist: string
  durationSec?: number
  }[]
  }