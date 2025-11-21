// src/pages/ExplorePublicPlaylists.tsx

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatePresence } from "framer-motion";
import { SearchX } from "lucide-react";
import { getExplorePublicPlaylists } from "@/api/publicPlaylists";
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
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<PublicPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getExplorePublicPlaylists()
      .then((data) => {
        console.log('[Explore] Received playlists from API:', data);
        console.log('[Explore] Total playlists received:', data.length);
        if (data.length > 0) {
          console.log('[Explore] Sample playlist:', data[0]);
        } else {
          console.warn('[Explore] No playlists returned from API. Check backend database.');
        }
        setPlaylists(data);
        setLoading(false);
      })
      .catch((err) => {
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
        setLoading(false);
      });
  }, []);
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
  const isLoading = loading; // no backend yet, so loading is always false

  // Filter and sort playlists
  const filteredPlaylists = useMemo(() => {
    console.log('[Explore] Starting filter with playlists:', playlists.length);
    let result = playlists.filter((p) => p.isPublic === true);
    console.log('[Explore] After isPublic filter:', result.length);

    // Search by title or owner name
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          (p.ownerName && p.ownerName.toLowerCase().includes(query))
      );
      console.log('[Explore] After search filter:', result.length);
    }

    // Platform filter
    if (filters.platform && filters.platform !== "all") {
      result = result.filter((p) => p.platform === filters.platform);
      console.log('[Explore] After platform filter:', result.length);
    }

    // Genre filter
    if (filters.genre && filters.genre !== "all") {
      result = result.filter((p) => p.genre === filters.genre);
      console.log('[Explore] After genre filter:', result.length);
    }

    // Track count filters
    if (filters.minTracks) {
      const min = parseInt(filters.minTracks, 10);
      result = result.filter((p) => (p.trackCount ?? 0) >= min);
    }

    if (filters.maxTracks) {
      const max = parseInt(filters.maxTracks, 10);
      result = result.filter((p) => (p.trackCount ?? 0) <= max);
    }

    // Date filter
    if (filters.createdFrom) {
      const fromDate = new Date(filters.createdFrom);
      result = result.filter((p) => new Date(p.created_date) >= fromDate);
    }

    // Sorting
    switch (filters.sort) {
      case "recent":
        result.sort(
          (a, b) =>
            new Date(b.created_date).getTime() -
            new Date(a.created_date).getTime()
        );
        break;
      case "tracks":
        result.sort((a, b) => (b.trackCount ?? 0) - (a.trackCount ?? 0));
        break;

      case "a-z":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return result;
  }, [playlists, debouncedSearch, filters]);

  // Pagination
  const totalResults = filteredPlaylists.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const paginatedPlaylists = filteredPlaylists.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Reset page when filters or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters]);

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {toastMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-in fade-in slide-in-from-top-2">
            {toastMessage}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Explore Public Playlists
          </h1>
          <p className="text-gray-600">
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">Error loading playlists</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        )}

        <div className="mb-4 text-sm text-gray-600">
          {isLoading ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            totalResults +
            " playlist" +
            (totalResults !== 1 ? "s" : "") +
            " found"
          )}
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array(8)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
          </div>
        )}

        {!isLoading && paginatedPlaylists.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-6">
              <SearchX
                className="w-20 h-20 text-gray-300 mx-auto"
                aria-hidden="true"
              />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              No playlists found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or search query
            </p>
            <Button onClick={handleClearFilters} variant="outline">
              Clear all filters
            </Button>
          </div>
        )}

        {!isLoading && paginatedPlaylists.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence mode="wait">
                {paginatedPlaylists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onViewDetails={handleViewDetails}
                    onCopyLink={handleCopyLink}
                  />
                ))}
              </AnimatePresence>
            </div>

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
    </div>
  );
}
