// src/types/recommendations.ts

export interface RecommendedTrack {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  durationMs?: number | null;
  previewUrl?: string | null; // Spotify 30-second preview URL
  platform?: 'spotify' | 'youtube'; // Platform this track is from
}

