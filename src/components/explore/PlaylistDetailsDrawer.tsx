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
import { Music2, Clock, Calendar, Link2, Plus, RefreshCw, AlertCircle, Flag, Loader2, Ban, MessageSquareX, FileX, HelpCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/useToast";
import type { PublicPlaylist } from "@/types/publicPlaylist";
import { getTransferHistoryTracksByTransferId } from "@/api/transferHistory";
import { reportPlaylist } from "@/api/publicPlaylists";
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
  const { showToast, Toast } = useToast();
  const [tracks, setTracks] = useState<TransferHistoryTrackResponse[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [tracksError, setTracksError] = useState<string | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState<string>("");
  const [reportDetails, setReportDetails] = useState<string>("");
  const [reporting, setReporting] = useState(false);

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

  const handleReportPlaylist = async () => {
    if (!playlist) {
      showToast('Playlist information is missing', 'error');
      return;
    }

    if (!reportReason) {
      showToast('Please select a reason for reporting', 'error');
      return;
    }

    setReporting(true);
    try {
      await reportPlaylist(playlist.id, {
        reason: reportReason as 'OFFENSIVE' | 'SPAM' | 'WRONG_TAGS' | 'OTHER',
        details: reportDetails.trim() || undefined,
      });
      showToast('Playlist reported successfully. Thank you for helping keep our community safe.', 'success');
      setReportDialogOpen(false);
      setReportReason('');
      setReportDetails('');
    } catch (error: any) {
      console.error('Failed to report playlist:', error);
      showToast(error.message || 'Failed to report playlist. Please try again.', 'error');
    } finally {
      setReporting(false);
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

            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  aria-label="Report playlist"
                  className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                >
                  <Flag className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-red-100 rounded-full">
                      <Flag className="w-5 h-5 text-red-600" />
                    </div>
                    <DialogTitle className="text-2xl">Report Playlist</DialogTitle>
                  </div>
                  <DialogDescription className="text-base pt-2">
                    We take reports seriously. Help us maintain a safe and respectful community by reporting content that violates our guidelines.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-5 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="report-reason" className="text-sm font-semibold flex items-center gap-1">
                      Why are you reporting this playlist? <span className="text-red-500">*</span>
                    </Label>
                    <Select value={reportReason} onValueChange={setReportReason}>
                      <SelectTrigger id="report-reason" className="h-11">
                        <SelectValue placeholder="Choose a reason..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] w-[var(--radix-select-trigger-width)] bg-white border border-gray-200 shadow-lg">
                        <SelectItem value="OFFENSIVE" className="py-3 cursor-pointer focus:bg-red-50 bg-white hover:bg-red-50">
                          <div className="flex items-start gap-3 w-full">
                            <div className="p-1.5 bg-red-100 rounded-md mt-0.5 flex-shrink-0">
                              <Ban className="w-4 h-4 text-red-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900">Offensive Content</div>
                              <div className="text-xs text-gray-600 mt-0.5">Contains harmful, hateful, or inappropriate material</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="SPAM" className="py-3 cursor-pointer focus:bg-orange-50 bg-white hover:bg-orange-50">
                          <div className="flex items-start gap-3 w-full">
                            <div className="p-1.5 bg-orange-100 rounded-md mt-0.5 flex-shrink-0">
                              <MessageSquareX className="w-4 h-4 text-orange-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900">Spam or Commercial</div>
                              <div className="text-xs text-gray-600 mt-0.5">Repetitive, misleading, or promotional content</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="WRONG_TAGS" className="py-3 cursor-pointer focus:bg-yellow-50 bg-white hover:bg-yellow-50">
                          <div className="flex items-start gap-3 w-full">
                            <div className="p-1.5 bg-yellow-100 rounded-md mt-0.5 flex-shrink-0">
                              <FileX className="w-4 h-4 text-yellow-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900">Incorrect Tags or Genre</div>
                              <div className="text-xs text-gray-600 mt-0.5">Playlist is mislabeled or incorrectly categorized</div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="OTHER" className="py-3 cursor-pointer focus:bg-blue-50 bg-white hover:bg-blue-50">
                          <div className="flex items-start gap-3 w-full">
                            <div className="p-1.5 bg-blue-100 rounded-md mt-0.5 flex-shrink-0">
                              <HelpCircle className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900">Other Issue</div>
                              <div className="text-xs text-gray-600 mt-0.5">Something else that doesn't fit the above categories</div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {reportReason && (
                      <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-xs text-blue-800">
                          {reportReason === 'OFFENSIVE' && 'Thank you for reporting. We review offensive content reports within 24 hours.'}
                          {reportReason === 'SPAM' && 'Spam reports help us maintain quality. Your report will be reviewed promptly.'}
                          {reportReason === 'WRONG_TAGS' && 'We appreciate your help in keeping playlists properly categorized.'}
                          {reportReason === 'OTHER' && 'Please provide details below to help us understand the issue better.'}
                        </p>
                      </div>
                    )}
                    {!reportReason && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Please select a reason to continue
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="report-details" className="text-sm font-semibold">
                      Additional Information <span className="text-gray-400 font-normal">(Optional but helpful)</span>
                    </Label>
                    <Textarea
                      id="report-details"
                      placeholder="Tell us more about the issue... (e.g., specific tracks, timestamps, or details that would help our team review)"
                      value={reportDetails}
                      onChange={(e) => setReportDetails(e.target.value)}
                      rows={5}
                      maxLength={500}
                      className="resize-none text-sm"
                    />
                   
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setReportDialogOpen(false);
                      setReportReason('');
                      setReportDetails('');
                    }}
                    disabled={reporting}
                    className="flex-1 sm:flex-initial"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleReportPlaylist}
                    disabled={!reportReason || reporting}
                    className={`flex-1 sm:flex-initial ${
                      reportReason && !reporting
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {reporting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Flag className="w-4 h-4 mr-2" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
        {Toast}
      </SheetContent>
    </Sheet>
  );
}
