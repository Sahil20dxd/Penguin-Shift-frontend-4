// src/components/profile/FlaggedPlaylists.tsx
// Admin view to see all flagged playlists with report messages

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Flag,
  AlertCircle,
  Loader2,
  Eye,
  RefreshCw,
  User,
  Mail,
  Calendar,
  MessageSquare,
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/useToast";
import {
  getFlaggedPlaylists,
  getPlaylistDetails,
  type FlaggedPlaylist,
} from "@/api/adminModeration";
import { format } from "date-fns";

export default function FlaggedPlaylists() {
  const { showToast, Toast } = useToast();
  const [playlists, setPlaylists] = useState<FlaggedPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaylist, setSelectedPlaylist] = useState<FlaggedPlaylist | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchFlaggedPlaylists();
  }, []);

  const fetchFlaggedPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getFlaggedPlaylists();
      setPlaylists(data.playlists || []);
    } catch (err: any) {
      console.error("Failed to fetch flagged playlists:", err);
      setError(err.message || "Failed to load flagged playlists. Please try again later.");
      showToast(err.message || "Failed to load flagged playlists", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (playlist: FlaggedPlaylist) => {
    setSelectedPlaylist(playlist);
    setSheetOpen(true);
    try {
      const details = await getPlaylistDetails(playlist.id);
      setSelectedPlaylist(details);
    } catch (err) {
      console.error("Failed to fetch playlist details:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "HIDDEN":
        return <Badge className="bg-red-100 text-red-800">Hidden</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPlatformBadge = (platform: string) => {
    return (
      <Badge variant="outline" className="capitalize">
        {platform === "spotify" ? "🎵 Spotify" : "▶️ YouTube"}
      </Badge>
    );
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-6 hidden md:block'>
        <div className='flex items-center gap-2 mb-4'>
          <Flag className='w-5 h-5 text-gray-600' />
          <h2 className='text-2xl font-bold text-gray-900'>Flagged Playlists</h2>
        </div>
        <p className='text-gray-600'>Review playlists that have been reported by users.</p>
      </motion.div>

      <Card className='bg-white shadow-lg rounded-2xl overflow-hidden'>
        <CardHeader className='border-b border-gray-100 p-6'>
          <div className="flex items-center justify-between">
            <CardTitle className='text-xl font-semibold text-gray-900'>Flagged Playlists</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFlaggedPlaylists}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className='p-0'>
          {loading ? (
            <div className='flex items-center justify-center p-8'>
              <Loader2 className='w-6 h-6 animate-spin text-purple-600' />
              <span className='ml-2 text-gray-600'>Loading flagged playlists...</span>
            </div>
          ) : error ? (
            <div className='flex items-center justify-center p-8 text-red-600'>
              <AlertCircle className='w-5 h-5 mr-2' />
              <span>{error}</span>
            </div>
          ) : playlists.length === 0 ? (
            <div className='flex flex-col items-center justify-center p-8 text-gray-500'>
              <Flag className='w-12 h-12 mb-4' />
              <p className='text-lg font-medium'>No flagged playlists found.</p>
              <p className='text-sm mt-2'>All playlists are clean!</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-semibold">Playlist Name</TableHead>
                    <TableHead className="font-semibold">Owner</TableHead>
                    <TableHead className="font-semibold">Platform</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Reports</TableHead>
                    <TableHead className="font-semibold">Flag Reasons</TableHead>
                    <TableHead className="font-semibold">Last Flagged</TableHead>
                    <TableHead className="font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {playlists.map((playlist) => (
                    <TableRow key={playlist.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{playlist.playlistName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{playlist.ownerUsername}</span>
                          <span className="text-xs text-gray-500">{playlist.ownerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getPlatformBadge(playlist.platform)}</TableCell>
                      <TableCell>{getStatusBadge(playlist.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          {playlist.reportCount} {playlist.reportCount === 1 ? "report" : "reports"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {playlist.flagReasons?.slice(0, 2).map((reason, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {reason}
                            </Badge>
                          ))}
                          {playlist.flagReasons && playlist.flagReasons.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{playlist.flagReasons.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {format(new Date(playlist.lastFlaggedAt), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(playlist)}
                          className="h-8"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Playlist Details Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Flagged Playlist Details</SheetTitle>
            <SheetDescription>
              Review playlist information and report details
            </SheetDescription>
          </SheetHeader>

          {selectedPlaylist && (
            <ScrollArea className="mt-6">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Music2 className="w-5 h-5" />
                    Playlist Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Name:</span>
                      <p className="text-base font-semibold">{selectedPlaylist.playlistName}</p>
                    </div>
                    {selectedPlaylist.description && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Description:</span>
                        <p className="text-base">{selectedPlaylist.description}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Platform:</span>
                        <div className="mt-1">{getPlatformBadge(selectedPlaylist.platform)}</div>
                      </div>
                      {selectedPlaylist.genre && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Genre:</span>
                          <p className="text-base">{selectedPlaylist.genre}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Status:</span>
                      <div className="mt-1">{getStatusBadge(selectedPlaylist.status)}</div>
                    </div>
                  </div>
                </div>

                {/* Owner Info */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Owner Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Username:</span>
                      <p className="text-base">{selectedPlaylist.ownerUsername}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Email:</span>
                      <p className="text-base">{selectedPlaylist.ownerEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Report Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Report Information
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Report Count:</span>
                      <p className="text-base font-semibold text-orange-600">
                        {selectedPlaylist.reportCount} {selectedPlaylist.reportCount === 1 ? "report" : "reports"}
                      </p>
                    </div>
                    {selectedPlaylist.flagReasons && selectedPlaylist.flagReasons.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-600">Flag Reasons:</span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedPlaylist.flagReasons.map((reason, idx) => (
                            <Badge key={idx} variant="outline" className="bg-orange-50 text-orange-700">
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Report Messages */}
                    {selectedPlaylist.reportDetails && selectedPlaylist.reportDetails.length > 0 && (
                      <div>
                        <span className="text-sm font-medium text-gray-600 mb-2 block">Report Messages:</span>
                        <div className="space-y-3">
                          {selectedPlaylist.reportDetails.map((report, idx) => (
                            <div key={report.id || idx} className="border rounded-lg p-3 bg-orange-50">
                              <div className="flex items-start justify-between mb-2">
                                <Badge variant="outline" className="bg-white">
                                  {report.reason}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(report.createdAt), "MMM dd, yyyy HH:mm")}
                                </span>
                              </div>
                              {report.details && (
                                <p className="text-sm text-gray-700 mt-2">{report.details}</p>
                              )}
                              {!report.details && (
                                <p className="text-xs text-gray-500 italic">No additional details provided</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {format(new Date(selectedPlaylist.createdAt), "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>Last Flagged: {format(new Date(selectedPlaylist.lastFlaggedAt), "MMM dd, yyyy")}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetContent>
      </Sheet>

      {Toast}
    </>
  );
}

