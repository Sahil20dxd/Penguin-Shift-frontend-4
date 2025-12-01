import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ExternalLink,
  Lightbulb,
  ChevronDown,
  Music2,
  AlertCircle,
  Loader2,
  Globe,
  Download,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { getTransferHistory, getTransferHistoryTracks, downloadTransferHistoryCSV, downloadTransferHistoryPDF, toggleTransferHistoryVisibility } from "@/api/transferHistory";
import type { TransferHistoryResponse, TransferHistoryTrackResponse } from "@/types/transferHistory";

export default function MyHistory() {
  const [transfers, setTransfers] = useState<TransferHistoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferHistoryResponse | null>(null);
  const [tracks, setTracks] = useState<TransferHistoryTrackResponse[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetchTransferHistory();
  }, []);

  const fetchTransferHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTransferHistory();
      setTransfers(data);
    } catch (err) {
      console.error("Failed to fetch transfer history:", err);
      setError("Failed to load transfer history. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (transfer: TransferHistoryResponse) => {
    setSelectedTransfer(transfer);
    setSheetOpen(true);
    setLoadingTracks(true);

    try {
      const trackData = await getTransferHistoryTracks(transfer.id);
      setTracks(trackData);
    } catch (err) {
      console.error("Failed to fetch tracks:", err);
      setTracks([]);
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleDownloadCSV = async (transfer: TransferHistoryResponse, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await downloadTransferHistoryCSV(transfer.id);
    } catch (err: any) {
      console.error("[MyHistory] Failed to download CSV:", err);
      const errorMessage = err.message || "Failed to download CSV file. Please try again.";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleDownloadPDF = async (transfer: TransferHistoryResponse, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    try {
      await downloadTransferHistoryPDF(transfer.id);
    } catch (err: any) {
      console.error("[MyHistory] Failed to download PDF:", err);
      const errorMessage = err.message || "Failed to download PDF file. Please try again.";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  const getPlatformIcon = (platform: string) => {
    const platformLower = platform.toLowerCase();
    if (platformLower === "spotify") {
      return "🎵";
    } else if (platformLower === "youtube") {
      return "▶️";
    }
    return "🎧";
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getMatchPercentage = (matched: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((matched / total) * 100);
  };

  const handleToggleVisibility = async (transfer: TransferHistoryResponse, newIsPublic: boolean) => {
    const transferId = transfer.id;
    
    // Add to toggling set
    setTogglingIds(prev => new Set(prev).add(transferId));
    
    try {
      const updated = await toggleTransferHistoryVisibility(transferId, newIsPublic);
      
      // Update the transfer in the list
      setTransfers(prev => prev.map(t => t.id === transferId ? updated : t));
      
      // Show success message
      setError(null);
    } catch (err: any) {
      console.error("Failed to toggle visibility:", err);
      setError(err.message || "Failed to toggle playlist visibility. Please try again.");
      setTimeout(() => setError(null), 5000);
    } finally {
      // Remove from toggling set
      setTogglingIds(prev => {
        const next = new Set(prev);
        next.delete(transferId);
        return next;
      });
    }
  };

  return (
    <div>
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 hidden md:block"
      >
        <div className="flex items-center gap-2 mb-4">
          <ChevronDown className="w-5 h-5 text-gray-600" />
          <h2 className="text-2xl font-bold text-gray-900">My History</h2>
        </div>
        <p className="text-gray-600">
          View and manage your transferred playlists
        </p>
      </motion.div>

      <Card className="bg-white shadow-lg rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-gray-100 p-6">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Transferred Playlists
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Loading transfer history...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center justify-center py-12 px-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
              <div className="ml-3">
                <p className="text-red-600 font-medium">Error</p>
                <p className="text-gray-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && transfers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Music2 className="w-16 h-16 text-gray-300 mb-4" />
              <p className="text-gray-600 font-medium text-lg mb-2">No Transfer History</p>
              <p className="text-gray-500 text-sm text-center max-w-md">
                You haven't transferred any playlists yet. Start by transferring a playlist from Spotify to YouTube or vice versa!
              </p>
            </div>
          )}

          {/* Desktop Table View */}
          {!loading && !error && transfers.length > 0 && (
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-16"></TableHead>
                    <TableHead className="font-semibold">Transfer Details</TableHead>
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Match Rate</TableHead>
                    <TableHead className="font-semibold">Visibility</TableHead>
                    <TableHead className="text-right font-semibold pr-6">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((transfer) => (
                    <TableRow key={transfer.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                          {getPlatformIcon(transfer.sourcePlatform)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">
                              {transfer.destinationPlaylistName}
                            </p>
                            {transfer.isPublic && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                <Globe className="w-3 h-3 mr-1" />
                                Public
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{getPlatformIcon(transfer.sourcePlatform)} {transfer.sourcePlatform}</span>
                            <span>→</span>
                            <span>{getPlatformIcon(transfer.destinationPlatform)} {transfer.destinationPlatform}</span>
                          </div>
                          <p className="text-xs text-gray-400">
                            From: {transfer.sourcePlaylistName}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {formatDate(transfer.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={getMatchPercentage(transfer.matchedTracks, transfer.totalTracks) >= 80 ? "default" : "secondary"}>
                            {getMatchPercentage(transfer.matchedTracks, transfer.totalTracks)}% matched
                          </Badge>
                          <p className="text-xs text-gray-500">
                            {transfer.matchedTracks}/{transfer.totalTracks} tracks
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={transfer.isPublic || false}
                            onCheckedChange={(checked) => handleToggleVisibility(transfer, checked)}
                            disabled={togglingIds.has(transfer.id)}
                            aria-label={transfer.isPublic ? "Make private" : "Make public"}
                          />
                          <span className="text-sm text-gray-600 font-medium">
                            {transfer.isPublic ? "Public" : "Private"}
                          </span>
                          {togglingIds.has(transfer.id) && (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end items-center gap-2 pr-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-blue-50 hover:text-blue-600 flex items-center gap-1"
                            onClick={() => handleViewDetails(transfer)}
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span className="text-sm">View Details</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-green-50 hover:text-green-600 flex items-center gap-1"
                            onClick={(e) => handleDownloadCSV(transfer, e)}
                            title="Download CSV"
                          >
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">CSV</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-red-50 hover:text-red-600 flex items-center gap-1"
                            onClick={(e) => handleDownloadPDF(transfer, e)}
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                            <span className="text-sm">PDF</span>
                          </Button>
                          {transfer.unmatchedTracks > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="hover:bg-yellow-50 hover:text-yellow-600 flex items-center gap-1"
                              onClick={() => handleViewDetails(transfer)}
                            >
                              <Lightbulb className="w-4 h-4" />
                              <span className="text-sm">Unmatched ({transfer.unmatchedTracks})</span>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Mobile/Tablet Card View */}
          {!loading && !error && transfers.length > 0 && (
            <div className="md:hidden divide-y divide-gray-100">
              {transfers.map((transfer) => (
                <motion.div
                  key={transfer.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center p-4 active:bg-gray-100 hover:bg-gray-50 gap-3 transition-colors duration-150"
                >
                  {/* Platform Icon */}
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-md flex-shrink-0 flex items-center justify-center text-white text-xl">
                    {getPlatformIcon(transfer.sourcePlatform)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {transfer.destinationPlaylistName}
                      </h3>
                      {transfer.isPublic && (
                        <Globe className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {transfer.matchedTracks}/{transfer.totalTracks} tracks matched
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(transfer.createdAt)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Switch
                        checked={transfer.isPublic || false}
                        onCheckedChange={(checked) => handleToggleVisibility(transfer, checked)}
                        disabled={togglingIds.has(transfer.id)}
                        aria-label={transfer.isPublic ? "Make private" : "Make public"}
                      />
                      <span className="text-xs text-gray-600 font-medium">
                        {transfer.isPublic ? "Public" : "Private"}
                      </span>
                      {togglingIds.has(transfer.id) && (
                        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                      )}
                    </div>
                  </div>

                  {/* Right Action Icons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-gray-500 hover:text-blue-600"
                      onClick={() => handleViewDetails(transfer)}
                      title="View Details"
                      aria-label="View transfer details"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-gray-500 hover:text-green-600"
                      onClick={(e) => handleDownloadCSV(transfer, e)}
                      title="Download CSV"
                      aria-label="Download CSV file"
                    >
                      <FileText className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-gray-500 hover:text-red-600"
                      onClick={(e) => handleDownloadPDF(transfer, e)}
                      title="Download PDF"
                      aria-label="Download PDF file"
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                    {transfer.unmatchedTracks > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 text-gray-500 hover:text-yellow-600"
                        onClick={() => handleViewDetails(transfer)}
                        title="View Unmatched"
                        aria-label="View unmatched tracks"
                      >
                        <Lightbulb className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Track Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl bg-white border-l-2 border-gray-300 shadow-2xl">
          <SheetHeader className="border-b border-gray-200 pb-4 mb-4">
            <SheetTitle className="text-2xl font-bold text-gray-900">Transfer Details</SheetTitle>
            {selectedTransfer && (
              <div className="text-gray-700 mt-4">
                <div className="space-y-3 text-left">
                  {selectedTransfer.isPublic && (
                    <div className="flex items-center gap-2 p-3 bg-purple-100 border-2 border-purple-300 rounded-lg mb-3 shadow-sm">
                      <Globe className="w-5 h-5 text-purple-700" />
                      <span className="text-sm font-semibold text-purple-900">
                        This playlist is public and visible in the Explore section
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <span className="font-semibold text-gray-900 min-w-[60px]">From:</span>
                    <span className="text-gray-800">{getPlatformIcon(selectedTransfer.sourcePlatform)} {selectedTransfer.sourcePlaylistName}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <span className="font-semibold text-gray-900 min-w-[60px]">To:</span>
                    <span className="text-gray-800">{getPlatformIcon(selectedTransfer.destinationPlatform)} {selectedTransfer.destinationPlaylistName}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <span className="font-semibold text-gray-900 min-w-[60px]">Date:</span>
                    <span className="text-gray-800">{formatDate(selectedTransfer.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                    <span className="font-semibold text-gray-900 min-w-[60px]">Success Rate:</span>
                    <Badge variant={getMatchPercentage(selectedTransfer.matchedTracks, selectedTransfer.totalTracks) >= 80 ? "default" : "secondary"} className="text-sm font-semibold">
                      {getMatchPercentage(selectedTransfer.matchedTracks, selectedTransfer.totalTracks)}%
                    </Badge>
                    <span className="text-sm text-gray-700 font-medium">
                      ({selectedTransfer.matchedTracks}/{selectedTransfer.totalTracks} tracks)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </SheetHeader>

          <div className="mt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200">Matched Tracks</h3>
            {loadingTracks ? (
              <div className="flex items-center justify-center py-12 bg-gray-50 rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span className="ml-3 text-gray-700 font-medium">Loading tracks...</span>
              </div>
            ) : tracks.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600 font-medium">No track data available</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-3">
                  {tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className="p-4 border-2 border-gray-200 bg-white rounded-lg hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-bold text-gray-500 mt-1 min-w-[24px]">
                          {index + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate text-base">
                            {track.destinationTrackTitle}
                          </p>
                          <p className="text-sm text-gray-700 truncate font-medium mt-1">
                            {track.destinationTrackArtist}
                          </p>
                          {track.sourceTrackTitle !== track.destinationTrackTitle && (
                            <div className="mt-3 pt-3 border-t-2 border-gray-200 bg-gray-50 p-2 rounded">
                              <p className="text-xs text-gray-600 font-medium">
                                Original: {track.sourceTrackTitle}
                              </p>
                              <p className="text-xs text-gray-600">
                                by {track.sourceTrackArtist}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
