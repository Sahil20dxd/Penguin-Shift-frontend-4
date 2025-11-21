// src/components/explore/PlaylistDetailsDrawer.tsx
import React, { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { format } from 'date-fns'
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music2, Clock, Calendar, Link2, Plus, RefreshCw, AlertCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PublicPlaylist } from "@/types/publicPlaylist";
import { getTransferHistoryTracksByTransferId } from "@/api/transferHistory";
import type { TransferHistoryTrackResponse } from "@/types/transferHistory";

// Important constant: platform-specific badge colors
const platformColors: Record<string, string> = {
  spotify: "bg-green-100 text-green-800",
  youtube: "bg-red-100 text-red-800",
  amazon: "bg-orange-100 text-orange-800",
  apple: "bg-pink-100 text-pink-800",
  jiosaavn: "bg-blue-100 text-blue-800",
  pandora: "bg-purple-100 text-purple-800",
};

// Platform display names mapping
const platformDisplayNames: Record<string, string> = {
  spotify: "Spotify",
  youtube: "YouTube",
  amazon: "Amazon Music",
  apple: "Apple Music",
  jiosaavn: "JioSaavn",
  pandora: "Pandora",
};
type Track = {
  title: string;
  artist: string;
  durationSec?: number;
};

// Drawer playlist = shared playlist + optional tracks
type PublicPlaylistDetails = PublicPlaylist & {
  tracks?: Track[];
};

type PlaylistDetailsDrawerProps = {
  playlist: PublicPlaylistDetails | null;
  open: boolean;
  onClose: () => void;
  onCopyLink: (playlist: PublicPlaylistDetails) => void;
  onAddToLibrary: (playlist: PublicPlaylistDetails, tracks: TransferHistoryTrackResponse[]) => void;
};

/** Format single track duration in seconds to m:ss */
function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return String(mins) + ":" + String(secs).padStart(2, "0");
}
/** Format total playlist duration in seconds to h/m string */
function formatTotalDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return String(hours) + "h " + String(mins) + "m";
  return String(mins) + "m";
}

/**
 * PlaylistDetailsDrawer:
 * Slide-in panel showing full playlist details and tracks.
 * Exposes add-to-library and copy-link actions.
 */
