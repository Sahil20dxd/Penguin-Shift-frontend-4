// src/components/recommendations/RecommendationSection.tsx

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, Loader2, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import PreviewPlayer from './PreviewPlayer';
import { getRecommendations } from '@/api/recommendations';
import type { RecommendedTrack } from '@/types/recommendations';
import { useToast } from '@/hooks/useToast';
import { apiJson } from '@/components/shift/apiClient';

interface RecommendationSectionProps {
  transferHistoryId: number;
  destinationPlatform: 'spotify' | 'youtube';
  destinationPlaylistId?: string;
}

export default function RecommendationSection({
  transferHistoryId,
  destinationPlatform,
  destinationPlaylistId
}: RecommendationSectionProps) {
  const [recommendations, setRecommendations] = useState<RecommendedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [addingTracks, setAddingTracks] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    console.log('[RecommendationSection] useEffect triggered. transferHistoryId:', transferHistoryId)
    if (transferHistoryId) {
      console.log('[RecommendationSection] Fetching recommendations for transferHistoryId:', transferHistoryId)
      fetchRecommendations();
    } else {
      console.warn('[RecommendationSection] transferHistoryId is null/undefined, skipping fetch')
    }
  }, [transferHistoryId]);

  const fetchRecommendations = async () => {
    console.log('[RecommendationSection] ===== FETCHING RECOMMENDATIONS =====')
    console.log('[RecommendationSection] transferHistoryId:', transferHistoryId)
    console.log('[RecommendationSection] destinationPlatform:', destinationPlatform)
    console.log('[RecommendationSection] destinationPlaylistId:', destinationPlaylistId)
    setLoading(true);
    setError(null);
    try {
      console.log('[RecommendationSection] Calling getRecommendations API...')
      const data = await getRecommendations(transferHistoryId, 10);
      console.log('[RecommendationSection] ✅ Received recommendations:', data.length, 'tracks')
      console.log('[RecommendationSection] Recommendations data:', data)
      setRecommendations(data);
    } catch (err: any) {
      console.error('[RecommendationSection] ❌ Error fetching recommendations:', err);
      console.error('[RecommendationSection] Error details:', {
        message: err?.message,
        stack: err?.stack,
        response: err?.response
      });
      setError('Failed to load recommendations. Please try again later.');
    } finally {
      setLoading(false);
      console.log('[RecommendationSection] Fetch complete. Loading set to false.')
    }
  };

  const handleTrackToggle = (trackId: string) => {
    setSelectedTracks(prev => {
      const next = new Set(prev);
      if (next.has(trackId)) {
        next.delete(trackId);
      } else {
        next.add(trackId);
      }
      return next;
    });
  };

  const handleAddSelected = async () => {
    console.log('[RecommendationSection] ===== ADDING SELECTED TRACKS =====')
    console.log('[RecommendationSection] Selected tracks:', Array.from(selectedTracks))
    console.log('[RecommendationSection] destinationPlaylistId:', destinationPlaylistId)
    console.log('[RecommendationSection] destinationPlatform:', destinationPlatform)
    
    if (selectedTracks.size === 0) {
      console.warn('[RecommendationSection] No tracks selected')
      showToast('Please select at least one track to add', 'warning');
      return;
    }

    if (!destinationPlaylistId) {
      console.error('[RecommendationSection] ❌ destinationPlaylistId is not available')
      showToast('Playlist ID not available. Please wait for the transfer to complete.', 'error');
      return;
    }

    setAddingTracks(true);
    try {
      const trackIds = Array.from(selectedTracks);
      const payload = destinationPlatform === 'spotify' 
        ? { playlistId: destinationPlaylistId, trackIds }
        : { playlistId: destinationPlaylistId, videoIds: trackIds };

      await apiJson(`/api/playlists/${destinationPlatform}/add-tracks`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      showToast(`Successfully added ${selectedTracks.size} track(s) to playlist!`, 'success');
      setSelectedTracks(new Set());
      
      // Refresh recommendations to remove added tracks
      fetchRecommendations();
    } catch (err: any) {
      console.error('[RecommendationSection] Error adding tracks:', err);
      showToast('Failed to add tracks to playlist. Please try again.', 'error');
    } finally {
      setAddingTracks(false);
    }
  };

  const formatDuration = (ms?: number | null): string => {
    if (!ms) return '';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-8"
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          <span className="ml-3 text-gray-600">Loading recommendations...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-8"
      >
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-800">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRecommendations}
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mt-8"
      >
        <Card className="border-gray-200">
          <CardContent className="pt-6 text-center">
            <Music2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No recommendations available at this time.</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Recommended for You
          </h2>
          <p className="text-gray-600">
            Based on your playlist, here are some songs you might like
          </p>
        </div>
        {selectedTracks.size > 0 && (
          <Button
            onClick={handleAddSelected}
            disabled={addingTracks || !destinationPlaylistId}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!destinationPlaylistId ? 'Playlist ID not available. Please wait for transfer to complete.' : 'Add selected tracks to playlist'}
          >
            {addingTracks ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Selected ({selectedTracks.size})
              </>
            )}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {recommendations.map((track, index) => {
            const isSelected = selectedTracks.has(track.id);
            return (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                  }`}
                  onClick={() => handleTrackToggle(track.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {track.title || 'Unknown Track'}
                        </h3>
                        <p className="text-sm text-gray-600 truncate">
                          {track.artist || 'Unknown Artist'}
                        </p>
                        {track.album && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {track.album}
                          </p>
                        )}
                      </div>
                      <div className="ml-2">
                        {isSelected ? (
                          <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        {track.durationMs && (
                          <span className="text-xs text-gray-500">
                            {formatDuration(track.durationMs)}
                          </span>
                        )}
                        <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                          {destinationPlatform === 'spotify' ? '🎵 Spotify' : '▶️ YouTube'}
                        </span>
                      </div>
                      <PreviewPlayer
                        previewUrl={track.previewUrl}
                        trackTitle={track.title}
                        artist={track.artist}
                        platform={destinationPlatform}
                        videoId={destinationPlatform === 'youtube' ? track.id : undefined}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
