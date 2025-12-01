// src/components/explore/PlaylistCard.tsx
import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Music2, Eye, Link2, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import type { PublicPlaylist } from '@/types/publicPlaylist'

/** Platform color classes for badge styling */
const platformColors: Record<string, string> = {
  spotify: "bg-green-100 text-green-800 border-green-200",
  youtube: "bg-red-100 text-red-800 border-red-200",
  amazon: "bg-orange-100 text-orange-800 border-orange-200",
  apple: "bg-pink-100 text-pink-800 border-pink-200",
  jiosaavn: "bg-blue-100 text-blue-800 border-blue-200",
  pandora: "bg-purple-100 text-purple-800 border-purple-200",
};

/** Platform display names mapping */
const platformDisplayNames: Record<string, string> = {
  spotify: "Spotify",
  youtube: "YouTube",
  amazon: "Amazon Music",
  apple: "Apple Music",
  jiosaavn: "JioSaavn",
  pandora: "Pandora",
};

type PlaylistCardProps = {
    playlist: PublicPlaylist
    onViewDetails: (playlist: PublicPlaylist) => void
    onCopyLink: (playlist: PublicPlaylist) => void
}
/** Formats total playlist duration in seconds into h/m string */
function formatDuration(seconds?: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return String(hours) + "h " + String(mins) + "m";
  return String(mins) + "m";
}

/**

PlaylistCard:

Shows a public playlist card with cover, platform, genre, and track count.

Exposes callbacks to view details and copy share link.
*/
export default function PlaylistCard({
  playlist,
  onViewDetails,
  onCopyLink,
}: PlaylistCardProps) {
  const platformClass =
    platformColors[playlist.platform] ||
    "bg-gray-100 text-gray-800 border-gray-200";

  const platformName = platformDisplayNames[playlist.platform] || playlist.platform;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        duration: 0.2,
        type: "spring",
        stiffness: 400,
        damping: 25
      }}
      style={{ willChange: 'transform' }}
    >
      <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-gray-200 cursor-pointer group">
        {/* Cover image */}
        <div className="relative aspect-square bg-gradient-to-br from-purple-400 via-pink-300 to-blue-400 overflow-hidden">
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
              <Music2 className="w-16 h-16 text-white/80" aria-hidden="true" />
            </div>
          )}

          {/* Hover overlay actions - Always visible on mobile for better UX */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex items-end justify-center pb-3 md:pb-4 gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onViewDetails(playlist)}
                className="bg-white/95 hover:bg-white shadow-lg text-sm md:text-xs py-2 md:py-1.5 px-3 md:px-2 min-h-[44px] md:min-h-0"
              >
                <Eye className="w-4 h-4 md:w-3 md:h-3 mr-1.5 md:mr-1" />
                <span className="md:hidden">View</span>
              </Button>
            </motion.div>

            {playlist.isPublic && (
              <motion.div 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCopyLink(playlist);
                  }}
                  className="bg-white/95 hover:bg-white shadow-lg min-h-[44px] md:min-h-0 w-[44px] md:w-auto"
                  aria-label="Copy share link"
                >
                  <Link2 className="w-4 h-4 md:w-3 md:h-3" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Content */}
        <CardContent className="p-4">
          <h3
            className="font-bold text-lg text-gray-900 truncate mb-2"
            title={playlist.title}
          >
            {playlist.title}
          </h3>

          <p className="text-sm text-gray-600 mb-3 truncate">
            by {playlist.ownerName || "Anonymous"}
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            <Badge className={platformClass + " border text-xs"}>
              {platformName}
            </Badge>
            {playlist.genre && (
              <Badge variant="outline" className="text-xs">
                {playlist.genre}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Music2 className="w-4 h-4" aria-hidden="true" />
              {playlist.trackCount} tracks
            </span>

            {playlist.totalDurationSec && playlist.totalDurationSec > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" aria-hidden="true" />
                {formatDuration(playlist.totalDurationSec)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
