// src/components/explore/AppliedFiltersChips.tsx
import React from "react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <span className="text-sm font-medium text-gray-600">Active filters:</span>

      {activeFilters.map(([key, value]) => {
        const typedKey = key as keyof ExploreFilters;
        return (
          <Badge
            key={key + String(value)}
            variant="secondary"
            className="bg-purple-100 text-purple-800 hover:bg-purple-200 pl-3 pr-2 py-1 gap-2"
          >
            <span className="text-xs">
              {filterLabels[typedKey]}: <strong>{value}</strong>
            </span>
            <button
              onClick={() => onRemoveFilter(typedKey)}
              className="hover:bg-purple-300 rounded-full p-0.5"
              aria-label={`Remove ${filterLabels[typedKey]} filter`}
            >
              <X className="w-3 h-3" />
            </button>
          </Badge>
        );
      })}

      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="text-xs text-gray-600 hover:text-gray-900"
      >
        Clear all
      </Button>
    </div>
  );
}

