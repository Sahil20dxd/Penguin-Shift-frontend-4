// src/components/explore/AutocompleteSearchBar.tsx
import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { getExplorePublicPlaylists, type PublicPlaylist } from "@/api/publicPlaylists";

type AutocompleteSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onSelect?: (value: string) => void;
};

/**
 * AutocompleteSearchBar:
 * Enhanced search bar with autocomplete suggestions.
 * Shows suggestions dropdown as user types (after 2+ characters).
 */
export default function AutocompleteSearchBar({
  value,
  onChange,
  onClear,
  onSelect,
}: AutocompleteSearchBarProps) {
  const [suggestions, setSuggestions] = useState<PublicPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions when value changes (debounced)
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't fetch if query is too short
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce API call
    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Fetch suggestions with limit
        const result = await getExplorePublicPlaylists({
          search: value.trim(),
          limit: 5, // Limit to 5 suggestions
          page: 1,
        });

        // Handle both paginated and array responses
        const playlists = Array.isArray(result)
          ? result
          : (result as any)?.playlists || [];

        setSuggestions(playlists);
        setShowSuggestions(playlists.length > 0);
        setSelectedIndex(-1);
      } catch (err) {
        console.error("[AutocompleteSearchBar] Error fetching suggestions:", err);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [value]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        onChange(value);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex].title);
        } else {
          onChange(value);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    if (onSelect) {
      onSelect(suggestion);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 200);
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative"
      >
        <motion.div
          animate={{
            scale: value ? [1, 1.1, 1] : 1,
            rotate: value ? [0, -5, 5, 0] : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10"
            aria-hidden="true"
          />
        </motion.div>
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder="Search public playlists…"
          className="pl-10 pr-10 h-11 md:h-11 text-sm md:text-sm border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 focus:ring-purple-500 dark:focus:ring-purple-400 transition-all duration-200"
          aria-label="Search public playlists"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls="search-suggestions"
        />
        <AnimatePresence>
          {value && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-10"
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onClear}
                className="h-10 w-10 md:h-8 md:w-8 hover:bg-purple-50 dark:hover:bg-purple-900/20 active:bg-purple-100 dark:active:bg-purple-900/30 touch-manipulation"
                aria-label="Clear search"
              >
                <X className="w-5 h-5 md:w-4 md:h-4" />
              </Button>
            </motion.div>
          )}
          {isLoading && value.trim().length >= 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute right-12 top-1/2 -translate-y-1/2 z-10"
            >
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            id="search-suggestions"
            className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            role="listbox"
          >
            {suggestions.map((playlist, index) => (
              <motion.div
                key={playlist.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  px-4 py-3 cursor-pointer transition-colors
                  ${
                    selectedIndex === index
                      ? "bg-purple-100 dark:bg-purple-900/30 text-purple-900 dark:text-purple-100"
                      : "hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-900 dark:text-gray-100"
                  }
                `}
                onClick={() => handleSelectSuggestion(playlist.title)}
                onMouseEnter={() => setSelectedIndex(index)}
                role="option"
                aria-selected={selectedIndex === index}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {playlist.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      by {playlist.ownerName || "Anonymous"}
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-xs text-gray-500 dark:text-gray-400">
                    {playlist.trackCount} tracks
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

