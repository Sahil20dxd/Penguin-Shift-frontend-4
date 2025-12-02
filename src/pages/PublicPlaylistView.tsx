// src/pages/PublicPlaylistView.tsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Music2, Clock, Calendar, Link2, Plus, ArrowLeft, Loader2, AlertCircle, Flag } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/useToast";
import { usePageTitle } from "@/hooks/usePageTitle";
import { SEOHead } from "@/components/SEOHead";
import type { PublicPlaylist } from "@/types/publicPlaylist";
import { getPublicPlaylistById, getPublicPlaylistTracks } from "@/api/publicPlaylists";
import { motion } from "framer-motion";
import { format } from 'date-fns';
import { getErrorMessage } from "@/utils/userMessages";

// Platform-specific badge colors
const platformColors: Record<string, string> = {
  spotify: "bg-green-100 text-green-800 border-green-200",
  youtube: "bg-red-100 text-red-800 border-red-200",
  amazon: "bg-orange-100 text-orange-800 border-orange-200",
  apple: "bg-pink-100 text-pink-800 border-pink-200",
  jiosaavn: "bg-blue-100 text-blue-800 border-blue-200",
  pandora: "bg-purple-100 text-purple-800 border-purple-200",
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

export default function PublicPlaylistView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast, Toast } = useToast();
  const [playlist, setPlaylist] = useState<PublicPlaylist | null>(null);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tracksError, setTracksError] = useState<string | null>(null);

  usePageTitle(playlist ? `${playlist.title} - Public Playlist` : 'Public Playlist');

  // Fetch playlist data
  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!id) {
        setError("Invalid playlist ID");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const playlistData = await getPublicPlaylistById(id);
        setPlaylist(playlistData);
      } catch (err: any) {
        console.error('[PublicPlaylistView] Error fetching playlist:', err);
        const friendlyError = getErrorMessage(err, 'load playlist');
        setError(friendlyError);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [id]);

  // Fetch tracks when playlist is loaded
  useEffect(() => {
    const fetchTracks = async () => {
      if (!playlist?.id) {
        console.log('[PublicPlaylistView] No playlist ID, skipping track fetch');
        return;
      }

      setLoadingTracks(true);
      setTracksError(null);
      setTracks([]);

      try {
        console.log('[PublicPlaylistView] Fetching tracks for public playlist ID:', playlist.id);
        const fetchedTracks = await getPublicPlaylistTracks(playlist.id);
        console.log('[PublicPlaylistView] Successfully fetched tracks:', fetchedTracks.length);
        setTracks(fetchedTracks);
      } catch (error: any) {
        console.error('[PublicPlaylistView] Error fetching tracks:', error);
        const friendlyError = getErrorMessage(error, 'load tracks');
        setTracksError(friendlyError);
      } finally {
        setLoadingTracks(false);
      }
    };

    if (playlist) {
      fetchTracks();
    }
  }, [playlist]);

  const handleCopyLink = () => {
    if (!playlist) return;
    const url = playlist.publicUrl || `${window.location.origin}/p/${playlist.id}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => showToast("Link copied to clipboard!", "success"))
        .catch(() => showToast("Failed to copy link", "error"));
    } else {
      showToast("Clipboard not available in this browser", "error");
    }
  };

  const handleAddToLibrary = () => {
    if (!playlist) return;
    console.log('[PublicPlaylistView] Add to library clicked for playlist:', playlist.title);
    console.log('[PublicPlaylistView] Including tracks:', tracks.length);

    // Convert tracks to format expected by PublicPlaylistDestination
    const formattedTracks = tracks.map(track => ({
      destinationTrackTitle: track.title,
      destinationTrackArtist: track.artist,
      destinationTrackDurationSec: track.durationSec,
      sourceTrackTitle: track.title,
      sourceTrackArtist: track.artist,
    }));

    // Navigate to the public playlist destination page with the selected playlist data and tracks
    navigate('/shift/public-destination', {
      state: {
        playlist,
        tracks: formattedTracks
      },
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"
          />
          <p className="text-lg text-gray-600 font-medium">Loading playlist...</p>
        </motion.div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <>
        <SEOHead
          title="Playlist Not Found - PenguinShift"
          description="The requested playlist could not be found or is not publicly accessible."
          url={typeof window !== "undefined" ? window.location.href : ""}
        />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-md"
          >
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Playlist Not Found</h1>
            <p className="text-gray-600 mb-6">{error || "The playlist you're looking for doesn't exist or is not publicly accessible."}</p>
            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/explore')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Explore
              </Button>
              <Button onClick={() => navigate('/')}>
                Go Home
              </Button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  const platformName = platformDisplayNames[playlist.platform] || playlist.platform;
  const platformClass = platformColors[playlist.platform] || "bg-gray-100 text-gray-800 border-gray-200";

  return (
    <>
      <SEOHead
        title={`${playlist.title} - Public Playlist - PenguinShift`}
        description={playlist.description || `Public playlist by ${playlist.ownerName} on ${platformName}`}
        url={typeof window !== "undefined" ? window.location.href : ""}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button
              variant="ghost"
              onClick={() => navigate('/explore')}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Explore
            </Button>
          </motion.div>

          {/* Playlist Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden mb-6"
          >
            {/* Cover Image */}
            <div className="relative h-64 md:h-80 bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400">
              {playlist.coverUrl ? (
                <img
                  src={playlist.coverUrl}
                  alt={playlist.title + " cover"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Music2 className="w-24 h-24 text-white/80" />
                </div>
              )}
            </div>

            {/* Playlist Info */}
            <div className="p-6 md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 break-words">
                    {playlist.title}
                  </h1>
                  <p className="text-lg text-gray-600 mb-4">
                    by {playlist.ownerName || "Anonymous"}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge className={platformClass + " border text-sm"}>
                  {platformName}
                </Badge>
                {playlist.genre && (
                  <Badge variant="outline" className="text-sm">
                    {playlist.genre}
                  </Badge>
                )}
              </div>

              {/* Description */}
              {playlist.description && (
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {playlist.description}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-6">
                <span className="flex items-center gap-2">
                  <Music2 className="w-4 h-4" />
                  {playlist.trackCount || 0} tracks
                </span>
                {playlist.totalDurationSec && playlist.totalDurationSec > 0 && (
                  <span className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {formatTotalDuration(playlist.totalDurationSec)}
                  </span>
                )}
                {playlist.created_date && (
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(playlist.created_date), 'MMM d, yyyy')}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={handleAddToLibrary}
                  className="bg-gradient-to-r from-purple-600 to-indigo-500 hover:from-purple-700 hover:to-indigo-600 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Library
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCopyLink}
                  className="border-gray-300"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Tracks Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          >
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tracks</h2>

              {loadingTracks ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
                </div>
              ) : tracksError ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">{tracksError}</p>
                </div>
              ) : tracks.length === 0 ? (
                <div className="text-center py-12">
                  <Music2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No tracks available</p>
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-2">
                    {tracks.map((track, index) => (
                      <motion.div
                        key={track.id || index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-gray-400 font-mono text-sm w-8">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {track.title || 'Unknown Track'}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {track.artist || 'Unknown Artist'}
                          </p>
                        </div>
                        {track.durationSec && (
                          <span className="text-sm text-gray-500">
                            {formatDuration(track.durationSec)}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      {Toast}
    </>
  );
}

