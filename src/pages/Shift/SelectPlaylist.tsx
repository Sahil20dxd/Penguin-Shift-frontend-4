// src/pages/Shift/SelectPlaylist.tsx
// --------------------------------------------------------------------
// Select source platform, link OAuth, list playlists, and persist picks.
// Improvements:
// - Spinner fix (always stops via finally)
// - Robust OAuth polling with cleanup
// - Manual Refresh + Reconnect actions
// - Debounced search
// - Clearer error surfacing and state resets
// --------------------------------------------------------------------

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox"; // if you don't have this, swap to a native input
import {
  Search,
  ArrowRight,
  Music2,
  Loader2,
  ExternalLink,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  PlugZap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useShift } from "@/components/shift/ShiftContext";
import {
  checkLinkStatus,
  getLinkUrl,
  fetchPlaylists,
} from "@/components/shift/apiClient";
import { getApiBase } from "@/utils/apiConfig";
import { getErrorMessage } from "@/utils/userMessages";

// platform union
type Platform = "spotify" | "youtube";

// minimal playlist shape used by UI
type SourcePlaylist = {
  id: string;
  name: string;
  platform: Platform;
  songCount: number;
  coverImage?: string;
};

type FetchResult = { items?: SourcePlaylist[] };

// simple debounce
function useDebouncedValue<T>(val: T, ms: number) {
  const [d, setD] = useState(val);
  useEffect(() => {
    const t = setTimeout(() => setD(val), ms);
    return () => clearTimeout(t);
  }, [val, ms]);
  return d;
}

