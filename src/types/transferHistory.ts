// src/types/transferHistory.ts

export interface TransferHistoryResponse {
  id: number;
  transferId: number;
  sourcePlatform: string;
  destinationPlatform: string;
  sourcePlaylistName: string;
  destinationPlaylistName: string;
  totalTracks: number;
  matchedTracks: number;
  unmatchedTracks: number;
  createdAt: string;
  isPublic: boolean;
  publicPlaylistId?: number;
}

export interface TransferHistoryTrackResponse {
  id: number;
  sourceTrackId: string;
  sourceTrackTitle: string;
  sourceTrackArtist: string;
  sourceTrackAlbum: string | null;
  destinationTrackId: string;
  destinationTrackTitle: string;
  destinationTrackArtist: string;
  matchedAt: string;
}

export interface TransferHistoryDetailResponse {
  id: number;
  transferId: number;
  sourcePlatform: string;
  destinationPlatform: string;
  sourcePlaylistName: string;
  destinationPlaylistName: string;
  totalTracks: number;
  matchedTracks: number;
  unmatchedTracks: number;
  createdAt: string;
  tracks: TransferHistoryTrackResponse[];
}

