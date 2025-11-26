// src/components/explore/AppliedFiltersChips.tsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

type ExploreFilters = {
  platform: string;
  genre: string;
  sort: string;
  minTracks: string;
  maxTracks: string;
  createdFrom: string;
};

type AppliedFiltersChipsProps = {
  filters: ExploreFilters;
  onRemoveFilter: (key: keyof ExploreFilters) => void;
  onClearAll: () => void;
};

/**
 * AppliedFiltersChips:
 * - Shows active filters as removable chips.
 * - Hides sort (always visible elsewhere) and empty/default filters.
 */
export default function AppliedFiltersChips({
  filters,
  onRemoveFilter,
  onClearAll,
}: AppliedFiltersChipsProps) {
  const activeFilters = Object.entries(filters).filter(([key, value]) => {
    if (key === "sort") return false;
    return value && value !== "all" && value !== "";
  });

  if (activeFilters.length === 0) return null;

  const filterLabels: Record<keyof ExploreFilters, string> = {
    platform: "Platform",
    genre: "Genre",
    sort: "Sort", // not shown because we filter it out above
    minTracks: "Min Tracks",
    maxTracks: "Max Tracks",
    createdFrom: "Created From",
  };

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="flex flex-wrap items-center gap-2 mb-4"
    >
      <motion.span 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-sm font-medium text-gray-600"
      >
        Active filters:
      </motion.span>

      <AnimatePresence mode="popLayout">
        {activeFilters.map(([key, value], index) => {
          const typedKey = key as keyof ExploreFilters;
          return (
            <motion.div
              key={key + String(value)}
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              transition={{ delay: index * 0.05 }}
            >
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-800 hover:bg-purple-200 pl-3 pr-2 py-1 gap-2 transition-colors cursor-default"
              >
                <span className="text-xs">
                  {filterLabels[typedKey]}: <strong>{value}</strong>
                </span>
                <motion.button
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onRemoveFilter(typedKey)}
                  className="hover:bg-purple-300 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${filterLabels[typedKey]} filter`}
                >
                  <X className="w-3 h-3" />
                </motion.button>
              </Badge>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {activeFilters.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="text-xs text-gray-600 hover:text-gray-900"
          >
            Clear all
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}