export default function PlaylistDetailsDrawer({
  playlist,
  open,
  onClose,
  onCopyLink,
  onAddToLibrary,
}: PlaylistDetailsDrawerProps) {
  const [tracks, setTracks] = useState<TransferHistoryTrackResponse[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [tracksError, setTracksError] = useState<string | null>(null);

  // Fetch tracks when drawer opens and playlist has transferId
  useEffect(() => {
    const fetchTracks = async () => {
      if (!playlist?.transferId) {
        console.log('[PlaylistDetails] No transferId, skipping track fetch');
        return;
      }

      setLoadingTracks(true);
      setTracksError(null);
      setTracks([]);

      try {
        console.log('[PlaylistDetails] Fetching tracks for transferId:', playlist.transferId);
        const fetchedTracks = await getTransferHistoryTracksByTransferId(playlist.transferId);
        console.log('[PlaylistDetails] Successfully fetched tracks:', fetchedTracks.length);
        setTracks(fetchedTracks);
      } catch (error: any) {
        console.error('[PlaylistDetails] Error fetching tracks:', error);

        // Provide user-friendly error messages
        if (error.message?.includes('401')) {
          setTracksError('Please log in to view track details');
        } else if (error.message?.includes('404')) {
          setTracksError('Track information not found');
        } else if (error.message?.includes('500')) {
          setTracksError('Server error. Please try again later');
        } else if (error.message?.includes('NetworkError') || error.message?.includes('Failed to fetch')) {
          setTracksError('Cannot connect to server. Please check your connection');
        } else {
          setTracksError('Failed to load tracks. Please try again');
        }
      } finally {
        setLoadingTracks(false);
      }
    };

    if (open && playlist) {
      fetchTracks();
    }
  }, [open, playlist?.transferId]);

  const handleRetryFetchTracks = () => {
    if (playlist?.transferId) {
      setTracksError(null);
      setLoadingTracks(true);
      getTransferHistoryTracksByTransferId(playlist.transferId)
        .then(setTracks)
        .catch((error) => {
          setTracksError('Failed to load tracks. Please try again');
        })
        .finally(() => setLoadingTracks(false));
    }
  };

  if (!playlist) return null;

  const platformClass =
    platformColors[playlist.platform] || "bg-gray-100 text-gray-800";

  const platformName = platformDisplayNames[playlist.platform] || playlist.platform;

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <SheetContent
        className="w-full sm:max-w-lg overflow-y-auto bg-white"
        side="right"
      >
        <SheetHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <SheetTitle className="text-2xl font-bold pr-8">
              {playlist.title}
            </SheetTitle>
          </div>
          <SheetDescription className="text-base">
            by {playlist.ownerName || "Anonymous"}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {/* Cover image */}
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400">
            {playlist.coverUrl ? (
              <img
                src={playlist.coverUrl}
                alt={playlist.title + " cover"}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music2
                  className="w-24 h-24 text-white/80"
                  aria-hidden="true"
                />
              </div>
            )}
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Platform</div>
              <Badge className={platformClass}>{platformName}</Badge>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1">Genre</div>
              <div className="font-semibold">{playlist.genre || "N/A"}</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                <Music2 className="w-3 h-3" aria-hidden="true" />
                Tracks
              </div>
              <div className="font-semibold">{playlist.trackCount}</div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-xs text-gray-600 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" />
                Duration
              </div>
              <div className="font-semibold">
                {formatTotalDuration(playlist.totalDurationSec)}
              </div>
            </div>
          </div>

          {playlist.created_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              Created on{" "}
              {format(new Date(playlist.created_date), "MMM d, yyyy")}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => onAddToLibrary(playlist, tracks)}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Library
            </Button>

            {playlist.isPublic && (
              <Button
                variant="outline"
                onClick={() => onCopyLink(playlist)}
                aria-label="Copy share link"
              >
                <Link2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Tracks list */}
          <div>
            <h3 className="font-semibold text-lg mb-3">Tracks</h3>

            {/* Loading State */}
            {loadingTracks && (
              <div className="border rounded-lg bg-white">
                <div className="divide-y">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-3 animate-pulse">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error State */}
            {!loadingTracks && tracksError && (
              <div className="border rounded-lg p-6 bg-red-50 border-red-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800 font-medium text-sm mb-2">
                      {tracksError}
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRetryFetchTracks}
                      className="mt-2"
                    >
                      <RefreshCw className="w-3 h-3 mr-2" />
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Success State - Show Tracks */}
            {!loadingTracks && !tracksError && tracks.length > 0 && (
              <ScrollArea className="h-[300px] border rounded-lg bg-white">
                <div className="divide-y">
                  {tracks.map((track, idx) => (
                    <div
                      key={track.id || idx}
                      className="p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {track.destinationTrackTitle || track.sourceTrackTitle}
                          </div>
                          <div className="text-xs text-gray-600 truncate">
                            {track.destinationTrackArtist || track.sourceTrackArtist}
                          </div>
                          {/* Show source info if different from destination */}
                          {track.sourceTrackTitle !== track.destinationTrackTitle && (
                            <div className="mt-2 pt-2 border-t border-gray-100">
                              <div className="text-xs text-gray-500">
                                <span className="font-medium">Original:</span> {track.sourceTrackTitle}
                              </div>
                              <div className="text-xs text-gray-500">
                                by {track.sourceTrackArtist}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-xs text-gray-400">
                          #{idx + 1}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Empty State - No Tracks */}
            {!loadingTracks && !tracksError && tracks.length === 0 && !playlist.transferId && (
              <div className="border rounded-lg p-8 text-center bg-gray-50">
                <Music2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">
                  Track list not available for this playlist
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  {playlist.trackCount} tracks in total
                </p>
              </div>
            )}

            {/* Empty State - No Matched Tracks */}
            {!loadingTracks && !tracksError && tracks.length === 0 && playlist.transferId && (
              <div className="border rounded-lg p-8 text-center bg-gray-50">
                <Music2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 text-sm">
                  No tracks found for this playlist
                </p>
                <p className="text-gray-500 text-xs mt-1">
                  This transfer may not have matched any tracks
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
