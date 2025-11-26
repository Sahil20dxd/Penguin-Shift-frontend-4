// src/components/profile/AllPublicPlaylists.tsx
// Admin view to see all public playlists (similar to explore page)

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Globe,
  Music2,
  AlertCircle,
  Loader2,
  Calendar,
  User,
  Search,
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/useToast";
import { getExplorePublicPlaylists } from "@/api/publicPlaylists";
import type { PublicPlaylist } from "@/types/publicPlaylist";
import { format } from "date-fns";

export default function AllPublicPlaylists() {
  const { showToast, Toast } = useToast();
  const [playlists, setPlaylists] = useState<PublicPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getExplorePublicPlaylists();
      setPlaylists(data);
    } catch (err: any) {
      console.error("Failed to fetch public playlists:", err);
      setError(err.message || "Failed to load public playlists. Please try again later.");
      showToast(err.message || "Failed to load public playlists", "error");
    } finally {
      setLoading(false);
    }
  };

  const filteredPlaylists = playlists.filter((playlist) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      playlist.title.toLowerCase().includes(query) ||
      playlist.ownerName?.toLowerCase().includes(query) ||
      playlist.genre?.toLowerCase().includes(query)
    );
  });

  const getPlatformBadge = (platform: string) => {
    const colors: Record<string, string> = {
      spotify: "bg-green-100 text-green-800",
      youtube: "bg-red-100 text-red-800",
    };
    return (
      <Badge className={colors[platform] || "bg-gray-100 text-gray-800"}>
        {platform === "spotify" ? "🎵 Spotify" : "▶️ YouTube"}
      </Badge>
    );
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className='mb-6 hidden md:block'>
        <div className='flex items-center gap-2 mb-4'>
          <Globe className='w-5 h-5 text-gray-600' />
          <h2 className='text-2xl font-bold text-gray-900'>All Public Playlists</h2>
        </div>
        <p className='text-gray-600'>View all public playlists in the system.</p>
      </motion.div>

      <Card className='bg-white shadow-lg rounded-2xl overflow-hidden'>
        <CardHeader className='border-b border-gray-100 p-6'>
          <div className="flex items-center justify-between">
            <CardTitle className='text-xl font-semibold text-gray-900'>Public Playlists</CardTitle>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search playlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchPlaylists}
                disabled={loading}
              >
                <Loader2 className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className='p-0'>
          {loading ? (
            <div className='flex items-center justify-center p-8'>
              <Loader2 className='w-6 h-6 animate-spin text-purple-600' />
              <span className='ml-2 text-gray-600'>Loading playlists...</span>
            </div>
          ) : error ? (
            <div className='flex items-center justify-center p-8 text-red-600'>
              <AlertCircle className='w-5 h-5 mr-2' />
              <span>{error}</span>
            </div>
          ) : filteredPlaylists.length === 0 ? (
            <div className='flex flex-col items-center justify-center p-8 text-gray-500'>
              <Music2 className='w-12 h-12 mb-4' />
              <p className='text-lg font-medium'>
                {searchQuery ? 'No playlists found matching your search.' : 'No public playlists found.'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="p-6 space-y-4">
                {filteredPlaylists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{playlist.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{playlist.ownerName || "Anonymous"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Music2 className="w-4 h-4" />
                            <span>{playlist.trackCount} tracks</span>
                          </div>
                          {playlist.created_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{format(new Date(playlist.created_date), 'MMM dd, yyyy')}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {getPlatformBadge(playlist.platform)}
                          {playlist.genre && (
                            <Badge variant="outline">{playlist.genre}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {Toast}
    </>
  );
}