export default function SelectPlaylist() {
  const { sourcePlatform, selectedPlaylistIds, includeTracks, updateState } =
    useShift();

  const [localPlatform, setLocalPlatform] = useState<Platform>(
    sourcePlatform || "spotify"
  );
  const [isLinked, setIsLinked] = useState(false);
  const [isCheckingLink, setIsCheckingLink] = useState(false);

  const [playlists, setPlaylists] = useState<SourcePlaylist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebouncedValue(searchQuery, 180);

  const [expandedPlaylist, setExpandedPlaylist] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<number | null>(null);

  // initial + on platform switch
  useEffect(() => {
    updateState({ sourcePlatform: localPlatform });
    void checkPlatformLink(localPlatform);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localPlatform]);

  async function checkPlatformLink(platform: Platform) {
    setIsCheckingLink(true);
    setError(null);
    try {
      const resp = (await checkLinkStatus(platform)) as { linked: boolean };
      const linked = Boolean(resp?.linked);
      setIsLinked(linked);
      if (linked) {
        await loadPlaylists(platform);
      } else {
        setPlaylists([]);
      }
    } catch (err: any) {
      console.error("Link check failed:", err);
      const friendlyError = getErrorMessage(err, `verify your ${platform === 'spotify' ? 'Spotify' : 'YouTube Music'} connection`);
      setError(friendlyError);
      setIsLinked(false);
      setPlaylists([]);
    } finally {
      setIsCheckingLink(false);
    }
  }

  async function handlePlatformSwitch(platform: Platform) {
    // reset UI state on switch
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    setLocalPlatform(platform);
    setIsLinked(false);
    setPlaylists([]);
    setExpandedPlaylist(null);
    setError(null);
    updateState({
      sourcePlatform: platform,
      selectedPlaylistIds: [],
      includeTracks: {},
    });
  }

  async function handleLinkPlatform() {
    setError(null);
    try {
      const resp = (await getLinkUrl(localPlatform)) as { url: string };
      const url = resp?.url;
      if (!url) {
        setError("Unable to start the connection process. Please try again.");
        return;
      }

      const popup = window.open(
        url,
        "oauth",
        "width=600,height=700,scrollbars=yes"
      );
      if (!popup) {
        setError("Popup blocked. Please allow popups for this site.");
        return;
      }

      // clear any prior poll
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = window.setInterval(async () => {
        // Check if popup is closed (wrapped in try-catch to handle COOP errors)
        let isPopupClosed = false;
        try {
          isPopupClosed = popup.closed;
        } catch (e) {
          // Cross-Origin-Opener-Policy may block popup.closed check
          // In this case, we'll rely on link status polling instead
          isPopupClosed = false;
        }
        
        if (isPopupClosed) {
          if (pollRef.current) window.clearInterval(pollRef.current);
          pollRef.current = null;
          await checkPlatformLink(localPlatform);
          return;
        }
        try {
          const status = (await checkLinkStatus(localPlatform)) as {
            linked: boolean;
          };
          if (status?.linked) {
            if (pollRef.current) window.clearInterval(pollRef.current);
            pollRef.current = null;
            try {
              popup.close();
            } catch {}
            setIsLinked(true);
            await loadPlaylists(localPlatform);
          }
        } catch {
          // ignore transient polling errors
        }
      }, 1200) as unknown as number;

      window.setTimeout(() => {
        if (pollRef.current) {
          window.clearInterval(pollRef.current);
          pollRef.current = null;
        }
        // Check if popup is still open (wrapped in try-catch to handle COOP errors)
        let isPopupOpen = true;
        try {
          isPopupOpen = !popup.closed;
        } catch (e) {
          // Cross-Origin-Opener-Policy may block popup.closed check
          // Assume popup is still open and try to close it
          isPopupOpen = true;
        }
        
        if (isPopupOpen) {
          try {
            popup.close();
          } catch {}
          setError("Connection timed out. Please try connecting again.");
        }
      }, 120000);
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error("OAuth connection failed:", err);
      const friendlyError = getErrorMessage(err, `connect to ${localPlatform === "spotify" ? "Spotify" : "YouTube Music"}`);
      setError(friendlyError);
    }
  }

  async function loadPlaylists(platform: Platform) {
    setIsLoadingPlaylists(true);
    setError(null);
    try {
      const data = (await fetchPlaylists(platform)) as FetchResult;
      setPlaylists(Array.isArray(data?.items) ? data.items : []);
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes("401")) {
        setError(
          "Failed to load playlists from " +
            platform +
            ": authorization expired. Please reconnect your " +
            platform +
            " account and try again."
        );
      } else {
        setError("Failed to load playlists from " + platform + ": " + msg);
      }
      setPlaylists([]);
    } finally {
      // critical: always stop spinner
      setIsLoadingPlaylists(false);
    }
  }

  function handleTogglePlaylist(playlistId: string) {
    const newSelected = selectedPlaylistIds.includes(playlistId)
      ? selectedPlaylistIds.filter((id) => id !== playlistId)
      : [...selectedPlaylistIds, playlistId];

    const newInclude = { ...includeTracks };
    if (newSelected.includes(playlistId) && !newInclude[playlistId])
      newInclude[playlistId] = "ALL";
    else if (!newSelected.includes(playlistId)) delete newInclude[playlistId];

    updateState({
      sourcePlatform: localPlatform,
      selectedPlaylistIds: newSelected,
      includeTracks: newInclude,
    });
  }

  function handleIncludeAllToggle(checked: boolean) {
    // optional helper to include/exclude all selected
    const newInclude = { ...includeTracks };
    selectedPlaylistIds.forEach((pid) => {
      if (checked) newInclude[pid] = "ALL";
      else delete newInclude[pid];
    });
    updateState({
      sourcePlatform: localPlatform,
      selectedPlaylistIds,
      includeTracks: newInclude,
    });
  }

  // ---------------------------------------------
  // Force a brand-new OAuth login (fresh consent)
  // ---------------------------------------------
  async function handleReconnect() {
    try {
      setError(null);
      setIsLinked(false);
      setPlaylists([]);

      const API_BASE = getApiBase();
      const res = await fetch(
        `${API_BASE}/api/platforms/force-reconnect/${localPlatform}`,
        {
          method: "POST",
          credentials: "include", // Use HTTP-only cookies for authentication
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Even if token was cleared, proceed to open new OAuth link
      let data: any = null;
      try {
        data = await res.json();
      } catch {
        console.warn("Force reconnect: could not parse response");
      }

      if (data?.url) {
        // Directly open new OAuth window without user clicking again
        const popup = window.open(
          data.url,
          "oauth",
          "width=600,height=700,scrollbars=yes"
        );
        if (!popup) throw new Error("Popup blocked");
        const poll = window.setInterval(async () => {
          // Check if popup is closed (wrapped in try-catch to handle COOP errors)
          let isPopupClosed = false;
          try {
            isPopupClosed = popup.closed;
          } catch (e) {
            // Cross-Origin-Opener-Policy may block popup.closed check
            // In this case, we'll rely on link status polling instead
            isPopupClosed = false;
          }
          
          if (isPopupClosed) {
            clearInterval(poll);
            await checkPlatformLink(localPlatform);
          }
        }, 1200);
        window.setTimeout(() => clearInterval(poll), 120000);
      } else {
        // If no URL returned, fallback to manual link
        console.warn("No reconnect URL, falling back to normal link flow");
        await handleLinkPlatform();
      }
    } catch (err: any) {
      console.error("Reconnect failed:", err);
      setError("Reconnecting your account... Please wait.");
      await handleLinkPlatform();
    }
  }

  async function handleManualRefresh() {
    try {
      await loadPlaylists(localPlatform);
    } catch {
      setError("Could not refresh playlists. Please try again later.");
    }
  }

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return playlists;
    return playlists.filter((p) => p.name.toLowerCase().includes(q));
  }, [playlists, debouncedQuery]);

  const canContinue = selectedPlaylistIds.length > 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-indigo-50/30 p-4 md:p-6"
    >
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 md:mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Select Your Playlists
          </h1>
          <p className="text-sm md:text-base text-gray-600">
            Choose playlists to transfer from your account
          </p>
        </motion.div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              role="alert"
              className="mb-6 rounded-lg border-l-4 border-red-500 bg-gradient-to-r from-red-50 to-orange-50 px-4 md:px-6 py-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 text-xs font-bold">!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-red-800 font-semibold mb-1 text-sm md:text-base">
                    {error.includes("HTTP") || error.includes("401")
                      ? "Connection Issue"
                      : "Error"}
                  </p>
                  <p className="text-red-700 text-sm mb-3">
                    {error.includes("HTTP") || error.includes("401")
                      ? "Something went wrong. Please reconnect your account and try again."
                      : error}
                  </p>
                  <div className="flex gap-2">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        onClick={() => void handleReconnect()}
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        Reconnect
                      </Button>
                    </motion.div>
                    {isLinked && (
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          onClick={() => void handleManualRefresh()}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-100"
                        >
                          Retry
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 mb-6">
          <h2 className="text-base md:text-lg font-semibold mb-4">Source Platform</h2>

          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6">
            <Button
              variant={localPlatform === "spotify" ? "default" : "outline"}
              onClick={() => void handlePlatformSwitch("spotify")}
              className="flex-1 py-3 md:py-6 text-base md:text-lg"
            >
              Spotify
            </Button>
            <Button
              variant={localPlatform === "youtube" ? "default" : "outline"}
              onClick={() => void handlePlatformSwitch("youtube")}
              className="flex-1 py-3 md:py-6 text-base md:text-lg"
            >
              YouTube Music
            </Button>
          </div>

          {isCheckingLink ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-600" />
              <p className="text-gray-600">Checking connection...</p>
            </div>
          ) : !isLinked ? (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
              <ExternalLink
                className="w-12 h-12 mx-auto mb-4 text-gray-400"
                aria-hidden="true"
              />
              <p className="text-gray-600 mb-4">
                Connect your{" "}
                {localPlatform === "spotify" ? "Spotify" : "YouTube Music"}{" "}
                account
              </p>
              <Button
                onClick={() => void handleLinkPlatform()}
                className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
              >
                Connect Account
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200 flex-1 sm:flex-initial"
                >
                  <CheckCircle2
                    className="w-5 h-5 text-green-600 flex-shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-sm md:text-base text-green-700 font-medium">
                    Connected to{" "}
                    {localPlatform === "spotify" ? "Spotify" : "YouTube Music"}
                  </span>
                </motion.div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => void handleManualRefresh()}
                    disabled={isLoadingPlaylists}
                    title="Refresh playlists"
                    className="flex-1 sm:flex-initial py-3 md:py-6 min-h-[44px] md:min-h-0"
                  >
                    <RefreshCw
                      className={
                        "w-4 h-4 md:w-5 md:h-5 mr-2 " +
                        (isLoadingPlaylists ? "animate-spin" : "")
                      }
                    />
                    <span className="text-sm md:text-base">Refresh</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => void handleReconnect()}
                    title="Reconnect account"
                    className="flex-1 sm:flex-initial py-3 md:py-6 min-h-[44px] md:min-h-0"
                  >
                    <PlugZap className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                    <span className="text-sm md:text-base">Reconnect</span>
                  </Button>
                </div>
              </div>

              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="relative mb-4"
              >
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                  aria-hidden="true"
                />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your playlists..."
                  className="pl-10 h-12 md:h-10 text-base md:text-sm"
                  aria-label="Search your playlists"
                />
              </motion.div>

              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  id="includeAll"
                  checked={
                    selectedPlaylistIds.every(
                      (pid) => includeTracks[pid] === "ALL"
                    ) && selectedPlaylistIds.length > 0
                  }
                  onCheckedChange={(v: any) =>
                    handleIncludeAllToggle(Boolean(v))
                  }
                />
                <label
                  htmlFor="includeAll"
                  className="text-sm text-gray-700 select-none"
                >
                  Include all tracks in selected playlists
                </label>
              </div>

              {isLoadingPlaylists ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {Array(3).fill(0).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.2 }}
                      className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="w-12 h-12 bg-gray-200 rounded-lg animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                        <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : filtered.length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-8"
                >
                  <p className="text-sm md:text-base text-gray-500 mb-2">
                    {playlists.length === 0
                      ? "No playlists found"
                      : "No matching playlists"}
                  </p>
                  <p className="text-xs md:text-sm text-gray-400">
                    Tip: click Refresh if you just created a playlist.
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((pl, index) => {
                    const selected = selectedPlaylistIds.includes(pl.id);
                    return (
                      <motion.div
                        key={pl.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        whileTap={{ scale: 0.98 }}
                        className="border-2 border-gray-200 rounded-lg overflow-hidden active:border-purple-300 transition-colors duration-150"
                      >
                        <div
                          className={
                            (selected
                              ? "bg-purple-50 border-purple-500 "
                              : "bg-white hover:bg-gray-50 ") +
                            "p-4 cursor-pointer transition-all"
                          }
                          onClick={() => handleTogglePlaylist(pl.id)}
                          role="button"
                          aria-pressed={selected}
                          aria-label={"Toggle selection for " + pl.name}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                              {pl.coverImage ? (
                                <img
                                  src={pl.coverImage}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Music2
                                  className="w-6 h-6 text-white"
                                  aria-hidden="true"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate">
                                {pl.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {pl.songCount} songs
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {selected && (
                                <CheckCircle2
                                  className="w-6 h-6 text-purple-600 flex-shrink-0"
                                  aria-hidden="true"
                                />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedPlaylist(
                                    expandedPlaylist === pl.id ? null : pl.id
                                  );
                                }}
                                className="p-1 hover:bg-gray-200 rounded"
                                aria-expanded={expandedPlaylist === pl.id}
                                aria-label="Toggle song panel"
                              >
                                {expandedPlaylist === pl.id ? (
                                  <ChevronUp className="w-5 h-5 text-gray-600" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-600" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        {expandedPlaylist === pl.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="p-4 bg-gray-50 border-t border-gray-200"
                          >
                            <p className="text-sm text-gray-600 italic">
                              Individual song selection coming soon. For now,
                              all songs will be transferred.
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-between items-center">
          <Link to={createPageUrl("LandingPage")}>
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <Link
            to={createPageUrl("SelectDestination") + `?source=${localPlatform}`}
            onClick={() => updateState({ sourcePlatform: localPlatform })}
          >
            <Button
              disabled={!canContinue}
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Choose Destination
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
