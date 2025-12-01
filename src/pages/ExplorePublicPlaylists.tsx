// src/pages/ExplorePublicPlaylists.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonPlaylistCard } from "@/components/ui/skeleton-loader";
import { AnimatePresence, motion } from "framer-motion";
import { SearchX } from "lucide-react";
import { getExplorePublicPlaylists, type PaginatedPlaylistsResponse } from "@/api/publicPlaylists";
import SearchBar from "@/components/explore/SearchBar";
import FiltersBar from "@/components/explore/FiltersBar";
import AppliedFiltersChips from "@/components/explore/AppliedFiltersChips";
import PlaylistCard from "@/components/explore/PlaylistCard";
import Pagination from "@/components/explore/Pagination";
import PlaylistDetailsDrawer from "@/components/explore/PlaylistDetailsDrawer";
import type { PublicPlaylist } from "@/types/publicPlaylist";

type FiltersState = {
  platform: string;
  genre: string;
  sort: "recent" | "tracks" | "a-z";
  minTracks: string;
  maxTracks: string;
  createdFrom: string;
};

type FilterKey = keyof FiltersState;

/**
 * Simple debounce helper for search input.
 */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function ExplorePublicPlaylists() {
  usePageTitle('Explore Public Playlists');
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<PublicPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebouncedValue(searchQuery, 300);

  const [filters, setFilters] = useState<FiltersState>({
    platform: "all",
    genre: "all",
    sort: "recent",
    minTracks: "",
    maxTracks: "",
    createdFrom: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPlaylist, setSelectedPlaylist] =
    useState<PublicPlaylist | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const pageSize = 24; // cards per page

  // Fetch playlists with server-side pagination, filtering, and sorting
  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetchPlaylists = async () => {
      try {
        const options = {
          page: currentPage,
          limit: pageSize,
          search: debouncedSearch || undefined,
          platform: filters.platform !== "all" ? filters.platform : undefined,
          genre: filters.genre !== "all" ? filters.genre : undefined,
          minTracks: filters.minTracks ? parseInt(filters.minTracks, 10) : undefined,
          maxTracks: filters.maxTracks ? parseInt(filters.maxTracks, 10) : undefined,
          createdFrom: filters.createdFrom || undefined,
          sort: filters.sort,
        };

        const result = await getExplorePublicPlaylists(options);

        // Check if result is paginated response or plain array (backward compatible)
        if (result && typeof result === 'object' && 'playlists' in result && 'total' in result) {
          // Paginated response
          const paginated = result as PaginatedPlaylistsResponse;
          setPlaylists(paginated.playlists);
          setTotalResults(paginated.total);
          setTotalPages(paginated.totalPages);
          console.log('[Explore] Received paginated playlists:', paginated.playlists.length, 'of', paginated.total);
        } else if (Array.isArray(result)) {
          // Backward compatible: plain array response (fallback)
          setPlaylists(result);
          setTotalResults(result.length);
          setTotalPages(Math.max(1, Math.ceil(result.length / pageSize)));
          console.log('[Explore] Received all playlists (backward compatible):', result.length);
        } else {
          console.warn('[Explore] Unexpected response format:', typeof result);
          setPlaylists([]);
          setTotalResults(0);
          setTotalPages(1);
        }

        setLoading(false);
      } catch (err: any) {
        console.error('[Explore] Failed to load public playlists:', err);

        // Provide specific error messages based on error type
        let errorMessage = "Failed to load public playlists. ";

        if (err.message.includes('401')) {
          errorMessage += "Authentication issue detected. This endpoint should be public.";
        } else if (err.message.includes('404')) {
          errorMessage += "Backend endpoint not found. Please check backend configuration.";
        } else if (err.message.includes('500')) {
          errorMessage += "Server error. Please try again later or contact support.";
        } else if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
          errorMessage += "Cannot connect to backend. Please check if backend is running.";
        } else {
          errorMessage += err.message;
        }

        setError(errorMessage);
        setPlaylists([]);
        setTotalResults(0);
        setTotalPages(1);
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [currentPage, debouncedSearch, filters, pageSize]);

  // Reset page when filters or search change (but not on initial load)
  // This must be a separate effect to maintain hook order
  useEffect(() => {
    // Only reset if we're not already on page 1 to avoid unnecessary re-renders
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, filters.platform, filters.genre, filters.minTracks, filters.maxTracks, filters.createdFrom, filters.sort]);

  // Use playlists directly (already paginated from server)
  const paginatedPlaylists = playlists;

  // Auto-hide toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(""), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const handleFilterChange = (key: FilterKey, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleRemoveFilter = (key: FilterKey) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === "platform" || key === "genre" ? "all" : "",
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      platform: "all",
      genre: "all",
      sort: "recent",
      minTracks: "",
      maxTracks: "",
      createdFrom: "",
    });
    setSearchQuery("");
  };

  const handleViewDetails = (playlist: PublicPlaylist) => {
    setSelectedPlaylist(playlist);
    setIsDrawerOpen(true);
  };

  const buildShareUrl = (playlistId: number | string) => {
    const base = window.location.origin;
    return base + "/p/" + String(playlistId);
  };

  const handleCopyLink = (playlist: PublicPlaylist) => {
    const url = playlist.publicUrl || buildShareUrl(playlist.id);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => setToastMessage("Link copied to clipboard!"))
        .catch(() => setToastMessage("Failed to copy link"));
    } else {
      setToastMessage("Clipboard not available in this browser");
    }
  };

  const handleAddToLibrary = (playlist: PublicPlaylist, tracks: any[]) => {
    console.log('[Explore] Add to library clicked for playlist:', playlist.title);
    console.log('[Explore] Including tracks:', tracks.length);

    // Close the drawer so the new page shows clearly
    setIsDrawerOpen(false);

    // Go to the public playlist destination page with the selected playlist data and tracks
    navigate('/shift/public-destination', {
      state: {
        playlist,
        tracks
      },
    });
  };

  return (
    <>
      <SEOHead
        title="Explore Public Playlists - PenguinShift"
        description="Discover and share music playlists from the PenguinShift community. Browse public playlists across different platforms."
        url={typeof window !== "undefined" ? window.location.href : ""}
      />
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30 p-4 md:p-6"
      >
      <div className="max-w-7xl mx-auto">
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-4 md:px-6 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2 text-sm md:text-base max-w-[90vw]">
            {toastMessage}
          </div>
        )}

        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-2">
            Explore Public Playlists
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Discover and share playlists from the PenguinShift community
          </p>
        </div>

        <div className="mb-6">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery("")}
          />
        </div>

        <div className="mb-6">
          <FiltersBar filters={filters} onFilterChange={handleFilterChange} />
        </div>

        <AppliedFiltersChips
          filters={filters}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearFilters}
        />

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-6 p-4 md:p-6 bg-gradient-to-r from-red-50 to-orange-50 border-l-4 border-red-500 rounded-lg shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 text-sm font-bold">!</span>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-red-800 font-semibold mb-1">Error loading playlists</p>
                <p className="text-red-600 text-sm">{error}</p>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-3"
                >
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Retry
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="mb-4 text-sm text-gray-600">
          {loading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            totalResults +
            " playlist" +
            (totalResults !== 1 ? "s" : "") +
            " found"
          )}
        </div>

        {loading && playlists.length === 0 && (
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
          >
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <motion.div
                  key={i}
                  variants={{
                    hidden: { opacity: 0, scale: 0.9 },
                    visible: { opacity: 1, scale: 1 }
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <SkeletonPlaylistCard />
                </motion.div>
              ))}
          </motion.div>
        )}

        {!loading && paginatedPlaylists.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <motion.div 
              className="mb-6"
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
            >
              <SearchX
                className="w-20 h-20 text-gray-300 mx-auto"
                aria-hidden="true"
              />
            </motion.div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No playlists found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or search query
            </p>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button onClick={handleClearFilters} variant="outline">
                Clear all filters
              </Button>
            </motion.div>
          </motion.div>
        )}

        {!loading && paginatedPlaylists.length > 0 && (
          <>
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.03
                  }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
            >
              <AnimatePresence mode="popLayout">
                {paginatedPlaylists.map((playlist, index) => (
                  <motion.div
                    key={playlist.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                    transition={{ 
                      duration: 0.25,
                      type: "spring",
                      stiffness: 400,
                      damping: 30
                    }}
                    layout
                  >
                    <PlaylistCard
                      playlist={playlist}
                      onViewDetails={handleViewDetails}
                      onCopyLink={handleCopyLink}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>

            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalResults={totalResults}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
              />
            )}
          </>
        )}

        <PlaylistDetailsDrawer
          playlist={selectedPlaylist}
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onCopyLink={handleCopyLink}
          onAddToLibrary={handleAddToLibrary}
        />
      </div>
    </motion.div>
    </>
  );
}
