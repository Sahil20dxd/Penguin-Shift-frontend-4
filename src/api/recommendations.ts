// src/api/recommendations.ts

import { apiJson } from '@/components/shift/apiClient';
import type { RecommendedTrack } from '@/types/recommendations';

/**
 * Get recommendations for a completed transfer.
 * 
 * @param transferHistoryId Transfer history ID
 * @param limit Number of recommendations (default: 10, max: 100)
 * @returns List of recommended tracks
 */
export async function getRecommendations(
  transferHistoryId: number,
  limit: number = 10
): Promise<RecommendedTrack[]> {
  try {
    const data = await apiJson<RecommendedTrack[]>(
      `/api/recommendations/transfer/${transferHistoryId}?limit=${Math.max(1, Math.min(100, limit))}`
    );
    return Array.isArray(data) ? data : [];
  } catch (err: any) {
    console.error('[getRecommendations] Error:', err);
    throw err;
  }
}
