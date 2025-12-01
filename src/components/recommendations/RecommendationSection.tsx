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

interface RecommendationSectionProps {
  transferHistoryId: number;
  destinationPlatform: 'spotify' | 'youtube';
  destinationPlaylistId?: string;
  onAddToPlaylist?: (trackIds: string[]) => Promise<void>;
}

export default function RecommendationSection({
  transferHistoryId,
  destinationPlatform,
  destinationPlaylistId,
  onAddToPlaylist
}: RecommendationSectionProps) {
  const [recommendations, setRecommendations] = useState<RecommendedTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTracks, setSelectedTracks] = useState<Set<string>>(new Set());
  const [addingTracks, setAddingTracks] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchRecommendations();
  }, [transferHistoryId]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getRecommendations(transferHistoryId, 20);
      setRecommendations(data);
    } catch (err: any) {
      console.error('[RecommendationSection] Error fetching recommendations:', err);
      setError('Failed to load recommendations. Please try again later.');
    } finally {
      setLoading(false);
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
    if (selectedTracks.size === 0) {
      showToast('Please select at least one track to add', 'warning');
      return;
    }

    if (!onAddToPlaylist) {
      showToast('Playlist ID not available', 'error');
      return;
    }

    setAddingTracks(true);
    try {
      await onAddToPlaylist(Array.from(selectedTracks));
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
            className="bg-purple-600 hover:bg-purple-700"
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
                        {track.platform && (
                          <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                            {track.platform === 'spotify' ? '🎵 Spotify' : '▶️ YouTube'}
                          </span>
                        )}
                      </div>
                      <PreviewPlayer
                        previewUrl={track.previewUrl}
                        trackTitle={track.title}
                        artist={track.artist}
                        platform={track.platform || destinationPlatform}
                        videoId={track.platform === 'youtube' ? track.id : undefined}
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

